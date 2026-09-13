import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { csrfTokenResponse, validCsrf } from '../server/api/_lib/csrf.ts'
import { apiFetch, ApiTimeoutError } from '../src/api/http.ts'
import { clearCsrfToken } from '../src/api/csrf.ts'
import { changeSession } from '../src/api/sessionScope.ts'

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
const session = 'b'.repeat(64)
const baseHeaders = {
  host: 'shop.test',
  origin: 'https://shop.test',
  'sec-fetch-site': 'same-origin',
}
function bootstrap(cookie = `gadgify_session=${session}`, extra = {}) {
  const result = response()
  csrfTokenResponse(
    { method: 'GET', headers: { ...baseHeaders, cookie, 'x-csrf-bootstrap': '1', ...extra } },
    result,
    true,
  )
  return result
}
function write(extra = {}) {
  return {
    method: 'POST',
    headers: {
      ...baseHeaders,
      cookie: `gadgify_session=${session}`,
      'x-csrf-token': bootstrap().body.csrfToken,
      ...extra,
    },
  }
}

test('session-bound token is stable, private, and never exposes the session credential', () => {
  const a = bootstrap(),
    b = bootstrap()
  assert.equal(a.code, 200)
  assert.equal(a.body.csrfToken, b.body.csrfToken)
  assert.notEqual(a.body.csrfToken, session)
  assert.match(a.headers['Cache-Control'], /no-store/)
  assert.equal(a.headers['Set-Cookie'], undefined)
  assert.equal(validCsrf(write(), 'orders', true), true)
  assert.equal(
    validCsrf(write({ cookie: `gadgify_session=${'c'.repeat(64)}` }), 'orders', true),
    false,
  )
})

test('guest bootstrap protects login without creating or replacing an authenticated session', () => {
  const result = bootstrap('')
  assert.match(
    result.headers['Set-Cookie'],
    /^__Host-gadgify_csrf=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Lax; Secure$/,
  )
  const cookie = result.headers['Set-Cookie'].split(';')[0]
  assert.equal(
    validCsrf(write({ cookie, 'x-csrf-token': result.body.csrfToken }), 'auth/login', true),
    true,
  )
  assert.equal(
    validCsrf(
      write({
        cookie: `${cookie}; gadgify_session=${session}`,
        'x-csrf-token': result.body.csrfToken,
      }),
      'cart',
      true,
    ),
    false,
  )
})

test('reject missing, forged, malformed, duplicate and another-session tokens', () => {
  for (const value of [undefined, '', 'forged', 'a'.repeat(64), ['a'.repeat(64)]]) {
    assert.equal(validCsrf(write({ 'x-csrf-token': value }), 'admin/upload', true), false)
  }
  assert.equal(validCsrf(write({ cookie: '' }), 'cart', true), false)
  assert.equal(
    validCsrf(
      write({ cookie: `gadgify_session=${session}; gadgify_session=${session}` }),
      'cart',
      true,
    ),
    false,
  )
})

test('reject cross-origin, sibling-site, null-origin and spoofed forwarded-host requests', () => {
  for (const extra of [
    { origin: 'https://evil.test' },
    { origin: 'https://shop.test.evil.test' },
    { origin: 'null' },
    { origin: 'http://shop.test' },
    { 'sec-fetch-site': 'cross-site' },
    { 'sec-fetch-site': 'same-site' },
    { origin: 'https://evil.test', 'x-forwarded-host': 'evil.test' },
    { origin: undefined, referer: 'https://evil.test/page' },
  ]) {
    assert.equal(validCsrf(write(extra), 'cart', true), false)
    assert.equal(bootstrap(undefined, extra).code, 403)
  }
})

test('token proof supports clients without metadata and validates Referer fallback', () => {
  assert.equal(
    validCsrf(write({ origin: undefined, 'sec-fetch-site': undefined }), 'cart', true),
    true,
  )
  assert.equal(
    validCsrf(write({ origin: undefined, referer: 'https://shop.test/product/p' }), 'cart', true),
    true,
  )
  const result = response()
  csrfTokenResponse(
    {
      method: 'GET',
      headers: { host: 'localhost:3000', origin: 'http://localhost:3000', 'x-csrf-bootstrap': '1' },
    },
    result,
    false,
  )
  assert.equal(result.code, 200)
  assert.match(result.headers['Set-Cookie'], /^gadgify_csrf=/)
})

test('bootstrap disallows navigation/simple requests and non-GET methods', () => {
  assert.equal(bootstrap(undefined, { 'x-csrf-bootstrap': undefined }).code, 403)
  const result = response()
  csrfTokenResponse({ method: 'POST' }, result, true)
  assert.equal(result.code, 405)
})

test('reads stay unchanged and only the exact POST webhook is exempt', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS'])
    assert.equal(validCsrf({ method }, 'products', true), true)
  assert.equal(validCsrf({ method: 'POST' }, 'webhooks/razorpay', true), true)
  for (const path of ['webhooks/other', 'webhooks/razorpay/extra', 'payments/razorpay-verify'])
    assert.equal(validCsrf({ method: 'POST' }, path, true), false)
  assert.equal(validCsrf({ method: 'PATCH' }, 'webhooks/razorpay', true), false)
})

function browser(fetch) {
  clearCsrfToken()
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch,
    dispatchEvent() {},
    location: { href: 'https://shop.test/', origin: 'https://shop.test' },
  }
}
const tokenReply = () => Response.json({ csrfToken: 'a'.repeat(64) })
const tick = () => new Promise((resolve) => setImmediate(resolve))

test('parallel writes share one bootstrap; headers/body preserved and token cached', async () => {
  let bootstraps = 0,
    writes = 0
  browser(async (url, init) => {
    if (url === '/api/auth/csrf') {
      bootstraps++
      return tokenReply()
    }
    writes++
    assert.equal(init.headers.get('X-CSRF-Token'), 'a'.repeat(64))
    assert.equal(init.headers.get('Content-Type'), 'application/json')
    assert.equal(init.credentials, 'include')
    assert.equal(init.body, '{"draft":"kept"}')
    return Response.json({ ok: true })
  })
  const action = () =>
    apiFetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"draft":"kept"}',
    })
  await Promise.all([action(), action()])
  await action()
  assert.equal(bootstraps, 1)
  assert.equal(writes, 3)
})

test('reads and external requests do not receive or fetch CSRF credentials', async () => {
  browser(async (url, init) => {
    assert.notEqual(url, '/api/auth/csrf')
    assert.equal(new Headers(init.headers).has('X-CSRF-Token'), false)
    return Response.json({})
  })
  await apiFetch('/api/products')
  await apiFetch('https://provider.test/api/action', { method: 'POST' })
})

test('same-origin Request objects retain their headers and receive protection', async () => {
  browser(async (url, init) => {
    if (url === '/api/auth/csrf') return tokenReply()
    assert.equal(init.headers.get('X-CSRF-Token'), 'a'.repeat(64))
    assert.equal(init.headers.get('Content-Type'), 'application/json')
    return Response.json({})
  })
  await apiFetch(
    new Request('https://shop.test/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }),
  )
})

test('403 never replays the write; next explicit attempt fetches a fresh token', async () => {
  let bootstraps = 0,
    writes = 0
  browser(async (url) => {
    if (url === '/api/auth/csrf') {
      bootstraps++
      return tokenReply()
    }
    writes++
    return Response.json({ error: { code: 'CSRF_INVALID' } }, { status: 403 })
  })
  assert.equal((await apiFetch('/api/cart', { method: 'PATCH' })).status, 403)
  assert.equal(writes, 1)
  await apiFetch('/api/cart', { method: 'PATCH' })
  assert.equal(bootstraps, 2)
})

test('successful login/logout and account generation invalidate cached tokens', async () => {
  let bootstraps = 0
  browser(async (url) => {
    if (url === '/api/auth/csrf') {
      bootstraps++
      return tokenReply()
    }
    return Response.json({})
  })
  await apiFetch('/api/auth/login', { method: 'POST' })
  await apiFetch('/api/auth/logout', { method: 'POST' })
  await apiFetch('/api/cart', { method: 'POST' })
  changeSession({ id: 'synthetic-b', role: 'CUSTOMER' })
  await apiFetch('/api/cart', { method: 'POST' })
  assert.equal(bootstraps, 4)
})

test('bootstrap failures preserve draft and send no mutation', async () => {
  let calls = 0
  browser(async (url) => {
    calls++
    assert.equal(url, '/api/auth/csrf')
    return Response.json({}, { status: 503 })
  })
  await assert.rejects(apiFetch('/api/cart', { method: 'POST', body: 'draft' }), /secure request/)
  assert.equal(calls, 1)
})

test('cancelling one bootstrap waiter does not cancel another action', async () => {
  let resolve,
    writes = 0,
    bootstraps = 0
  browser(async (url) => {
    if (url === '/api/auth/csrf') {
      bootstraps++
      return new Promise((done) => {
        resolve = done
      })
    }
    writes++
    return Response.json({})
  })
  const controller = new AbortController()
  const first = apiFetch('/api/cart', { method: 'POST', signal: controller.signal })
  const rejection = assert.rejects(first, { name: 'AbortError' })
  const second = apiFetch('/api/cart', { method: 'POST' })
  controller.abort()
  await rejection
  resolve(tokenReply())
  await second
  assert.equal(writes, 1)
  assert.equal(bootstraps, 1)
})

test('timeout includes bootstrap and prevents the mutation', async () => {
  let writes = 0
  browser(async (url, init) => {
    if (url !== '/api/auth/csrf') {
      writes++
      return Response.json({})
    }
    return new Promise((_resolve, reject) =>
      init.signal.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      ),
    )
  })
  await assert.rejects(apiFetch('/api/cart', { method: 'POST', timeoutMs: 10 }), ApiTimeoutError)
  assert.equal(writes, 0)
})

test('session switch while bootstrapping cannot submit an old draft', async () => {
  let resolve,
    writes = 0
  browser(async (url) => {
    if (url === '/api/auth/csrf')
      return new Promise((done) => {
        resolve = done
      })
    writes++
    return Response.json({})
  })
  const action = apiFetch('/api/cart', { method: 'POST' })
  const rejection = assert.rejects(action, { name: 'AbortError' })
  changeSession(null)
  resolve(tokenReply())
  await rejection
  await tick()
  assert.equal(writes, 0)
})

test('dispatcher blocks before rate-limit/handler work and retains reads and exact webhook dispatch', async () => {
  globalThis.csrfFixture = { limits: 0, calls: 0 }
  const source = readFileSync(new URL('../api/[...route].ts', import.meta.url), 'utf8').replace(
    /^import (.+) from '([^']+)'/gm,
    (_line, binding, path) => {
      if (path.endsWith('/csrf.js') || path.endsWith('/http.js'))
        return `import ${binding} from ${JSON.stringify(new URL(path.replace('.js', '.ts'), new URL('../api/', import.meta.url)).href)}`
      if (binding === '{ db }') return 'const db = {}'
      if (binding === '{ currentUser }') return 'const currentUser = async () => null'
      if (binding === '{ createRateLimitStore }')
        return 'const createRateLimitStore = () => () => {}'
      if (binding === '{ enforceRateLimit }')
        return 'const enforceRateLimit = async () => { globalThis.csrfFixture.limits++; return true }'
      return `const ${binding} = async (_request, response) => { globalThis.csrfFixture.calls++; return response.status(200).json({ ok: true }) }`
    },
  )
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const { default: dispatch } = await import(
    `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
  )
  const denied = response()
  await dispatch({ method: 'POST', query: { route: 'cart' } }, denied)
  assert.equal(denied.code, 403)
  assert.equal(denied.body.error.code, 'CSRF_INVALID')
  assert.match(denied.headers['Cache-Control'], /no-store/)
  assert.deepEqual(globalThis.csrfFixture, { limits: 0, calls: 0 })
  for (const [method, route] of [
    ['GET', 'auth/me'],
    ['POST', 'webhooks/razorpay'],
  ])
    await dispatch({ method, query: { route } }, response())
  assert.deepEqual(globalThis.csrfFixture, { limits: 2, calls: 2 })
  const paths = [
    'auth/login',
    'auth/logout',
    'auth/signup',
    'auth/mobile-request',
    'auth/mobile-verify',
    'auth/password-reset-request',
    'auth/password-reset',
    'auth/verify-email',
    'newsletter/subscribe',
    'cart',
    'wishlist',
    'orders',
    'orders/synthetic',
    'payments/razorpay-order',
    'payments/razorpay-verify',
    'products/synthetic/reviews',
    'products/synthetic/reviews/mine',
    'products/synthetic/review-upload',
    'admin/upload',
    'admin/products',
    'admin/products/synthetic',
    'admin/categories',
    'admin/orders',
    'admin/payments',
    'admin/settings',
    'admin/messages',
  ]
  for (const route of paths) {
    const rejected = response()
    await dispatch({ method: 'POST', query: { route } }, rejected)
    assert.equal(rejected.code, 403, route)
    const accepted = response()
    await dispatch({ ...write({ origin: undefined }), query: { route } }, accepted)
    assert.equal(accepted.code, 200, route)
  }
  assert.equal(globalThis.csrfFixture.calls, 2 + paths.length)
  assert.equal(globalThis.csrfFixture.limits, 2 + paths.length)
})
