import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { changeSession, privateKey, sessionGeneration } from '../src/api/sessionScope.ts'
import { apiFetch } from '../src/api/http.ts'
import { queryClient } from '../src/api/queryClient.ts'
import { updateCart, resetCart } from '../src/api/cart.ts'
import {
  readWishlist,
  resetWishlist,
  replaceWishlist,
  wishlistVersion,
} from '../src/api/wishlistState.ts'
import { sendError, setCacheControl } from '../server/api/_lib/http.ts'

// Execute the actual order handler with synthetic auth/store boundaries; no customer DB is used.
const source = readFileSync(new URL('../server/api/orders/index.ts', import.meta.url), 'utf8')
  .replaceAll(
    "'../_lib/order-history.js'",
    JSON.stringify(new URL('../server/api/_lib/order-history.ts', import.meta.url).href),
  )
  .replace("import { db } from '../_lib/db.js'", 'const db = globalThis.orderFixture.db')
  .replace(
    "import { requireUser } from '../_lib/auth.js'",
    'const requireUser = async () => globalThis.orderFixture.user',
  )
  .replaceAll(
    "'../_lib/http.js'",
    JSON.stringify(new URL('../server/api/_lib/http.ts', import.meta.url).href),
  )
  .replaceAll(
    "'../_lib/order-transactions.js'",
    JSON.stringify(new URL('../server/api/_lib/order-transactions.ts', import.meta.url).href),
  )
  .replaceAll(
    "'../_lib/order-address.js'",
    JSON.stringify(new URL('../server/api/_lib/order-address.ts', import.meta.url).href),
  )
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
let fixtureNumber = 0
async function orderRequest(addressId) {
  let writes = 0
  let cartReads = 0
  globalThis.orderFixture = {
    user: { id: 'customer-a' },
    db: {
      address: {
        findFirst: async ({ where }) =>
          where.id === 'address-a' && where.userId === 'customer-a' ? { id: 'address-a' } : null,
      },
      cart: {
        findUnique: async () => {
          cartReads++
          return {
            id: 'cart-a',
            items: [
              { productId: 'p', quantity: 1, product: { name: 'Test', priceMinor: 100, stock: 2 } },
            ],
          }
        },
      },
      $transaction: async (callback) =>
        callback({
          address: globalThis.orderFixture.db.address,
          cart: globalThis.orderFixture.db.cart,
          order: {
            create: async ({ data }) => {
              writes++
              return data
            },
          },
          product: {
            updateMany: async () => {
              writes++
              return { count: 1 }
            },
          },
          cartItem: {
            deleteMany: async () => {
              writes++
            },
          },
        }),
    },
  }
  const handler = (
    await import(
      `data:text/javascript;base64,${Buffer.from(javascript + `\n// ${fixtureNumber++}`).toString('base64')}`
    )
  ).default
  const result = { headers: {} }
  const response = {
    status(code) {
      result.status = code
      return this
    },
    json(body) {
      result.body = body
    },
    setHeader(name, value) {
      result.headers[name] = value
    },
  }
  await handler({ method: 'POST', body: { addressId } }, response)
  return { ...result, writes, cartReads }
}
for (const address of [undefined, '', 123, 'unknown', 'address-b']) {
  test(`order rejects invalid/foreign address ${String(address)} before any cart/order changes`, async () => {
    const result = await orderRequest(address)
    assert.equal(result.status, 400)
    assert.equal(result.body.error.code, 'INVALID_ADDRESS')
    assert.equal(result.writes, 0)
    assert.equal(result.cartReads, 0)
    assert.match(result.headers['Cache-Control'], /no-store/)
  })
}
test('owned address creates order with the authenticated customer ID', async () => {
  const result = await orderRequest('address-a')
  assert.equal(result.status, 201)
  assert.equal(result.body.order.userId, 'customer-a')
  assert.equal(result.body.order.shippingAddressId, 'address-a')
  assert.equal(result.writes, 3)
})

function browser(fetch) {
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: (url, init) =>
      url === '/api/auth/csrf'
        ? Promise.resolve(Response.json({ csrfToken: 'a'.repeat(64) }))
        : fetch(url, init),
    dispatchEvent() {},
    localStorage: {
      removeItem() {
        throw new Error('disabled')
      },
    },
  }
}
function account(id) {
  changeSession({ id, role: 'CUSTOMER' })
  resetCart()
  queryClient.clear()
}
const item = (id, quantity) => ({
  id,
  quantity,
  product: { id, name: id, category: 'Test', priceMinor: 100 },
})
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

test('delayed private response cannot survive an account switch', async () => {
  account('a')
  const oldKey = privateKey('cart')
  const wait = deferred()
  browser(() => wait.promise)
  const request = apiFetch('/api/cart')
  account('b')
  wait.resolve(new Response('{}'))
  await assert.rejects(request, { name: 'AbortError' })
  assert.notDeepEqual(privateKey('cart'), oldKey)
})
test('private JSON body delivered after a session change is rejected', async () => {
  account('a')
  browser(async () => new Response('{"private":"a"}'))
  const response = await apiFetch('/api/cart')
  changeSession(null)
  await assert.rejects(response.json(), { name: 'AbortError' })
})
test('logout and same-account login have distinct cache generations', () => {
  account('a')
  const key = privateKey('my-review', 'p')
  const before = sessionGeneration()
  changeSession(null)
  changeSession({ id: 'a', role: 'CUSTOMER' })
  assert.notDeepEqual(privateKey('my-review', 'p'), key)
  assert.equal(sessionGeneration(), before + 2)
})
test('wishlist reset handles disabled storage and ignores delayed replacement', () => {
  browser(async () => new Response('{}'))
  replaceWishlist(['a-private-product'], wishlistVersion())
  const oldVersion = wishlistVersion()
  resetWishlist()
  replaceWishlist(['a-private-product'], oldVersion)
  assert.deepEqual(readWishlist(), [])
})
test('cart optimistic feedback locks duplicate taps and rolls back on failure', async () => {
  account('a')
  queryClient.setQueryData(privateKey('cart'), [item('p', 1)])
  let calls = 0
  const wait = deferred()
  browser(() => {
    calls++
    return wait.promise
  })
  const request = updateCart(item('p', 1).product, 2, 'set')
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(queryClient.getQueryData(privateKey('cart'))[0].quantity, 2)
  await updateCart(item('p', 1).product, 3, 'set')
  assert.equal(calls, 1)
  wait.resolve(new Response('{}', { status: 503 }))
  await assert.rejects(request)
  assert.equal(queryClient.getQueryData(privateKey('cart'))[0].quantity, 1)
  queryClient.clear()
})
test('out-of-order cart responses preserve successful changes to other rows', async () => {
  account('a')
  queryClient.setQueryData(privateKey('cart'), [item('p', 1), item('q', 1)])
  const waits = { p: deferred(), q: deferred() }
  browser((_url, init) => waits[JSON.parse(init.body).productId].promise)
  const p = updateCart(item('p', 1).product, 2, 'set')
  const q = updateCart(item('q', 1).product, 3, 'set')
  await new Promise((resolve) => setImmediate(resolve))
  waits.q.resolve(Response.json({ cart: { items: [item('p', 1), item('q', 3)] } }))
  await q
  waits.p.resolve(Response.json({ cart: { items: [item('p', 2), item('q', 1)] } }))
  await p
  const items = queryClient.getQueryData(privateKey('cart'))
  assert.equal(items.find((row) => row.id === 'p').quantity, 2)
  assert.equal(items.find((row) => row.id === 'q').quantity, 3)
  queryClient.clear()
})

test('an API error overrides previously configured public caching', () => {
  const headers = {}
  const response = {
    setHeader(name, value) {
      headers[name] = value
    },
    status() {
      return this
    },
    json() {},
  }
  setCacheControl(response, 'public')
  sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Unavailable', 'synthetic-id')
  assert.equal(headers['Cache-Control'], 'private, no-store, max-age=0')
})

test('a cart mutation finishing after logout cannot repopulate the new account cache', async () => {
  account('a')
  const wait = deferred()
  browser(() => wait.promise)
  const request = updateCart(item('p', 1).product, 1, 'add')
  await new Promise((resolve) => setImmediate(resolve))
  account('b')
  wait.resolve(Response.json({ cart: { items: [item('p', 1)] } }))
  await assert.rejects(request, { name: 'AbortError' })
  assert.equal(queryClient.getQueryData(privateKey('cart')), undefined)
  queryClient.clear()
})
