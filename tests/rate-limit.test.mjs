import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enforceRateLimit, clientAddress, rateLimitRule } from '../server/api/_lib/rate-limit.ts'
import { apiFetch, ApiRateLimitError } from '../src/api/http.ts'

function memoryStore() {
  let now = 0
  const rows = new Map()
  return {
    rows,
    advance: seconds => { now += seconds },
    consume: async (key, limit, seconds) => {
      let row = rows.get(key)
      if (!row || row.expires <= now) row = { count: 0, expires: now + seconds }
      row.count = Math.min(row.count + 1, limit + 1)
      rows.set(key, row)
      return { count: row.count, retryAfter: row.expires - now }
    },
  }
}

function response() {
  return { headers: {}, status(code) { this.code = code; return this }, json(body) { this.body = body }, setHeader(key, value) { this.headers[key] = value } }
}
const request = (ip = '192.0.2.1', method = 'POST') => ({ method, headers: { 'x-forwarded-for': ip } })
const dependencies = store => ({ consume: store.consume, userId: async () => undefined, vercel: true })

test('normal login allowed; eleventh request blocked with private 429 and retry metadata', async () => {
  const store = memoryStore()
  for (let i = 0; i < 10; i++) assert.equal(await enforceRateLimit(request(), response(), 'auth/login', dependencies(store)), true)
  const result = response()
  assert.equal(await enforceRateLimit(request(), result, 'auth/login', dependencies(store)), false)
  assert.equal(result.code, 429)
  assert.equal(result.headers['Retry-After'], '60')
  assert.match(result.headers['Cache-Control'], /no-store/)
  assert.equal(result.body.error.code, 'RATE_LIMITED')
  assert.equal(result.body.error.retryAfterSeconds, 60)
  assert.match(result.body.error.requestId, /^[a-f0-9-]{36}$/)
  assert.ok([...store.rows.keys()].every(key => /^[a-f0-9]{64}$/.test(key)))
})

test('window recovers without rejected attempts extending it; different IPs independent', async () => {
  const store = memoryStore()
  for (let i = 0; i < 11; i++) await enforceRateLimit(request(), response(), 'auth/login', dependencies(store))
  store.advance(59)
  const result = response()
  assert.equal(await enforceRateLimit(request(), result, 'auth/login', dependencies(store)), false)
  assert.equal(result.headers['Retry-After'], '1')
  assert.equal(await enforceRateLimit(request('192.0.2.2'), response(), 'auth/login', dependencies(store)), true)
  store.advance(1)
  assert.equal(await enforceRateLimit(request(), response(), 'auth/login', dependencies(store)), true)
})

test('multiple limiter invocations share counters; no per-process bypass', async () => {
  const store = memoryStore()
  const first = dependencies(store), second = dependencies(store)
  const accepted = await Promise.all(Array.from({ length: 25 }, (_, i) => enforceRateLimit(request(), response(), 'auth/login', i % 2 ? first : second)))
  assert.equal(accepted.filter(Boolean).length, 10)
})

test('verified user quota follows user across IPs and product IDs, not body identifiers', async () => {
  const store = memoryStore()
  const deps = { ...dependencies(store), userId: async () => 'verified-user' }
  for (let i = 0; i < 10; i++) assert.equal(await enforceRateLimit({ ...request(`192.0.2.${i + 1}`), body: { userId: `fake-${i}` } }, response(), `products/${i}/reviews`, deps), true)
  assert.equal(await enforceRateLimit(request('192.0.2.99'), response(), 'products/another/reviews/mine', deps), false)
  assert.equal(await enforceRateLimit(request('192.0.2.99'), response(), 'products/another/reviews', { ...deps, userId: async () => 'different-user' }), true)
})

test('forged/rotated session cookies cannot bypass the IP ceiling', async () => {
  const store = memoryStore()
  for (let i = 0; i < 60; i++) await enforceRateLimit(request(), response(), 'products/p/reviews', dependencies(store))
  const req = request()
  req.headers.cookie = 'gadgify_session=forged-new-token'
  assert.equal(await enforceRateLimit(req, response(), 'products/p/reviews', dependencies(store)), false)
})

test('normal multi-file upload allowed; limit blocks before further identity queries', async () => {
  const store = memoryStore()
  let lookups = 0
  const deps = { ...dependencies(store), userId: async () => { lookups++; return undefined } }
  for (let i = 0; i < 120; i++) assert.equal(await enforceRateLimit(request(), response(), 'admin/upload', deps), true)
  assert.equal(await enforceRateLimit(request(), response(), 'admin/upload', deps), false)
  assert.equal(lookups, 120)
})

test('public reads, session restoration, logout, and payment webhooks bypass limiter', async () => {
  for (const [path, method] of [['auth/me', 'GET'], ['auth/logout', 'POST'], ['products', 'GET'], ['categories', 'GET'], ['webhooks/razorpay', 'POST'], ['admin/products', 'GET']]) {
    const deps = { consume: async () => { throw new Error('must not be called') }, userId: async () => { throw new Error('must not be called') }, vercel: true }
    assert.equal(await enforceRateLimit(request('192.0.2.1', method), response(), path, deps), true)
  }
})

test('all auth and write categories have policies, including future support/coupon routes', () => {
  for (const path of ['auth/signup', 'auth/password-reset-request', 'auth/password-reset', 'auth/mobile-request', 'auth/mobile-verify', 'auth/verify-email', 'newsletter/subscribe', 'support/tickets', 'coupons/redeem', 'admin/settings', 'cart', 'wishlist', 'orders', 'payments/razorpay-order']) {
    assert.ok(rateLimitRule(path, 'POST'), path)
  }
  assert.ok(rateLimitRule('auth/verify-email', 'GET'))
})

test('counter outage stops writes with safe 503 and never exposes provider details', async () => {
  const result = response()
  const deps = { consume: async () => { throw new Error('secret database URL') }, userId: async () => undefined, vercel: true }
  assert.equal(await enforceRateLimit(request(), result, 'auth/login', deps), false)
  assert.equal(result.code, 503)
  assert.equal(result.headers['Retry-After'], '30')
  assert.equal(result.body.error.code, 'RATE_LIMIT_UNAVAILABLE')
  assert.doesNotMatch(JSON.stringify(result.body), /secret database/)
})

test('only deployment proxy headers trusted; canonicalizes equivalent addresses', () => {
  assert.equal(clientAddress({ ...request('192.0.2.2'), socket: { remoteAddress: '127.0.0.1' } }, false), '127.0.0.1')
  assert.equal(clientAddress(request('invalid'), true), 'unknown')
  assert.equal(clientAddress(request('192.0.2.1, 192.0.2.2'), true), '192.0.2.1')
  assert.equal(clientAddress(request('2001:db8:0:0:0:0:0:1'), true), clientAddress(request('2001:db8::1'), true))
  assert.equal(clientAddress(request('::ffff:192.0.2.1'), true), '192.0.2.1')
})

test('client raises typed 429 once, preserves request, and clears timeout', async () => {
  const originalWindow = globalThis.window
  let calls = 0, clears = 0
  globalThis.window = {
    setTimeout: () => 1, clearTimeout: () => { clears++ },
    fetch: async (_url, init) => {
      calls++
      assert.equal(init.credentials, 'include')
      assert.equal(init.body, 'unchanged form')
      return new Response('', { status: 429, headers: { 'Retry-After': '45' } })
    },
  }
  try {
    await assert.rejects(apiFetch('/api/auth/login', { method: 'POST', body: 'unchanged form' }), error => error instanceof ApiRateLimitError && error.retryAfterSeconds === 45)
    assert.equal(calls, 1)
    assert.equal(clears, 1)
  } finally { globalThis.window = originalWindow }
})

test('retry header parsing has safe defaults, bounds and HTTP-date support', () => {
  for (const input of [null, 'nonsense', 'Infinity']) assert.equal(new ApiRateLimitError(input).retryAfterSeconds, 60)
  assert.equal(new ApiRateLimitError('-5').retryAfterSeconds, 1)
  assert.equal(new ApiRateLimitError('999999').retryAfterSeconds, 86400)
  const seconds = new ApiRateLimitError(new Date(Date.now() + 30000).toUTCString()).retryAfterSeconds
  assert.ok(seconds >= 29 && seconds <= 30)
})
