import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { consumeVerification } from '../server/api/_lib/verification.ts'
import { passwordResetLink } from '../server/api/_lib/reset-link.ts'
import {
  cleanResetUrl,
  passwordValidation,
  readResetToken,
  submitPasswordRecovery,
} from '../src/api/passwordRecovery.ts'
import { clearCsrfToken } from '../src/api/csrf.ts'

const token = 'a'.repeat(64)
const hash = (value) => createHash('sha256').update(value).digest('hex')
function fixture(options = {}) {
  let state = {
    tokens: [
      {
        id: 't',
        userId: 'a',
        tokenHash: hash(token),
        purpose: options.purpose ?? 'PASSWORD_RESET',
        usedAt: options.used ? new Date() : null,
        expiresAt: new Date(Date.now() + (options.expired ? -1000 : 60000)),
      },
      {
        id: 'other',
        userId: 'b',
        tokenHash: hash('b'.repeat(64)),
        purpose: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      },
    ],
    users: {
      a: { id: 'a', email: 'a@example.test', passwordHash: 'old' },
      b: { id: 'b', passwordHash: 'other' },
    },
    sessions: ['a', 'a', 'b'],
    changes: 0,
  }
  let tail = Promise.resolve()
  const matches = (row, where) =>
    Object.entries(where).every(([key, value]) =>
      key === 'expiresAt' ? row.expiresAt > value.gt : row[key] === value,
    )
  const store = {
    user: {
      findUnique: async ({ where }) =>
        options.unknown
          ? null
          : where.email === 'a@example.test' || where.phone === '+919876543210'
            ? state.users.a
            : null,
    },
    $transaction(callback, config) {
      assert.equal(config.isolationLevel, 'Serializable')
      assert.ok(config.timeout <= 10000)
      const job = tail.then(async () => {
        if (options.conflict) throw { code: 'P2034' }
        const draft = structuredClone(state)
        const tx = {
          verificationToken: {
            findFirst: async ({ where }) => draft.tokens.find((row) => matches(row, where)) ?? null,
            updateMany: async ({ where, data }) => {
              if (options.lostClaim && where.id) return { count: 0 }
              const rows = draft.tokens.filter((row) => matches(row, where))
              rows.forEach((row) => Object.assign(row, data))
              return { count: rows.length }
            },
            deleteMany: async ({ where }) => {
              draft.tokens = draft.tokens.filter((row) => !matches(row, where))
              return { count: 1 }
            },
            create: async ({ data }) => {
              draft.tokens.push({ id: 'new', usedAt: null, ...data })
              return data
            },
          },
          user: {
            update: async ({ where, data }) => {
              draft.changes++
              Object.assign(draft.users[where.id], data)
              return draft.users[where.id]
            },
          },
          session: {
            deleteMany: async ({ where }) => {
              if (options.failSessions) throw new Error('private-secret')
              draft.sessions = draft.sessions.filter((id) => id !== where.userId)
              return { count: 2 }
            },
          },
        }
        const result = await callback(tx)
        state = draft
        return result
      })
      tail = job.catch(() => {})
      return job
    },
  }
  return { store, state: () => state }
}
function response() {
  return {
    headers: {},
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
    },
    setHeader(key, value) {
      this.headers[key] = value
    },
  }
}
let revision = 0
async function load(file, rewrite, transform = (s) => s) {
  const js = ts
    .transpileModule(transform(readFileSync(new URL(file, import.meta.url), 'utf8')), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    })
    .outputText.replace(
      /^import (.+?) from ['"]([^'"]+)['"];?$/gm,
      (line, binding, path) => rewrite(binding, path) ?? line,
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(js + `\n// ${revision++}`).toString('base64')}`
  )
}
async function handler(name, store, config = {}) {
  globalThis.recoveryFixture = {
    store,
    sent: [],
    env: { APP_URL: 'https://shop.test', NODE_ENV: 'production', ...config },
    auth: {
      hashPassword: async (value) => hash(value),
      expireSessionCookie: (result) =>
        result.setHeader('Set-Cookie', 'gadgify_session=; Max-Age=0'),
    },
    sendTransactionalEmail: async (...args) => {
      globalThis.recoveryFixture.sent.push(args)
      if (config.failEmail) throw new Error('private-secret')
      return !config.emailFalse
    },
  }
  return (
    await load(
      `../server/api/auth/${name}.ts`,
      (binding, path) => {
        if (path.endsWith('/db.js')) return 'const db = globalThis.recoveryFixture.store'
        if (path.endsWith('/auth.js')) return `const ${binding} = globalThis.recoveryFixture.auth`
        if (path.endsWith('/email.js')) return `const ${binding} = globalThis.recoveryFixture`
        if (path.startsWith('../_lib/'))
          return `import ${binding} from ${JSON.stringify(new URL(`../server/api/_lib/${path.split('/').at(-1).replace('.js', '.ts')}`, import.meta.url).href)}`
      },
      (source) =>
        source.replace(/process\.env\.(APP_URL|NODE_ENV)/g, 'globalThis.recoveryFixture.env.$1'),
    )
  ).default
}

test('two reset requests using one link change the password once and revoke only its owner sessions', async () => {
  const f = fixture(),
    reset = await handler('password-reset', f.store)
  const results = [response(), response()]
  await Promise.all(
    results.map((result) =>
      reset({ method: 'POST', body: { token, password: 'new-password' } }, result),
    ),
  )
  assert.deepEqual(results.map((r) => r.code).sort(), [200, 400])
  assert.equal(f.state().changes, 1)
  assert.equal(f.state().users.a.passwordHash, hash('new-password'))
  assert.equal(f.state().users.b.passwordHash, 'other')
  assert.deepEqual(f.state().sessions, ['b'])
  assert.match(results.find((r) => r.code === 200).headers['Set-Cookie'], /Max-Age=0/)
  assert.doesNotMatch(JSON.stringify(results.map((r) => r.body)), /new-password|passwordHash/)
})

test('expired, used, wrong-purpose, lost claims and transaction conflicts cannot reset passwords', async () => {
  for (const options of [
    { expired: true },
    { used: true },
    { purpose: 'EMAIL_VERIFICATION' },
    { lostClaim: true },
    { conflict: true },
  ]) {
    const f = fixture(options),
      reset = await handler('password-reset', f.store),
      result = response()
    await reset({ method: 'POST', body: { token, password: 'new-password' } }, result)
    assert.equal(result.code, 400)
    assert.equal(result.body.error.code, 'INVALID_TOKEN')
    assert.equal(f.state().changes, 0)
    assert.deepEqual(f.state().sessions, ['a', 'a', 'b'])
  }
})

test('session revocation failure rolls back the password and token consumption', async () => {
  const f = fixture({ failSessions: true }),
    reset = await handler('password-reset', f.store),
    result = response()
  await reset({ method: 'POST', body: { token, password: 'new-password' } }, result)
  assert.equal(result.code, 503)
  assert.equal(f.state().users.a.passwordHash, 'old')
  assert.equal(f.state().tokens[0].usedAt, null)
  assert.equal(result.headers['Set-Cookie'], undefined)
  assert.doesNotMatch(JSON.stringify(result.body), /private-secret/)
})

test('reset rejects malformed tokens and password size bounds before transaction', async () => {
  const reset = await handler('password-reset', {
    $transaction: () => assert.fail('transaction reached'),
  })
  for (const body of [
    { token: 'bad', password: 'new-password' },
    { token, password: 'short' },
    { token, password: 'x'.repeat(129) },
  ]) {
    const result = response()
    await reset({ method: 'POST', body }, result)
    assert.equal(result.code, 400)
    assert.match(result.headers['Cache-Control'], /no-store/)
  }
})

test('shared verification claim respects user binding and rolls back failed verification', async () => {
  const f = fixture({ purpose: 'EMAIL_VERIFICATION' })
  assert.equal(
    await consumeVerification(
      f.store,
      { tokenHash: hash(token), purpose: 'EMAIL_VERIFICATION', userId: 'b' },
      () => assert.fail(),
    ),
    false,
  )
  await assert.rejects(
    consumeVerification(
      f.store,
      { tokenHash: hash(token), purpose: 'EMAIL_VERIFICATION' },
      async () => {
        throw new Error('failed')
      },
    ),
  )
  assert.equal(f.state().tokens[0].usedAt, null)
})

test('email and mobile verification cannot consume a token twice', async () => {
  for (const name of ['verify-email', 'mobile-verify']) {
    const f = fixture({
      purpose: name === 'verify-email' ? 'EMAIL_VERIFICATION' : 'MOBILE_VERIFICATION',
    })
    if (name === 'mobile-verify') f.state().tokens[0].tokenHash = hash('123456')
    const verify = await handler(name, f.store),
      results = [response(), response()]
    const body = name === 'verify-email' ? { token } : { phone: '+919876543210', code: '123456' }
    await Promise.all(results.map((result) => verify({ method: 'POST', body }, result)))
    assert.deepEqual(results.map((r) => r.code).sort(), [200, 400])
    assert.equal(f.state().changes, 1)
  }
})

test('forgot password replaces owner links, hashes token, expires in one hour, and emails only configured origin', async () => {
  const f = fixture(),
    forgot = await handler('password-reset-request', f.store),
    result = response()
  await forgot(
    { method: 'POST', headers: { host: 'evil.test' }, body: { email: ' A@EXAMPLE.TEST ' } },
    result,
  )
  assert.equal(result.code, 200)
  assert.equal(result.body.accepted, true)
  assert.equal(f.state().tokens.length, 2)
  const [to, , html] = globalThis.recoveryFixture.sent[0]
  assert.equal(to, 'a@example.test')
  assert.match(html, /https:\/\/shop.test\/reset-password#token=/)
  assert.doesNotMatch(html, /evil.test/)
  const issued = html.match(/#token=([a-f0-9]{64})/)[1]
  const stored = f.state().tokens.find((t) => t.userId === 'a')
  assert.equal(stored.tokenHash, hash(issued))
  assert.ok(stored.expiresAt > new Date(Date.now() + 3590000))
  assert.equal(f.state().users.a.passwordHash, 'old')
  assert.deepEqual(f.state().sessions, ['a', 'a', 'b'])
  assert.doesNotMatch(JSON.stringify(result.body), new RegExp(issued))
})

test('forgot password stays neutral for unknown accounts, provider failure and invalid configuration', async () => {
  for (const options of [
    { unknown: true },
    { failEmail: true },
    { APP_URL: undefined },
    { APP_URL: 'http://shop.test' },
    { emailFalse: true },
  ]) {
    const f = fixture(options),
      forgot = await handler('password-reset-request', f.store, options),
      result = response()
    await forgot({ method: 'POST', body: { email: 'a@example.test' } }, result)
    assert.equal(result.code, 200)
    assert.equal(result.body.accepted, true)
    assert.deepEqual(Object.keys(result.body).sort(), ['accepted', 'requestId'])
    assert.match(result.headers['Cache-Control'], /no-store/)
  }
})

test('reset link configuration rejects unsafe origins and never carries a token in the query', () => {
  for (const base of [
    undefined,
    'javascript:alert(1)',
    'https://user:password@shop.test',
    'http://shop.test',
  ])
    assert.throws(() => passwordResetLink(base, token, true))
  const url = new URL(passwordResetLink('https://shop.test/ignored?tracking=1', token, true))
  assert.equal(url.pathname, '/reset-password')
  assert.equal(url.search, '')
  assert.equal(url.hash, `#token=${token}`)
  assert.match(passwordResetLink('http://localhost:3000', token, false), /^http:/)
})

test('client accepts new fragments and legacy query links and strips secrets from visible URL', () => {
  for (const suffix of [`?token=${token}`, `#token=${token}`]) {
    assert.equal(readResetToken(`https://shop.test/reset-password${suffix}`), token)
    assert.equal(cleanResetUrl(`https://shop.test/reset-password${suffix}`), '/reset-password')
  }
  assert.equal(readResetToken('https://shop.test/reset-password?token=bad'), '')
  assert.ok(passwordValidation('short', 'short'))
  assert.ok(passwordValidation('valid-password', 'different'))
  assert.equal(passwordValidation('valid-password', 'valid-password'), undefined)
})

test('recovery client preserves request drafts, rejects unconfirmed outcomes and never retries', async () => {
  for (const [body, status] of [
    [{ error: { message: 'This reset link is invalid or expired.' } }, 400],
    [{}, 200],
  ]) {
    clearCsrfToken()
    let calls = 0
    globalThis.window = {
      setTimeout,
      clearTimeout,
      fetch: async (url, init) => {
        if (url === '/api/auth/csrf') return Response.json({ csrfToken: 'b'.repeat(64) })
        calls++
        assert.deepEqual(JSON.parse(init.body), { token, password: 'draft-password' })
        return Response.json(body, { status })
      },
    }
    await assert.rejects(
      submitPasswordRecovery(
        'reset',
        { token, password: 'draft-password' },
        new AbortController().signal,
      ),
    )
    assert.equal(calls, 1)
  }
})

function findElement(node, type) {
  if (!node || typeof node !== 'object') return undefined
  if (node.type === type) return node
  for (const child of [node.props?.children].flat(Infinity)) {
    const result = findElement(child, type)
    if (result) return result
  }
}

test('recovery form blocks duplicate clicks, keeps failed passwords and strips token from address bar', async () => {
  const states = [token, '', 'new-password', 'new-password'],
    notices = [],
    effects = []
  let slot = 0,
    calls = 0,
    reject
  const location = {
    href: `https://shop.test/reset-password#token=${token}`,
    assign() {
      assert.fail('failure must not navigate')
    },
  }
  globalThis.window = {
    location,
    history: {
      state: null,
      replaceState(_state, _title, url) {
        location.href = `https://shop.test${url}`
      },
    },
  }
  globalThis.pageFixture = {
    useRef: () => ({ current: null }),
    useEffect: (callback) => effects.push(callback),
    useState: (initial) => {
      const index = slot++
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial
      return [
        states[index],
        (value) => {
          states[index] = value
        },
      ]
    },
    useNotification: () => (value) => notices.push(value),
    cleanResetUrl,
    passwordValidation,
    readResetToken,
    submitPasswordRecovery: () => {
      calls++
      return new Promise((_resolve, fail) => {
        reject = fail
      })
    },
  }
  const { PasswordRecoveryPage } = await load(
    '../src/pages/PasswordRecoveryPage.tsx',
    (binding, path) =>
      path === 'react/jsx-runtime'
        ? `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
        : `const ${binding} = globalThis.pageFixture`,
  )
  const form = findElement(
    PasswordRecoveryPage({ mode: 'reset', onNavigate: () => () => {} }),
    'form',
  )
  effects.forEach((effect) => effect())
  assert.equal(location.href, 'https://shop.test/reset-password')
  const pending = form.props.onSubmit({ preventDefault() {} })
  await form.props.onSubmit({ preventDefault() {} })
  assert.equal(calls, 1)
  reject(new Error('Temporary failure'))
  await pending
  assert.equal(states[2], 'new-password')
  assert.equal(states[3], 'new-password')
  assert.equal(notices[0].message, 'Temporary failure')
})

test('forgot-password client submits only email and accepts neutral acknowledgment', async () => {
  clearCsrfToken()
  let writes = 0
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: async (url, init) => {
      if (url === '/api/auth/csrf') return Response.json({ csrfToken: 'b'.repeat(64) })
      writes++
      assert.equal(url, '/api/auth/password-reset-request')
      assert.deepEqual(JSON.parse(init.body), { email: 'a@example.test' })
      return Response.json({ accepted: true })
    },
  }
  await submitPasswordRecovery(
    'forgot',
    { email: 'a@example.test', password: 'not-sent', token },
    new AbortController().signal,
  )
  assert.equal(writes, 1)
})

test('recovery form success clears password drafts and navigates to regular login', async () => {
  const states = [token, '', 'new-password', 'new-password'],
    destinations = [],
    broadcasts = []
  let slot = 0
  const original = globalThis.BroadcastChannel
  globalThis.BroadcastChannel = class {
    postMessage(message) {
      broadcasts.push(message)
    }
    close() {}
  }
  globalThis.window = {
    location: {
      href: `https://shop.test/reset-password#token=${token}`,
      assign: (value) => destinations.push(value),
    },
  }
  globalThis.pageFixture = {
    useRef: () => ({ current: null }),
    useEffect: () => {},
    useState: (initial) => {
      const index = slot++
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial
      return [
        states[index],
        (value) => {
          states[index] = value
        },
      ]
    },
    useNotification: () => () => {},
    cleanResetUrl,
    passwordValidation,
    readResetToken,
    submitPasswordRecovery: async () => {},
  }
  try {
    const { PasswordRecoveryPage } = await load(
      '../src/pages/PasswordRecoveryPage.tsx',
      (binding, path) =>
        path === 'react/jsx-runtime'
          ? `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
          : `const ${binding} = globalThis.pageFixture`,
    )
    const form = findElement(
      PasswordRecoveryPage({ mode: 'reset', onNavigate: () => () => {} }),
      'form',
    )
    await form.props.onSubmit({ preventDefault() {} })
    assert.equal(states[2], '')
    assert.equal(states[3], '')
    assert.deepEqual(destinations, ['/login?passwordReset=success'])
    assert.deepEqual(broadcasts, ['changed'])
  } finally {
    globalThis.BroadcastChannel = original
  }
})
