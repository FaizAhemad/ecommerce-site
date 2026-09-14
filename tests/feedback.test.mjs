import { test } from 'node:test'
import assert from 'node:assert/strict'
import { feedbackState, saveFeedback } from '../server/api/_lib/feedback.ts'
import { rateLimitRule } from '../server/api/_lib/rate-limit.ts'

function fixture(paid = true) {
  const records = new Map(), calls = []
  const store = {
    order: { findFirst: async args => { calls.push(args); return paid ? { id: 'order-' + args.where.userId, orderNumber: 'FIRST' } : null } },
    $queryRaw: async (_strings, userId) => records.has(userId) ? [records.get(userId)] : [],
    $executeRaw: async (_strings, userId, orderId, rating, comment) => { calls.push({ userId, orderId }); if (!records.has(userId)) records.set(userId, { rating, comment, createdAt: new Date() }); return 1 },
    $transaction: async (action, options) => { assert.equal(options.isolationLevel, 'Serializable'); return action(store) },
  }
  return { store, records, calls }
}
test('feedback eligibility selects the authenticated first paid order without exposing customer/provider fields', async () => {
  const f = fixture()
  const state = await feedbackState(f.store, 'a')
  assert.equal(state.order.id, 'order-a')
  assert.equal(f.calls[0].where.userId, 'a')
  assert.deepEqual(f.calls[0].where.payment.status.in, ['CAPTURED', 'REFUNDED'])
  assert.deepEqual(f.calls[0].orderBy, [{ createdAt: 'asc' }, { id: 'asc' }])
  assert.deepEqual(f.calls[0].select, { id: true, orderNumber: true })
})
test('feedback repeats reconcile once and cannot replace already-submitted content', async () => {
  const f = fixture(), body = { rating: 4, comment: 'Useful' }
  await saveFeedback(f.store, 'a', body)
  await saveFeedback(f.store, 'a', body)
  assert.equal(f.records.size, 1)
  await assert.rejects(saveFeedback(f.store, 'a', { ...body, rating: 1 }), { status: 409 })
  assert.equal(f.records.get('a').rating, 4)
})
test('feedback rejects unpaid accounts and ignores supplied foreign identity/order IDs', async () => {
  const unpaid = fixture(false)
  await assert.rejects(saveFeedback(unpaid.store, 'a', { rating: 5 }), { status: 409 })
  assert.equal(unpaid.records.size, 0)
  const f = fixture()
  await saveFeedback(f.store, 'a', { rating: 5, userId: 'b', orderId: 'foreign' })
  assert.deepEqual(f.calls[1], { userId: 'a', orderId: 'order-a' })
  assert.equal((await feedbackState(f.store, 'b')).feedback, null)
})
test('feedback validates integer rating and comment bounds before writes', async () => {
  for (const body of [{ rating: 0 }, { rating: 6 }, { rating: '5' }, { rating: 1.5 }, { rating: 5, comment: {} }, { rating: 5, comment: 'x'.repeat(2001) }]) {
    const f = fixture()
    await assert.rejects(saveFeedback(f.store, 'a', body), { status: 400 })
    assert.equal(f.records.size, 0)
  }
})
test('feedback writes have account and IP quotas while reads follow the existing policy', () => {
  assert.deepEqual(rateLimitRule('feedback', 'POST'), { scope: 'feedback', seconds: 600, ip: 20, user: 5 })
  assert.equal(rateLimitRule('feedback', 'GET'), null)
})
