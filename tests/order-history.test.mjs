import { test } from 'node:test'
import assert from 'node:assert/strict'
import { orderHistory, historySelect } from '../server/api/_lib/order-history.ts'
import { getOrders, orderStatusLabel } from '../src/api/orders.ts'
import { changeSession } from '../src/api/sessionScope.ts'

test('order history scopes to session owner and selects no provider identifiers or addresses', async () => {
  let args
  await orderHistory(
    {
      order: {
        findMany: async (value) => {
          args = value
          return []
        },
      },
    },
    'customer-a',
    0,
  )
  assert.deepEqual(args.where, { userId: 'customer-a' })
  assert.deepEqual(args.select, historySelect)
  assert.deepEqual(args.select.payment, { select: { status: true } })
  for (const key of ['user', 'userId', 'shippingAddress', 'shipment'])
    assert.equal(args.select[key], undefined)
  assert.equal(args.take, 21)
})
test('history pages expose 20 rows and continuation only when another row exists', async () => {
  for (const count of [0, 20, 21]) {
    let args
    const result = await orderHistory(
      {
        order: {
          findMany: async (value) => {
            args = value
            return Array.from({ length: count }, (_, id) => ({ id }))
          },
        },
      },
      'owner',
      2,
    )
    assert.equal(args.skip, 40)
    assert.equal(result.orders.length, Math.min(count, 20))
    assert.equal(result.nextPage, count === 21 ? 3 : null)
  }
})
test('order client rejects failures/malformed pages instead of showing empty history', async () => {
  changeSession({ id: 'owner', role: 'CUSTOMER' })
  let calls = 0
  globalThis.window = {
    setTimeout,
    clearTimeout,
    fetch: async () => {
      calls++
      return Response.json({ error: {} }, { status: 503 })
    },
  }
  await assert.rejects(getOrders(0, new AbortController().signal), /Unable to load/)
  assert.equal(calls, 1)
  window.fetch = async () => Response.json({ orders: [] })
  await assert.rejects(getOrders(0, new AbortController().signal), /Unable to confirm/)
  window.fetch = async () => Response.json({ orders: [], nextPage: null })
  assert.deepEqual(await getOrders(0, new AbortController().signal), { orders: [], nextPage: null })
})
test('unknown or absent payment state is not translated into paid or delivered', () => {
  assert.equal(orderStatusLabel('CAPTURED'), 'Captured')
  assert.equal(orderStatusLabel('PENDING'), 'Pending')
  assert.equal(orderStatusLabel('unknown'), 'Status unavailable')
  assert.equal(orderStatusLabel('constructor'), 'Status unavailable')
})
