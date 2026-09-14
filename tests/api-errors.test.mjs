import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as http from '../server/api/_lib/http.ts'
import { subscribeToNewsletter } from '../src/api/newsletter.ts'
import { clearCsrfToken } from '../src/api/csrf.ts'
import { enforceRateLimit } from '../server/api/_lib/rate-limit.ts'

const uuid = /^[a-f0-9-]{36}$/i
function response() {
  return {
    headers: {},
    writes: 0,
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
      this.writes++
      this.headersSent = true
    },
    setHeader(key, value) {
      this.headers[key] = value
    },
  }
}
function assertError(result, status, code) {
  assert.equal(result.code, status)
  assert.equal(result.body.error.code, code)
  assert.equal(typeof result.body.error.message, 'string')
  assert.match(result.body.error.requestId, uuid)
  assert.match(result.headers['Cache-Control'], /no-store/)
  assert.doesNotMatch(JSON.stringify(result.body), /private-secret|postgres:\/\/|provider-debug/)
}
let version = 0
async function load(relative, resolveImport, transform = (source) => source) {
  const source = transform(readFileSync(new URL(relative, import.meta.url), 'utf8'))
  const js = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    })
    .outputText.replace(
      /^import (.+?) from ['"]([^'"]+)['"];?$/gm,
      (line, binding, path) => resolveImport(binding, path) ?? line,
    )
  return import(
    `data:text/javascript;base64,${Buffer.from(js + `\n//${version++}`).toString('base64')}`
  )
}
async function dispatcher() {
  return (
    await load('../api/[...route].ts', (binding, path) => {
      if (
        path.endsWith('/http.js') ||
        path.endsWith('/csrf.js') ||
        path.endsWith('/webhook-body.js')
      )
        return `import ${binding} from ${JSON.stringify(new URL(path.replace('.js', '.ts'), new URL('../api/', import.meta.url)).href)}`
      if (binding === '{ db }') return 'const db = {}'
      if (binding === '{ currentUser }') return 'const currentUser = async () => null'
      if (binding === '{ createRateLimitStore }')
        return 'const createRateLimitStore = () => () => {}'
      if (binding === '{ enforceRateLimit }')
        return 'const enforceRateLimit = (...args) => globalThis.errorFixture.limit(...args)'
      return `const ${binding} = (...args) => globalThis.errorFixture.handler(...args)`
    })
  ).default
}

test('request IDs reject arbitrary header payloads and remain stable within a request', () => {
  for (const input of ['private-secret', 'line\nbreak', 'a'.repeat(1000), ['abc'], undefined]) {
    const request = { headers: { 'x-request-id': input } }
    const id = http.requestId(request)
    assert.match(id, uuid)
    assert.equal(http.requestId(request), id)
    assert.notEqual(id, input)
  }
  const id = '12345678-1234-1234-1234-123456789abc'
  assert.equal(http.requestId({ headers: { 'x-request-id': id } }), id)
})

test('boundary preserves success payload/cache and correlates downstream request ID', async () => {
  const request = {},
    result = response()
  await http.withApiErrorBoundary(request, result, () => {
    http.setCacheControl(result, 'public')
    assert.equal(http.requestId({ headers: request.headers }), result.headers['X-Request-Id'])
    return result.status(202).json({ subscribed: true, emailSent: false })
  })
  assert.deepEqual(result.body, { subscribed: true, emailSent: false })
  assert.match(result.headers['Cache-Control'], /^public/)
})

test('boundary hides unexpected errors and logs only event and correlation ID', async () => {
  const original = console.error,
    logs = []
  console.error = (entry) => logs.push(JSON.parse(entry))
  try {
    const result = response()
    await http.withApiErrorBoundary({}, result, async () => {
      http.setCacheControl(result, 'public')
      throw new Error('private-secret postgres://credentials provider-debug')
    })
    assertError(result, 500, 'INTERNAL_ERROR')
    assert.deepEqual(logs, [
      { event: 'api_unhandled_error', requestId: result.body.error.requestId },
    ])
  } finally {
    console.error = original
  }
})

test('boundary does not send a second response after a handler has replied', async () => {
  const original = console.error
  console.error = () => {}
  try {
    const result = response()
    await http.withApiErrorBoundary({}, result, () => {
      result.status(200).json({ saved: true })
      throw new Error('private-secret')
    })
    assert.equal(result.writes, 1)
    assert.equal(result.code, 200)
    assert.deepEqual(result.body, { saved: true })
  } finally {
    console.error = original
  }
})

test('malformed route encodings and encoded separators fail before limiter or handlers', async () => {
  const dispatch = await dispatcher()
  globalThis.errorFixture = {
    limit: () => assert.fail('limiter reached'),
    handler: () => assert.fail('handler reached'),
  }
  for (const route of [
    'products/%',
    'products/%E0%A4%A',
    'products/a%2fb',
    'products/a%5cb',
    'products/%00',
    'products/..',
  ]) {
    const result = response()
    await dispatch({ method: 'GET', query: { route } }, result)
    assertError(result, 400, 'INVALID_PATH')
  }
  const result = response()
  await dispatch({ method: 'GET', url: 'http://[' }, result)
  assertError(result, 400, 'INVALID_PATH')
})

test('unknown and prototype names return structured 404 without invoking inherited functions', async () => {
  const dispatch = await dispatcher()
  globalThis.errorFixture = {
    limit: () => assert.fail('limiter reached'),
    handler: () => assert.fail('handler reached'),
  }
  for (const route of ['missing', 'constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const result = response()
    await dispatch({ method: 'GET', query: { route } }, result)
    assertError(result, 404, 'NOT_FOUND')
  }
})

test('valid dynamic routes preserve decoded IDs, query filters, cookie and success DTO', async () => {
  const dispatch = await dispatcher()
  globalThis.errorFixture = {
    limit: async () => true,
    handler: (request, result) => {
      assert.equal(request.query.id, 'test product')
      assert.equal(request.query.sort, 'newest')
      assert.equal(request.headers.cookie, 'synthetic')
      return result.status(200).json({ product: { id: request.query.id } })
    },
  }
  const result = response()
  await dispatch(
    {
      method: 'GET',
      headers: { Cookie: 'synthetic' },
      query: { route: ['products', 'test%20product'], sort: 'newest' },
    },
    result,
  )
  assert.deepEqual(result.body, { product: { id: 'test product' } })
})

test('dispatcher contains unexpected async limiter and handler failures', async () => {
  const dispatch = await dispatcher(),
    original = console.error
  console.error = () => {}
  try {
    for (const stage of ['limit', 'handler']) {
      globalThis.errorFixture = {
        limit: async () => true,
        handler: () => assert.fail('unexpected handler'),
      }
      globalThis.errorFixture[stage] = async () => {
        throw new Error('private-secret')
      }
      const result = response()
      await dispatch({ method: 'GET', query: { route: 'products' } }, result)
      assertError(result, 500, 'INTERNAL_ERROR')
    }
  } finally {
    console.error = original
  }
})

test('existing quota error responses and Retry-After survive dispatcher unchanged', async () => {
  const dispatch = await dispatcher()
  globalThis.errorFixture = {
    limit: (_request, result) => {
      result.setHeader('Retry-After', '45')
      http.sendError(
        result,
        429,
        'RATE_LIMITED',
        'Wait before trying again.',
        http.requestId(_request),
      )
      return false
    },
    handler: () => assert.fail('blocked handler reached'),
  }
  const result = response()
  await dispatch({ method: 'GET', query: { route: 'products' } }, result)
  assertError(result, 429, 'RATE_LIMITED')
  assert.equal(result.headers['Retry-After'], '45')
})

async function newsletter(options = {}) {
  const state = { writes: 0, providers: 0 }
  globalThis.newsletterFixture = {
    env: {
      RESEND_API_KEY: options.configured === false ? '' : 'synthetic',
      RESEND_AUDIENCE_ID: options.audience ? 'synthetic' : '',
      RESEND_FROM_EMAIL: options.sender ? 'sender@example.test' : '',
    },
    db: {
      newsletterSubscription: {
        upsert: async () => {
          if (options.databaseFails) throw new Error('private-secret')
          state.writes++
        },
      },
    },
    http: {
      ...http,
      fetchWithTimeout: async () => {
        state.providers++
        if (options.providerThrows) throw new Error('provider-debug')
        return new Response('', { status: options.providerFails ? 503 : 200 })
      },
    },
  }
  const handler = (
    await load(
      '../server/api/newsletter/subscribe.ts',
      (binding, path) => {
        if (path.endsWith('/db.js')) return 'const db = globalThis.newsletterFixture.db'
        if (path.endsWith('/http.js')) return `const ${binding} = globalThis.newsletterFixture.http`
      },
      (source) =>
        source.replace(/process\.env\.(RESEND_[A-Z_]+)/g, 'globalThis.newsletterFixture.env.$1'),
    )
  ).default
  const result = response()
  await handler(
    {
      method: options.method ?? 'POST',
      body: { email: options.email ?? 'synthetic@example.test' },
    },
    result,
  )
  return { result, ...state }
}

test('newsletter validation/method/configuration errors are safe structured responses before writes', async () => {
  for (const [options, status, code] of [
    [{ method: 'GET' }, 405, 'METHOD_NOT_ALLOWED'],
    [{ email: 'bad' }, 400, 'VALIDATION_ERROR'],
    [{ configured: false }, 503, 'NEWSLETTER_UNAVAILABLE'],
  ]) {
    const actual = await newsletter(options)
    assertError(actual.result, status, code)
    assert.equal(actual.writes, 0)
    assert.equal(actual.providers, 0)
  }
})

test('newsletter audience/database failure stays distinct from saved subscription', async () => {
  for (const options of [{ audience: true, providerFails: true }, { databaseFails: true }]) {
    const actual = await newsletter(options)
    assertError(actual.result, 502, 'NEWSLETTER_UNAVAILABLE')
    assert.equal(actual.writes, 0)
  }
})

test('newsletter confirmation rejection or exception reports already-saved outcome without replay', async () => {
  for (const options of [
    { sender: true, providerFails: true },
    { sender: true, providerThrows: true },
  ]) {
    const actual = await newsletter(options)
    assertError(actual.result, 502, 'CONFIRMATION_EMAIL_FAILED')
    assert.match(actual.result.body.error.message, /Subscription saved/)
    assert.equal(actual.writes, 1)
    assert.equal(actual.providers, 1)
  }
})

test('newsletter success response remains 202 with subscribed and emailSent', async () => {
  for (const sender of [false, true]) {
    const actual = await newsletter({ sender })
    assert.equal(actual.result.code, 202)
    assert.deepEqual(actual.result.body, { subscribed: true, emailSent: sender })
    assert.equal(actual.writes, 1)
    assert.match(actual.result.headers['Cache-Control'], /no-store/)
  }
})

function browser(body, status = 502) {
  clearCsrfToken()
  let calls = 0
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: async (url, init) => {
      if (url === '/api/auth/csrf') return Response.json({ csrfToken: 'a'.repeat(64) })
      calls++
      assert.equal(JSON.parse(init.body).email, 'draft@example.test')
      return typeof body === 'string'
        ? new Response(body, { status })
        : Response.json(body, { status })
    },
  }
  return () => calls
}

test('newsletter client supports structured/legacy errors and safe malformed-response fallback', async () => {
  for (const [body, expected] of [
    [{ error: { message: 'Subscription saved, email failed.' } }, /Subscription saved/],
    [{ error: 'Legacy error' }, /Legacy error/],
    ['<html>bad gateway</html>', /could not subscribe/],
    [{ error: {} }, /could not subscribe/],
  ]) {
    const calls = browser(body)
    await assert.rejects(subscribeToNewsletter('draft@example.test'), expected)
    assert.equal(calls(), 1)
  }
})

test('newsletter client rejects unconfirmed success and accepts existing 202 contract', async () => {
  browser({}, 200)
  await assert.rejects(subscribeToNewsletter('draft@example.test'), /could not confirm/)
  browser({ subscribed: true, emailSent: true }, 202)
  assert.deepEqual(await subscribeToNewsletter('draft@example.test'), { emailSent: true })
})

test('newsletter client reconciles only the explicit saved-subscription failure without replay', async () => {
  const calls = browser({ error: { code: 'CONFIRMATION_EMAIL_FAILED' } })
  assert.deepEqual(await subscribeToNewsletter('draft@example.test'), {
    emailSent: false,
    confirmationFailed: true,
  })
  assert.equal(calls(), 1)
  browser({ error: { code: 'NEWSLETTER_UNAVAILABLE' } })
  await assert.rejects(subscribeToNewsletter('draft@example.test'), /could not subscribe/)
  browser({ error: { code: 'CONFIRMATION_EMAIL_FAILED' } }, 401)
  await assert.rejects(subscribeToNewsletter('draft@example.test'), /could not subscribe/)
})

test('newsletter diagnostic logs expose only phase, status and correlation', async () => {
  const original = console.error,
    logs = []
  console.error = (value) => logs.push(JSON.parse(value))
  try {
    await newsletter({ sender: true, providerFails: true })
    await newsletter({ sender: true, providerThrows: true })
    assert.equal(logs.length, 2)
    assert.deepEqual(Object.keys(logs[0]).sort(), ['event', 'phase', 'requestId', 'status'])
    assert.equal(logs[0].status, 503)
    assert.equal(logs[0].phase, 'confirmation')
    assert.deepEqual(Object.keys(logs[1]).sort(), ['event', 'phase', 'requestId'])
    assert.doesNotMatch(JSON.stringify(logs), /example|synthetic|provider-debug|private-secret/)
  } finally {
    console.error = original
  }
})

test('subscription form shows saved state and an informational notice after email failure', async () => {
  const states = ['draft@example.test', 'idle'],
    notices = []
  let index = 0
  globalThis.subscribeFormFixture = {
    useRef: () => ({ current: false }),
    useState: () => {
      const slot = index++
      return [
        states[slot],
        (value) => {
          states[slot] = value
        },
      ]
    },
    useNotification:
      () =>
      (...args) =>
        notices.push(args),
    subscribeToNewsletter: async () => ({ emailSent: false, confirmationFailed: true }),
  }
  const { SubscribeSection } = await load(
    '../src/components/SubscribeSection.tsx',
    (binding, path) => {
      if (path === 'react/jsx-runtime')
        return `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
      return `const ${binding} = globalThis.subscribeFormFixture`
    },
  )
  await SubscribeSection().props.children[1].props.onSubmit({ preventDefault() {} })
  assert.equal(states[1], 'success')
  assert.equal(states[0], '')
  assert.match(notices[0][0], /No need to subscribe again/)
  assert.equal(notices[0][1], 'info')
})

test('real limiter keeps the dispatcher correlation ID and existing retry metadata', async () => {
  const result = response(),
    request = { method: 'POST' }
  await http.withApiErrorBoundary(request, result, () =>
    enforceRateLimit(request, result, 'auth/login', {
      consume: async () => ({ count: 99, retryAfter: 30 }),
      userId: async () => undefined,
      vercel: false,
    }),
  )
  assertError(result, 429, 'RATE_LIMITED')
  assert.equal(result.body.error.requestId, result.headers['X-Request-Id'])
})

test('health failure keeps monitoring fields while adding safe error details', async () => {
  globalThis.healthErrorFixture = {
    $queryRaw: async () => {
      throw new Error('private-secret')
    },
  }
  const handler = (
    await load('../server/api/health.ts', (binding, path) => {
      if (path.endsWith('/db.js')) return 'const db = globalThis.healthErrorFixture'
      if (path.endsWith('/http.js'))
        return `import ${binding} from ${JSON.stringify(new URL('../server/api/_lib/http.ts', import.meta.url).href)}`
    })
  ).default
  const result = response()
  await handler({ method: 'GET' }, result)
  assertError(result, 503, 'DATABASE_UNAVAILABLE')
  assert.equal(result.body.ok, false)
  assert.equal(result.body.database, 'unavailable')
})

test('shared auth checks retain unauthorized/forbidden status and add safe request IDs', async () => {
  globalThis.authErrorFixture = {
    session: {
      findUnique: async () => ({
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'synthetic', role: 'CUSTOMER' },
      }),
    },
  }
  const auth = await load('../server/api/_lib/auth.ts', (binding, path) => {
    if (path.endsWith('/db.js')) return 'const db = globalThis.authErrorFixture'
    if (path.endsWith('/http.js'))
      return `import ${binding} from ${JSON.stringify(new URL('../server/api/_lib/http.ts', import.meta.url).href)}`
  })
  const guest = response(),
    customer = response()
  assert.equal(await auth.requireUser({}, guest), null)
  assertError(guest, 401, 'UNAUTHORIZED')
  assert.equal(
    await auth.requireAdmin({ headers: { cookie: `gadgify_session=${'a'.repeat(64)}` } }, customer),
    null,
  )
  assertError(customer, 403, 'FORBIDDEN')
})

test('subscription form blocks duplicate submissions and keeps a failed draft', async () => {
  const states = ['draft@example.test', 'idle'],
    notices = []
  let index = 0,
    calls = 0,
    reject
  globalThis.subscribeFormFixture = {
    useRef: () => ({ current: false }),
    useState: () => {
      const slot = index++
      return [
        states[slot],
        (value) => {
          states[slot] = value
        },
      ]
    },
    useNotification: () => (value) => notices.push(value),
    subscribeToNewsletter: () => {
      calls++
      return new Promise((_resolve, fail) => {
        reject = fail
      })
    },
  }
  const { SubscribeSection } = await load(
    '../src/components/SubscribeSection.tsx',
    (binding, path) => {
      if (path === 'react/jsx-runtime')
        return `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
      return `const ${binding} = globalThis.subscribeFormFixture`
    },
  )
  const form = SubscribeSection().props.children[1]
  const first = form.props.onSubmit({ preventDefault() {} })
  await form.props.onSubmit({ preventDefault() {} })
  assert.equal(calls, 1)
  assert.equal(states[1], 'loading')
  reject(new Error('Subscription saved, confirmation failed.'))
  await first
  assert.equal(states[0], 'draft@example.test')
  assert.equal(states[1], 'error')
  assert.match(notices[0].message, /Subscription saved/)
})
