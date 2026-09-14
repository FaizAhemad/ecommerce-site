import { test } from 'node:test'
import assert from 'node:assert/strict'
import { policyKey, parsePolicy, updatePolicy } from '../server/api/_lib/policies.ts'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

async function handler(file) {
  const source = ts
    .transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replace(
      /^import (.+?) from ['"][^'"]+['"];?$/gm,
      (_line, binding) => `const ${binding}=globalThis.policyFixture`,
    )
  return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`))
    .default
}
function response() {
  return {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
    setHeader(name, value) {
      this.headers[name] = value
    },
  }
}
test('public policy response excludes unpublished draft and actor history fields', async () => {
  const state = {
    version: 3,
    draft: { title: 'Private draft', text: 'SECRET DRAFT' },
    published: {
      title: 'Published',
      text: 'Visible text',
      version: 2,
      publishedAt: '2026-09-14T00:00:00Z',
      actorId: 'PRIVATE ACTOR',
    },
  }
  globalThis.policyFixture = {
    db: { storeSetting: { findUnique: async () => ({ value: JSON.stringify(state) }) } },
    policyKey,
    parsePolicy,
    requestId: () => 'test',
    setCacheControl: () => {},
    sendError: () => {
      throw new Error('Unexpected policy error')
    },
  }
  const run = await handler('../server/api/policies.ts'),
    result = response()
  await run({ method: 'GET', query: { kind: 'privacy', locale: 'en' } }, result)
  assert.equal(result.body.policy.text, 'Visible text')
  assert.doesNotMatch(JSON.stringify(result.body), /SECRET|PRIVATE|draft|actorId/)
})
test('generic settings cannot overwrite policy publication or audit records', async () => {
  globalThis.policyFixture = {
    db: {
      $transaction: () => {
        throw new Error('Must not write reserved keys')
      },
    },
    requireAdmin: async () => ({ id: 'admin' }),
    requestId: () => 'test',
    bodyRecord: (request) => request.body,
    sendError: (res, status, _code, message) => res.status(status).json({ message }),
  }
  const run = await handler('../server/api/admin/settings.ts')
  for (const key of ['policy.privacy.en', 'policy-history.privacy.en.1', 'audit.fake']) {
    const result = response()
    await run({ method: 'PUT', body: { [key]: 'injected' } }, result)
    assert.equal(result.statusCode, 400)
  }
})

function fixture() {
  let records = new Map()
  const store = {
    $transaction: async (action, options) => {
      assert.equal(options.isolationLevel, 'Serializable')
      const draft = new Map(records)
      const result = await action({
        storeSetting: {
          findUnique: async ({ where }) =>
            draft.has(where.key) ? { value: draft.get(where.key) } : null,
          upsert: async ({ where, create, update }) =>
            draft.set(where.key, draft.has(where.key) ? update.value : create.value),
          create: async ({ data }) => {
            if (draft.has(data.key)) throw new Error('Duplicate history')
            draft.set(data.key, data.value)
          },
        },
      })
      records = draft
      return result
    },
  }
  return { store, records: () => records }
}
const input = {
  kind: 'privacy',
  locale: 'en',
  action: 'draft',
  expectedVersion: 0,
  title: 'Owner text',
  text: 'Synthetic approved source, not a legal policy.',
}
test('policy selectors reject arbitrary settings keys and malformed stored states', () => {
  assert.equal(policyKey('privacy', 'mr'), 'policy.privacy.mr')
  for (const values of [
    ['audit', 'en'],
    ['privacy', '../secret'],
    ['privacy', ['en']],
  ])
    assert.throws(() => policyKey(...values), { status: 400 })
  assert.deepEqual(parsePolicy(), { version: 0, draft: null, published: null })
  assert.throws(() => parsePolicy('{}'), { status: 503 })
})
test('saving a draft never publishes it and publication requires explicit approval', async () => {
  const f = fixture()
  const draft = await updatePolicy(f.store, 'admin', input)
  assert.equal(draft.published, null)
  await assert.rejects(
    updatePolicy(f.store, 'admin', { ...input, expectedVersion: 1, action: 'publish' }),
    { status: 400 },
  )
  assert.equal(f.records().size, 1)
})
test('publication records an immutable snapshot and actor audit in the same transaction', async () => {
  const f = fixture()
  await updatePolicy(f.store, 'admin', input)
  const published = await updatePolicy(f.store, 'admin', {
    ...input,
    action: 'publish',
    expectedVersion: 1,
    approved: true,
  })
  assert.equal(published.published.version, 2)
  assert.equal(published.published.text, input.text)
  assert.equal(JSON.parse(f.records().get('policy-history.privacy.en.2')).actorId, 'admin')
  const audit = [...f.records()].find(([key]) => key.startsWith('audit.'))
  assert.equal(JSON.parse(audit[1]).action, 'policy.published')
})
test('new drafts preserve published text and stale saves cannot replace it', async () => {
  const f = fixture()
  await updatePolicy(f.store, 'admin', input)
  await updatePolicy(f.store, 'admin', {
    ...input,
    action: 'publish',
    expectedVersion: 1,
    approved: true,
  })
  const next = await updatePolicy(f.store, 'admin', {
    ...input,
    expectedVersion: 2,
    text: 'New private draft',
  })
  assert.equal(next.published.text, input.text)
  await assert.rejects(updatePolicy(f.store, 'admin', { ...input, expectedVersion: 2 }), {
    status: 409,
  })
  assert.equal(parsePolicy(f.records().get('policy.privacy.en')).draft.text, 'New private draft')
})
test('policy title and content limits are enforced before mutation', async () => {
  for (const change of [
    { title: '' },
    { text: '' },
    { title: 'x'.repeat(121) },
    { text: 'x'.repeat(50001) },
  ]) {
    const f = fixture()
    await assert.rejects(updatePolicy(f.store, 'admin', { ...input, ...change }), { status: 400 })
    assert.equal(f.records().size, 0)
  }
})
