import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createCartOrder,
  cancelOrder,
  updateOrderStatus,
  isTransactionConflict,
} from '../server/api/_lib/order-transactions.ts'

// Deterministic serialized transaction double with rollback. Live PostgreSQL validation is user-owned.
function storeFixture({
  stock = 1,
  secondStock,
  orderStatus,
  failRestock = false,
  failCreate = false,
} = {}) {
  let state = {
    products: {
      p: { id: 'p', name: 'Test', priceMinor: 100, stock, isActive: true },
      ...(secondStock === undefined
        ? {}
        : { q: { id: 'q', name: 'Second', priceMinor: 200, stock: secondStock, isActive: true } }),
    },
    carts: { a: [{ productId: 'p', quantity: 1 }], b: [{ productId: 'p', quantity: 1 }] },
    orders: orderStatus
      ? [
          {
            id: 'existing',
            userId: 'a',
            status: orderStatus,
            items: [{ productId: 'p', quantity: 1 }],
          },
        ]
      : [],
  }
  if (secondStock !== undefined) state.carts.a.push({ productId: 'q', quantity: 1 })
  let tail = Promise.resolve()
  const store = {
    async $transaction(callback, options) {
      assert.equal(options.isolationLevel, 'Serializable')
      assert.ok(options.timeout <= 30_000)
      const result = tail.then(async () => {
        const draft = structuredClone(state)
        const findOrder = (where) =>
          draft.orders.find(
            (order) => order.id === where.id && (!where.userId || order.userId === where.userId),
          ) ?? null
        const tx = {
          address: {
            findFirst: async ({ where }) =>
              where.id === `address-${where.userId}` ? { id: where.id } : null,
          },
          cart: {
            findUnique: async ({ where }) => ({
              id: where.userId,
              items: draft.carts[where.userId].map((item) => ({
                ...item,
                product: draft.products[item.productId],
              })),
            }),
          },
          product: {
            updateMany: async ({ where, data }) => {
              assert.equal(where.isActive, true)
              const product = draft.products[where.id]
              if (!product?.isActive || product.stock < where.stock.gte) return { count: 0 }
              product.stock -= data.stock.decrement
              return { count: 1 }
            },
            update: async ({ where, data }) => {
              if (failRestock) throw new Error('Synthetic stock failure')
              draft.products[where.id].stock += data.stock.increment
            },
          },
          order: {
            create: async ({ data }) => {
              if (failCreate) throw new Error('Synthetic order failure')
              const order = {
                ...data,
                id: `order-${draft.orders.length}`,
                status: 'PENDING',
                items: data.items.create,
              }
              draft.orders.push(order)
              return order
            },
            findFirst: async ({ where }) => findOrder(where),
            findUnique: async ({ where }) => findOrder(where),
            updateMany: async ({ where, data }) => {
              const order = findOrder(where)
              if (!order || order.status !== where.status) return { count: 0 }
              Object.assign(order, data)
              return { count: 1 }
            },
          },
          cartItem: {
            deleteMany: async ({ where }) => {
              draft.carts[where.cartId] = []
            },
          },
        }
        const output = await callback(tx)
        state = draft
        return output
      })
      tail = result.catch(() => {})
      return result
    },
  }
  return { store, state: () => state }
}
test('two buyers competing for the last item produce one order and nonnegative stock', async () => {
  const fixture = storeFixture()
  const results = await Promise.allSettled(
    ['a', 'b'].map((user) => createCartOrder(fixture.store, user, `address-${user}`)),
  )
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(results.find((result) => result.status === 'rejected').reason.code, 'OUT_OF_STOCK')
  assert.equal(fixture.state().products.p.stock, 0)
  assert.equal(fixture.state().orders.length, 1)
  assert.equal(fixture.state().carts.b.length, 1)
})
test('concurrent submissions of one cart cannot create duplicate orders', async () => {
  const fixture = storeFixture({ stock: 10 })
  const results = await Promise.allSettled(
    [1, 2].map(() => createCartOrder(fixture.store, 'a', 'address-a')),
  )
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(fixture.state().orders.length, 1)
  assert.equal(fixture.state().products.p.stock, 9)
})
test('a later out-of-stock row rolls back all earlier reservations and keeps the cart', async () => {
  const fixture = storeFixture({ secondStock: 0 })
  await assert.rejects(createCartOrder(fixture.store, 'a', 'address-a'), { code: 'OUT_OF_STOCK' })
  assert.equal(fixture.state().products.p.stock, 1)
  assert.equal(fixture.state().carts.a.length, 2)
  assert.equal(fixture.state().orders.length, 0)
})
test('order persistence failure rolls back inventory and cart changes', async () => {
  const fixture = storeFixture({ failCreate: true })
  await assert.rejects(createCartOrder(fixture.store, 'a', 'address-a'))
  assert.equal(fixture.state().products.p.stock, 1)
  assert.equal(fixture.state().carts.a.length, 1)
})
test('foreign addresses and archived products cannot be ordered', async () => {
  const fixture = storeFixture()
  await assert.rejects(createCartOrder(fixture.store, 'a', 'address-b'), {
    code: 'INVALID_ADDRESS',
  })
  fixture.state().products.p.isActive = false
  await assert.rejects(createCartOrder(fixture.store, 'a', 'address-a'), { code: 'OUT_OF_STOCK' })
  assert.equal(fixture.state().products.p.stock, 1)
})
test('customer and admin simultaneous cancellation restore inventory only once', async () => {
  const fixture = storeFixture({ stock: 0, orderStatus: 'CONFIRMED' })
  await Promise.all([
    cancelOrder(fixture.store, 'existing', 'a'),
    updateOrderStatus(fixture.store, 'existing', 'CANCELLED'),
  ])
  await cancelOrder(fixture.store, 'existing', 'a')
  assert.equal(fixture.state().products.p.stock, 1)
  assert.equal(fixture.state().orders[0].status, 'CANCELLED')
})
test('foreign customers cannot cancel or discover another customer order', async () => {
  const fixture = storeFixture({ orderStatus: 'PENDING' })
  await assert.rejects(cancelOrder(fixture.store, 'existing', 'b'), { code: 'NOT_FOUND' })
  assert.equal(fixture.state().orders[0].status, 'PENDING')
  assert.equal(fixture.state().products.p.stock, 1)
})
test('restock failure rolls cancellation back so a retry can safely restore stock', async () => {
  const fixture = storeFixture({ stock: 0, orderStatus: 'PENDING', failRestock: true })
  await assert.rejects(cancelOrder(fixture.store, 'existing', 'a'))
  assert.equal(fixture.state().orders[0].status, 'PENDING')
  assert.equal(fixture.state().products.p.stock, 0)
})
test('ineligible and terminal orders cannot be cancelled or reopened by status editing', async () => {
  for (const status of ['PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED']) {
    const fixture = storeFixture({ orderStatus: status })
    await assert.rejects(cancelOrder(fixture.store, 'existing'), { code: 'CONFLICT' })
    assert.equal(fixture.state().products.p.stock, 1)
  }
  for (const status of ['CANCELLED', 'REFUNDED']) {
    const fixture = storeFixture({ orderStatus: status })
    await assert.rejects(updateOrderStatus(fixture.store, 'existing', 'PENDING'), {
      code: 'CONFLICT',
    })
    assert.equal(fixture.state().orders[0].status, status)
  }
})
test('Prisma serialization/deadlock errors are identified without automatic write replay', () => {
  assert.equal(isTransactionConflict({ code: 'P2034' }), true)
  assert.equal(isTransactionConflict({ code: 'P1001' }), false)
  assert.equal(isTransactionConflict(null), false)
})
