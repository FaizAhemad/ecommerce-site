import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enqueueShopOrderNotification, shopNotificationKind } from '../server/api/_lib/shop-order-notifications.ts'
import { parseNotificationJob, processNotification } from '../server/api/_lib/notification-queue.ts'

function fixture(verified = true) {
  const rows = new Map()
  const store = {
    order: { findUnique: async () => ({ userId: 'owner', orderNumber: '<order>', user: { email: 'owner@example.test', emailVerifiedAt: verified ? new Date() : null } }) },
    user: { findUnique: async () => ({ email: 'owner@example.test', emailVerifiedAt: verified ? new Date() : null }) },
    storeSetting: {
      findUnique: async ({ where }) => rows.get(where.key) ?? null,
      create: async ({ data }) => { assert.equal(rows.has(data.key), false); rows.set(data.key, data); return data },
      updateMany: async ({ where, data }) => { const row = rows.get(where.key); if (row?.value !== where.value) return { count: 0 }; rows.set(where.key, { ...row, ...data }); return { count: 1 } },
    },
  }
  return { rows, store }
}
const input = { orderId: 'order-1', sellerOrderId: 'so-1', shopName: '<script>Shop</script>', eventVersion: 3, action: 'fulfill', status: 'SHIPPED' }

test('only committed shipment/return notification states have supported mappings', () => {
  assert.equal(shopNotificationKind('fulfill', 'SHIPPED'), 'SHOP_DISPATCHED')
  assert.equal(shopNotificationKind('fulfill', 'DELIVERED'), 'SHOP_DELIVERED')
  for (const status of ['APPROVED','REJECTED','RECEIVED']) assert.equal(shopNotificationKind('review-return', status), `SHOP_RETURN_${status}`)
  for (const status of ['PACKING','REFUNDED','CANCELLED','__proto__']) assert.equal(shopNotificationKind('fulfill', status), null)
  assert.equal(shopNotificationKind('review-return', 'CANCELLED'), null)
})
test('outbox identifies shop/version, derives owner, escapes copy and deduplicates', async () => {
  const { rows, store } = fixture()
  const [key] = await enqueueShopOrderNotification(store, input)
  await enqueueShopOrderNotification(store, input)
  assert.equal(rows.size, 1)
  const job = parseNotificationJob(rows.get(key).value)
  assert.equal(job.userId, 'owner')
  assert.deepEqual(job.payload.to, ['owner@example.test'])
  assert.match(job.payload.html, /&lt;script&gt;Shop/)
  assert.match(job.payload.html, /does not confirm payment, a refund or bank settlement/)
  await enqueueShopOrderNotification(store, { ...input, sellerOrderId: 'so-2' })
  assert.equal(rows.size, 2)
})
test('unverified customers are skipped and recipient changes prevent sending', async () => {
  const skipped = fixture(false)
  const [skippedKey] = await enqueueShopOrderNotification(skipped.store, input)
  assert.equal(parseNotificationJob(skipped.rows.get(skippedKey).value).status, 'SKIPPED')
  const { rows, store } = fixture()
  const [key] = await enqueueShopOrderNotification(store, input)
  store.user.findUnique = async () => ({ email: 'changed@example.test', emailVerifiedAt: new Date() })
  const result = await processNotification(store, key, { apiKey: 'synthetic', from: 'sender@example.test' }, async () => assert.fail('Must not send to changed recipient'), Date.now() + 1)
  assert.equal(result, 'SKIPPED')
  const malformed = JSON.parse(rows.get(key).value)
  delete malformed.eventId
  assert.equal(parseNotificationJob(JSON.stringify(malformed)), null)
})
test('packing does not create an unintended email', async () => {
  const { rows, store } = fixture()
  assert.deepEqual(await enqueueShopOrderNotification(store, { ...input, status: 'PACKING' }), [])
  assert.equal(rows.size, 0)
})
