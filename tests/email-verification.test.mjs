import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import { rateLimitRule } from '../server/api/_lib/rate-limit.ts'
import { submitEmailVerification, getEmailStatus } from '../src/api/emailVerification.ts'
import { clearCsrfToken } from '../src/api/csrf.ts'
import * as http from '../server/api/_lib/http.ts'

let revision = 0
async function load(file, rewrite) {
  const js = ts
    .transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
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
    `data:text/javascript;base64,${Buffer.from(js + `\n//${revision++}`).toString('base64')}`
  )
}
const { issueEmailVerification, emailVerificationLink } = await load(
  '../server/api/_lib/email-verification.ts',
  (binding, path) =>
    path === './reset-link.js'
      ? `import ${binding} from ${JSON.stringify(new URL('../server/api/_lib/reset-link.ts', import.meta.url).href)}`
      : undefined,
)
function fixture(user = { email: 'owner@example.test', emailVerifiedAt: null }, conflict = false) {
  const calls = [],
    sent = []
  const store = {
    $transaction: async (action, config) => {
      assert.equal(config.isolationLevel, 'Serializable')
      if (conflict) throw { code: 'P2034' }
      return action({
        user: {
          findUnique: async (args) => {
            calls.push(args)
            return user
          },
        },
        verificationToken: {
          deleteMany: async (args) => calls.push(args),
          create: async (args) => calls.push(args),
        },
      })
    },
  }
  return {
    store,
    calls,
    sent,
    send: async (...args) => {
      sent.push(args)
      return true
    },
  }
}
test('verification links use configured HTTPS origin and a fragment, rejecting unsafe origins', () => {
  const token = 'a'.repeat(64)
  assert.equal(
    emailVerificationLink('https://shop.test/path', token, true),
    `https://shop.test/verify-email#token=${token}`,
  )
  for (const base of [
    undefined,
    'http://shop.test',
    'https://user:pass@shop.test',
    'javascript:alert(1)',
  ])
    assert.throws(() => emailVerificationLink(base, token, true))
})
test('issuance replaces only owner email tokens, hashes a random token and sends to stored recipient', async () => {
  const f = fixture()
  assert.equal(
    await issueEmailVerification(f.store, 'owner', 'https://shop.test', true, f.send),
    'sent',
  )
  assert.deepEqual(f.calls[1], { where: { userId: 'owner', purpose: 'EMAIL_VERIFICATION' } })
  const data = f.calls[2].data
  const token = f.sent[0][2].match(/#token=([a-f0-9]{64})/)[1]
  assert.equal(data.tokenHash, createHash('sha256').update(token).digest('hex'))
  assert.notEqual(data.tokenHash, token)
  assert.equal(f.sent[0][0], 'owner@example.test')
  assert.ok(data.expiresAt > new Date(Date.now() + 23 * 3600000))
  assert.ok(data.expiresAt <= new Date(Date.now() + 24 * 3600000))
})
test('verified and email-less accounts receive no new tokens or messages', async () => {
  for (const [user, outcome] of [
    [{ email: 'owner@example.test', emailVerifiedAt: new Date() }, 'verified'],
    [{ email: null }, 'missing'],
  ]) {
    const f = fixture(user)
    assert.equal(
      await issueEmailVerification(f.store, 'owner', 'https://shop.test', true, f.send),
      outcome,
    )
    assert.equal(f.calls.length, 1)
    assert.equal(f.sent.length, 0)
  }
})
test('issuance does not replay transaction conflicts or falsely confirm provider failure', async () => {
  const f = fixture(undefined, true)
  await assert.rejects(issueEmailVerification(f.store, 'owner', 'https://shop.test', true, f.send))
  assert.equal(f.sent.length, 0)
  assert.equal(
    await issueEmailVerification(
      fixture().store,
      'owner',
      'https://shop.test',
      true,
      async () => false,
    ),
    'failed',
  )
})
test('resend has account and IP quotas while verification and login retain their policies', () => {
  assert.deepEqual(rateLimitRule('auth/email-verification-request', 'POST'), {
    scope: 'email-verification-send',
    seconds: 600,
    ip: 5,
    user: 3,
  })
  assert.equal(rateLimitRule('auth/email-verification-request', 'GET'), null)
  assert.equal(rateLimitRule('auth/verify-email', 'POST').ip, 20)
  assert.equal(rateLimitRule('auth/login', 'POST').ip, 10)
})
function browser(body, status = 200) {
  clearCsrfToken()
  const calls = []
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: async (url, init) => {
      if (url === '/api/auth/csrf') return Response.json({ csrfToken: 'a'.repeat(64) })
      calls.push({ url, init })
      return Response.json(body, { status })
    },
  }
  return calls
}
test('client submits token only for verification and no recipient for resend, without replay', async () => {
  const signal = new AbortController().signal
  let calls = browser({ verified: true })
  assert.equal(await submitEmailVerification('a'.repeat(64), signal), 'verified')
  assert.deepEqual(JSON.parse(calls[0].init.body), { token: 'a'.repeat(64) })
  calls = browser({ accepted: true }, 202)
  assert.equal(await submitEmailVerification(null, signal), 'sent')
  assert.deepEqual(JSON.parse(calls[0].init.body), {})
  calls = browser({ error: { message: 'Invalid or expired link.' } }, 400)
  await assert.rejects(submitEmailVerification('a'.repeat(64), signal), /Invalid or expired/)
  assert.equal(calls.length, 1)
  browser({ accepted: true })
  await assert.rejects(submitEmailVerification('a'.repeat(64), signal), /could not confirm/)
})
test('status requires explicit verification state and returns only account email fields', async () => {
  const signal = new AbortController().signal
  browser({ user: { email: 'owner@example.test', emailVerified: false, other: 'unused' } })
  assert.deepEqual(await getEmailStatus(signal), {
    email: 'owner@example.test',
    emailVerified: false,
  })
  browser({ user: { email: 'owner@example.test' } })
  await assert.rejects(getEmailStatus(signal), /Unable to confirm/)
})

test('resend handler ignores caller recipient and ID and requires a session before issuance', async () => {
  const calls = []
  globalThis.emailHandlerFixture = {
    db: {},
    ...http,
    requireUser: async (_request, response) => {
      if (globalThis.emailHandlerFixture.guest) {
        response.status(401).json({})
        return null
      }
      return { id: 'owner', email: 'owner@example.test', emailVerifiedAt: null }
    },
    sendTransactionalEmail: async () => true,
    issueEmailVerification: async (...args) => {
      calls.push(args)
      return 'sent'
    },
  }
  const handler = (
    await load(
      '../server/api/auth/email-verification-request.ts',
      (binding) => `const ${binding} = globalThis.emailHandlerFixture`,
    )
  ).default
  const response = () => ({
    code: 0,
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
    },
    setHeader() {},
  })
  let result = response()
  await handler(
    { method: 'POST', body: { userId: 'victim', email: 'victim@example.test' } },
    result,
  )
  assert.equal(result.code, 202)
  assert.equal(calls[0][1], 'owner')
  globalThis.emailHandlerFixture.guest = true
  result = response()
  await handler({ method: 'POST' }, result)
  assert.equal(result.code, 401)
  assert.equal(calls.length, 1)
  result = response()
  await handler({ method: 'GET' }, result)
  assert.equal(result.code, 405)
})

test('verification page requires a click, removes URL token and guards duplicate writes', async () => {
  const token = 'a'.repeat(64),
    states = [],
    effects = []
  let calls = 0,
    resolve
  globalThis.window = {
    location: { href: `https://shop.test/verify-email#token=${token}` },
    history: {
      replaceState: (_state, _title, path) => {
        assert.equal(path, '/verify-email')
      },
    },
  }
  globalThis.emailPageFixture = {
    useState: (initial) => {
      const slot = states.length
      states.push(typeof initial === 'function' ? initial() : initial)
      return [
        states[slot],
        (value) => {
          states[slot] = value
        },
      ]
    },
    useRef: () => ({ current: null }),
    useEffect: (effect) => effects.push(effect),
    useQuery: () => ({}),
    privateKey: () => [],
    getEmailStatus: () => {},
    readResetToken: () => token,
    cleanResetUrl: () => '/verify-email',
    useNotification: () => () => {},
    submitEmailVerification: () => {
      calls++
      return new Promise((done) => {
        resolve = done
      })
    },
  }
  const { EmailVerificationPage } = await load(
    '../src/pages/EmailVerificationPage.tsx',
    (binding, path) =>
      path === 'react/jsx-runtime'
        ? `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
        : `const ${binding} = globalThis.emailPageFixture`,
  )
  const root = EmailVerificationPage({ isAuthenticated: false, onNavigate: () => () => {} })
  effects.forEach((effect) => effect())
  assert.equal(calls, 0)
  function buttons(node) {
    if (!node || typeof node !== 'object') return []
    if (Array.isArray(node)) return node.flatMap(buttons)
    return node.type === 'button' ? [node] : buttons(node.props?.children)
  }
  const button = buttons(root)[0]
  button.props.onClick()
  button.props.onClick()
  assert.equal(calls, 1)
  resolve('verified')
  await new Promise((done) => setImmediate(done))
  assert.equal(states[0], '')
  assert.equal(states[2], 'verified')
})
