import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { ratingBands } from '../server/api/_lib/rating-filter.ts'
import { safeRouteId } from '../src/routePaths.ts'
import { getOrder } from '../src/api/orders.ts'

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
const rewrite = (binding, path) =>
  path === 'react/jsx-runtime'
    ? `import ${binding} from ${JSON.stringify(import.meta.resolve(path))}`
    : `const ${binding}=globalThis.batchFixture`
function rendered(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(rendered).join(' ')
  if (typeof node === 'object') return rendered(node.props?.children)
  return String(node)
}
function findButton(node) {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findButton(child)
      if (found) return found
    }
    return null
  }
  if (node.type === 'button') return node
  return findButton(node.props?.children)
}
const flush = () => new Promise((resolve) => setImmediate(resolve))

test('checkout guards duplicate clicks and reuses original identity/address/total after an uncertain response', async () => {
  const calls = [],
    notices = []
  let reject
  globalThis.batchFixture = {
    useQuery: () => ({ data: { enabled: true, totalMinor: 135, shippingMinor: 25, taxMinor: 10 } }),
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => {}],
    useEffect: () => {},
    privateKey: () => [],
    useNotification: () => (message) => notices.push(message),
    checkoutRequest: async (method, signal, body) => {
      calls.push(body)
      return new Promise((_, r) => {
        reject = r
      })
    },
  }
  const { CheckoutSubmit } = await load('../src/components/CheckoutSubmit.tsx', rewrite)
  const button = findButton(CheckoutSubmit({ addressId: 'a', cartRevision: 'v1', disabled: false }))
  button.props.onClick()
  button.props.onClick()
  await flush()
  assert.equal(calls.length, 1)
  reject(new Error('Uncertain response'))
  await flush()
  button.props.onClick()
  await flush()
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0], calls[1])
  reject(new Error('Still uncertain'))
  await flush()
  assert.equal(notices.length, 2)
})
test('unconfigured checkout has no submit control and explains that nothing was submitted', async () => {
  globalThis.batchFixture = {
    useQuery: () => ({ data: { enabled: false } }),
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => {}],
    useEffect: () => {},
    privateKey: () => [],
    useNotification: () => () => {},
  }
  const { CheckoutSubmit } = await load('../src/components/CheckoutSubmit.tsx', rewrite)
  const node = CheckoutSubmit({ addressId: 'a', cartRevision: 'v1', disabled: false })
  assert.equal(findButton(node), null)
  assert.match(rendered(node), /not been submitted/)
})
test('payment widget serializes initiation and never announces payment success for rejected capture', async () => {
  const calls = [],
    notices = []
  let options,
    refreshes = 0
  globalThis.batchFixture = {
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => {}],
    useEffect: () => {},
    useNotification:
      () =>
      (...args) =>
        notices.push(args),
    sessionGeneration: () => 1,
    assertCurrentSession: () => {},
    LONG_RUNNING_API_TIMEOUT_MS: 60000,
    loadRazorpay: async () =>
      class {
        constructor(value) {
          options = value
        }
        open() {}
        close() {}
        on() {}
      },
    apiFetch: async (path, init) => {
      calls.push({ path, init })
      return path.endsWith('razorpay-order')
        ? Response.json({
            paymentOrderId: 'order_test',
            amount: 135,
            currency: 'INR',
            keyId: 'synthetic',
          })
        : Response.json({ error: { message: 'Capture not confirmed' } }, { status: 409 })
    },
  }
  const { OrderPayment } = await load('../src/components/OrderPayment.tsx', rewrite)
  const button = findButton(OrderPayment({ orderId: 'owned', onRefresh: () => refreshes++ }))
  button.props.onClick()
  button.props.onClick()
  await flush()
  assert.equal(calls.length, 1)
  options.handler({
    razorpay_payment_id: 'pay_test',
    razorpay_order_id: 'order_test',
    razorpay_signature: 'synthetic',
  })
  options.handler({
    razorpay_payment_id: 'pay_test',
    razorpay_order_id: 'order_test',
    razorpay_signature: 'synthetic',
  })
  await flush()
  assert.equal(calls.length, 2)
  assert.equal(refreshes, 1)
  assert.ok(notices.some(([message]) => message.message === 'Capture not confirmed'))
  assert.ok(notices.every(([, tone]) => tone !== 'success'))
  assert.equal(JSON.parse(calls[1].init.body).orderId, 'owned')
})
test('rating filters accept distinct bands and reject invalid or oversized selections', () => {
  assert.deepEqual(ratingBands('1,3,5'), [1, 3, 5])
  assert.deepEqual(ratingBands('4,4'), [4])
  assert.deepEqual(ratingBands(undefined), [])
  for (const input of ['0', '6', '1,2,3,4,5,5', '1.5', '4,foo'])
    assert.equal(ratingBands(input), null)
})
test('malformed route IDs cannot crash decoding or introduce nested paths', () => {
  assert.equal(safeRouteId('order-123'), 'order-123')
  for (const id of ['%', 'a%2Fb', 'a%5Cb', '%00', '']) assert.equal(safeRouteId(id), null)
})
test('detail transport distinguishes missing orders from other failures and never manufactures success', async () => {
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: async () => Response.json({}, { status: 404 }),
  }
  await assert.rejects(getOrder('id', new AbortController().signal), /Order not found/)
  window.fetch = async () => Response.json({}, { status: 503 })
  await assert.rejects(getOrder('id', new AbortController().signal), /Unable to load/)
  window.fetch = async () => Response.json({ order: {} })
  await assert.rejects(getOrder('id', new AbortController().signal), /Unable to confirm/)
})
test('order detail renders actual quantities/totals and pending state without fictional delivered dates', async () => {
  globalThis.batchFixture = {
    useQuery: () => ({
      data: {
        id: '1',
        orderNumber: 'REAL-123',
        status: 'PENDING',
        createdAt: '2026-09-01',
        currency: 'INR',
        items: [{ id: 'i', productName: 'Actual mop', quantity: 2, unitPriceMinor: 15000 }],
        subtotalMinor: 30000,
        shippingMinor: 5000,
        taxMinor: 0,
        totalMinor: 35000,
        payment: { provider: 'RAZORPAY', status: 'PENDING' },
        shipment: null,
        shippingAddress: null,
      },
    }),
    getOrder: () => {},
    privateKey: () => [],
    orderStatusLabel: (s) => s,
  }
  const { OrderDetailPage } = await load('../src/pages/OrderDetailPage.tsx', rewrite)
  const text = rendered(
    OrderDetailPage({
      storefront: { localization: { locale: 'en-IN', currency: 'INR' } },
      orderId: '1',
      onNavigate: () => () => {},
    }),
  )
  assert.match(text, /REAL-123/)
  assert.match(text, /Actual mop/)
  assert.match(text, /PENDING/)
  assert.match(text, /350/)
  assert.doesNotMatch(text, /Aug 22|Paid|Delivered on/)
})
test('checkout uses cart quantities and saved address while leaving unconfigured submission unavailable', async () => {
  globalThis.batchFixture = {
    useState: () => ['', () => {}],
    useCart: () => ({
      data: [{ id: 'i', quantity: 3, product: { id: 'p', name: 'Actual mat', priceMinor: 10000 } }],
    }),
    useQuery: () => ({
      data: {
        addresses: [
          {
            id: 'a',
            name: 'Test',
            line1: 'Test lane',
            city: 'Pune',
            state: 'MH',
            postalCode: '411001',
            country: 'IN',
            isDefault: true,
          },
        ],
      },
    }),
    privateKey: () => [],
    getProfile: () => {},
  }
  const { PaymentPage } = await load('../src/pages/PaymentPage.tsx', rewrite)
  const text = rendered(
    PaymentPage({
      storefront: { localization: { locale: 'en-IN', currency: 'INR' } },
      onNavigate: () => () => {},
    }),
  )
  assert.match(text, /Actual mat/)
  assert.match(text, /300/)
  assert.match(text, /Test lane/)
  assert.doesNotMatch(text, /Free returns|Continue to Razorpay/)
})
test('connection indicator subscribes/cleans up and reports offline/online without replaying calls', async () => {
  const listeners = {},
    notices = [],
    states = []
  let effect
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })
  globalThis.window = {
    addEventListener: (type, fn) => (listeners[type] = fn),
    removeEventListener: (type) => delete listeners[type],
  }
  globalThis.batchFixture = {
    useState: (initial) => [initial(), (value) => states.push(value)],
    useEffect: (fn) => {
      effect = fn
    },
    useNotification:
      () =>
      (...args) =>
        notices.push(args),
  }
  const { ConnectionStatus } = await load('../src/components/ConnectionStatus.tsx', rewrite)
  assert.match(rendered(ConnectionStatus()), /You are offline/)
  const cleanup = effect()
  listeners.offline()
  listeners.online()
  assert.deepEqual(states, [true, false])
  assert.match(notices[0][0], /back online/)
  cleanup()
  assert.equal(Object.keys(listeners).length, 0)
})
