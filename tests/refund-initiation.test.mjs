import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initiateFullRefund } from '../server/api/_lib/refund-initiation.ts'
const input = { orderId: 'order-1', actorId: 'admin-1', reason: 'Approved cancellation', paymentId: 'pay_example', amount: 12000, currency: 'INR' }
const credentials = { key: 'synthetic', secret: 'synthetic' }
function fixture() {
  let saved
  return { storeSetting: {
    createMany: async ({ data }) => { if (saved) return { count: 0 }; saved = data; return { count: 1 } },
    updateMany: async ({ where, data }) => { if (saved.value !== where.value) return { count: 0 }; saved = { ...saved, ...data }; return { count: 1 } },
  }, value: () => JSON.parse(saved.value) }
}
test('concurrent refund requests make at most one provider call', async () => {
  const store = fixture()
  let calls = 0
  const send = async (_, request) => {
    calls++
    assert.equal(store.value().status, 'UNCONFIRMED')
    assert.equal(JSON.parse(request.body).amount, input.amount)
    return { ok: true, json: async () => ({ id: 'rfnd_example', payment_id: input.paymentId, amount: input.amount, currency: 'INR', status: 'processed' }) }
  }
  await Promise.all([initiateFullRefund(store, input, credentials, send), initiateFullRefund(store, input, credentials, send)])
  assert.equal(calls, 1)
  assert.equal(store.value().status, 'PENDING')
})
test('timeouts persist uncertainty and cannot replay after reload', async () => {
  const store = fixture()
  await initiateFullRefund(store, input, credentials, async () => { throw new Error('Synthetic timeout') })
  assert.equal(store.value().status, 'UNCONFIRMED')
  await initiateFullRefund(store, input, credentials, async () => assert.fail('Financial replay'))
})
test('mismatched provider records cannot confirm a refund', async () => {
  const store = fixture()
  await initiateFullRefund(store, input, credentials, async () => ({ ok: true, json: async () => ({ id: 'rfnd_other', payment_id: 'pay_other', amount: input.amount, currency: 'INR', status: 'processed' }) }))
  assert.equal(store.value().status, 'UNCONFIRMED')
})
