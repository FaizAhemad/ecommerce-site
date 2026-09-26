import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inspectionUpdate, inspectionDto, inspectionHoldsDispatch } from '../server/api/_lib/shop-inspection.ts'
import { enqueueInspectionNotifications } from '../server/api/_lib/inspection-notifications.ts'
import { parseNotificationJob, processNotification } from '../server/api/_lib/notification-queue.ts'
const now = '2026-09-24T12:00:00.000Z'
let sequence = 0
const input = (action, previous, extra = {}) => ({ action, reason: 'Synthetic inspection note', requestId: `11111111-1111-4111-8111-${String(++sequence).padStart(12, '0')}`, expectedVersion: previous?.version ?? 0, ...extra })
const update = (previous, action) => inspectionUpdate(previous, input(action, previous), 'admin', now)

test('selected inspection blocks dispatch until physical receipt and pass', () => {
  assert.equal(inspectionHoldsDispatch(null), false)
  const requested = update(null, 'inspection-request')
  assert.equal(inspectionHoldsDispatch(requested), true)
  assert.throws(() => update(requested, 'inspection-pass'), { status: 409 })
  const received = update(requested, 'inspection-receive')
  assert.equal(inspectionHoldsDispatch(received), true)
  const passed = update(received, 'inspection-pass')
  assert.equal(inspectionHoldsDispatch(passed), false)
})
test('failed items remain held through shop return and replacement until reinspection passes', () => {
  let value = update(update(null, 'inspection-request'), 'inspection-receive')
  for (const action of ['inspection-fail', 'inspection-return', 'inspection-returned', 'inspection-replace', 'inspection-receive']) {
    value = update(value, action)
    assert.equal(inspectionHoldsDispatch(value), true)
  }
  assert.equal(update(value, 'inspection-pass').status, 'PASSED')
})
test('recorded actions bind UUID to actor/content and stale writes fail', () => {
  const request = input('inspection-request', null)
  const value = inspectionUpdate(null, request, 'admin', now)
  assert.equal(inspectionUpdate(value, request, 'admin', now), value)
  assert.throws(() => inspectionUpdate(value, { ...request, reason: 'Changed text' }, 'admin', now), { status: 409 })
  assert.throws(() => inspectionUpdate(value, input('inspection-receive', null), 'admin', now), { status: 409 })
})
test('staff call notes and photos are not exposed to customers; seller receives no actor IDs or call notes', () => {
  const value = update(update(null, 'inspection-request'), 'inspection-call')
  value.photoIds = ['photo-1']
  const customer = inspectionDto(value, 'customer')
  assert.deepEqual(customer.history, [])
  assert.deepEqual(customer.photoIds, [])
  const seller = inspectionDto(value, 'seller')
  assert.equal(seller.history.length, 1)
  assert.equal(seller.history[0].actorId, undefined)
  assert.equal(inspectionDto(value, 'admin').history.length, 2)
})
test('inspection emails bind shop membership and do not send after access revocation', async () => {
  const rows = new Map()
  const store = {
    user: {
      findMany: async ({ where }) => { assert.equal(where.shopMemberships.some.shopId, 'shop-1'); return [{ id: 'seller-1', email: 'seller@example.test', emailVerifiedAt: new Date() }] },
      findFirst: async () => null,
      findUnique: async () => ({ email: 'seller@example.test', emailVerifiedAt: new Date() }),
    },
    storeSetting: {
      findUnique: async ({ where }) => rows.get(where.key) ?? null,
      create: async ({ data }) => { rows.set(data.key, data); return data },
      updateMany: async ({ where, data }) => { const row = rows.get(where.key); if (row?.value !== where.value) return { count: 0 }; rows.set(where.key, { ...row, ...data }); return { count: 1 } },
    },
  }
  const inspection = update(null, 'inspection-request')
  const [key] = await enqueueInspectionNotifications(store, 'order-1', 'so-1', 'shop-1', inspection)
  assert.equal(parseNotificationJob(rows.get(key).value).shopId, 'shop-1')
  assert.equal(await processNotification(store, key, { apiKey: 'synthetic', from: 'sender@example.test' }, async () => assert.fail('Revoked member must not receive mail'), Date.now() + 10), 'SKIPPED')
  assert.deepEqual(await enqueueInspectionNotifications(store, 'order-1', 'so-1', 'shop-1', update(inspection, 'inspection-call')), [])
})
