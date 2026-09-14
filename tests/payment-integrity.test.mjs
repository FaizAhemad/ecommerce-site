import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  matchesCapturedPayment,
  fetchPayment,
  recordCapturedPayment,
  matchesFullRefund,
  recordFullRefund,
} from '../server/api/_lib/payment-confirmation.ts'
import { webhookBody } from '../server/api/_lib/webhook-body.ts'
globalThis.fetch = async () => {
  throw new Error('Offline tests cannot use network')
}

test('full refund reconciliation rejects partial, pending and mismatched provider proof', () => {
  const expected = { id: 'pay_1', orderId: 'order_1', amount: 100, currency: 'INR' }
  const proof = {
    id: 'pay_1',
    order_id: 'order_1',
    amount: 100,
    currency: 'INR',
    status: 'refunded',
    refund_status: 'full',
    amount_refunded: 100,
  }
  assert.equal(matchesFullRefund(proof, expected), true)
  for (const change of [
    { status: 'captured' },
    { refund_status: 'partial' },
    { amount_refunded: 99 },
    { id: 'other' },
    { order_id: 'other' },
    { currency: 'USD' },
    { amount: 200 },
    { amount_refunded: '100' },
  ])
    assert.equal(matchesFullRefund({ ...proof, ...change }, expected), false)
})
test('refund recording binds provider identities/amount and stops when a concurrent binding changed', async () => {
  let orderUpdates = 0
  const store = {
    $transaction: async (callback, options) => {
      assert.equal(options.isolationLevel, 'Serializable')
      return callback({
        payment: {
          updateMany: async ({ where }) => {
            assert.deepEqual(where, {
              orderId: 'o',
              provider: 'RAZORPAY',
              providerOrderId: 'provider_o',
              providerPaymentId: 'p',
              amountMinor: 100,
            })
            return { count: 0 }
          },
        },
        order: {
          updateMany: async () => {
            orderUpdates++
            return { count: 1 }
          },
        },
      })
    },
  }
  await assert.rejects(recordFullRefund(store, 'o', 'provider_o', 'p', 100), /binding changed/)
  assert.equal(orderUpdates, 0)
})
test('capture proof requires matching provider identity, amount, currency and captured status', () => {
  const expected = { id: 'pay_1', orderId: 'order_1', amount: 100, currency: 'INR' }
  const valid = {
    id: 'pay_1',
    order_id: 'order_1',
    amount: 100,
    currency: 'INR',
    status: 'captured',
  }
  assert.equal(matchesCapturedPayment(valid, expected), true)
  for (const change of [
    { status: 'authorized' },
    { amount: 1 },
    { currency: 'USD' },
    { id: 'pay_other' },
    { order_id: 'order_other' },
    { amount: '100' },
  ])
    assert.equal(matchesCapturedPayment({ ...valid, ...change }, expected), false)
})
test('payment lookup is server authenticated and refuses provider failure without replay', async () => {
  let calls = 0
  const result = await fetchPayment(
    'pay_1',
    'synthetic-key',
    'synthetic-secret',
    async (url, init) => {
      calls++
      assert.equal(url, 'https://api.razorpay.com/v1/payments/pay_1')
      assert.match(init.headers.Authorization, /^Basic /)
      return Response.json({ status: 'authorized' })
    },
  )
  assert.equal(result.status, 'authorized')
  assert.equal(calls, 1)
  await assert.rejects(
    fetchPayment('pay_1', 'k', 's', async () => new Response('', { status: 503 })),
    /Unable to verify/,
  )
})
test('capture records atomically and cannot overwrite refunded or differently-bound payment', async () => {
  const calls = []
  const store = {
    $transaction: async (action, config) => {
      assert.equal(config.isolationLevel, 'Serializable')
      return action({
        payment: {
          updateMany: async (args) => {
            calls.push(args)
            return { count: 0 }
          },
        },
        order: {
          updateMany: async () => {
            throw new Error('Must not confirm after lost payment claim')
          },
        },
      })
    },
  }
  assert.equal(await recordCapturedPayment(store, 'o', 'provider-o', 'p'), false)
  assert.deepEqual(calls[0].where.status, { not: 'REFUNDED' })
  assert.deepEqual(calls[0].where.OR, [{ providerPaymentId: null }, { providerPaymentId: 'p' }])
})
test('webhook reader preserves original bytes and rejects reconstructed JSON or oversized streams', async () => {
  const raw = '{ "event": "payment.captured" }\n'
  assert.equal(await webhookBody({ body: raw }), raw)
  assert.equal(
    await webhookBody({
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(raw.slice(0, 8))
        yield Buffer.from(raw.slice(8))
      },
    }),
    raw,
  )
  await assert.rejects(
    webhookBody({ body: { event: 'payment.captured' } }),
    /Original webhook bytes/,
  )
  await assert.rejects(
    webhookBody({
      async *[Symbol.asyncIterator]() {
        yield Buffer.alloc(262145)
      },
    }),
    /too large/,
  )
})
