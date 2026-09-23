import { test } from 'node:test'
import assert from 'node:assert/strict'
import { processNotification, RETRY_WINDOW_MS } from '../server/api/_lib/notification-queue.ts'
import { enqueueDisputeNotifications } from '../server/api/_lib/dispute-notifications.ts'
const key = 'order-email.order-1.ORDER_RECORDED'
function fixture(overrides = {}) {
  let value = JSON.stringify({ version: 2, orderId: 'order-1', userId: 'user-1', kind: 'ORDER_RECORDED', status: 'PENDING', payload: { from: '', to: ['customer@example.test'], subject: 'Recorded', html: '<p>Recorded</p>' }, attempts: 0, firstAttemptAt: null, availableAt: 0, leaseUntil: 0, credentialHash: null, updatedAt: new Date(0).toISOString(), ...overrides })
  return { storeSetting: {
    findUnique: async () => ({ key, value }),
    updateMany: async ({ where, data }) => { if (where.value !== value) return { count: 0 }; value = data.value; return { count: 1 } },
  }, user: { findUnique: async () => ({ email: 'customer@example.test', emailVerifiedAt: new Date() }) } }
}
const config = { apiKey: 'synthetic-key', from: 'store@example.test' }
test('concurrent claims send once and retries retain exact payload and key', async () => {
  const store = fixture()
  const requests = []
  const send = async (_, request) => { requests.push(request); return { ok: false, status: 502 } }
  await Promise.all([processNotification(store, key, config, send, 1000), processNotification(store, key, config, send, 1000)])
  assert.equal(requests.length, 1)
  await processNotification(store, key, { ...config, from: 'changed@example.test' }, send, 62000)
  assert.equal(requests.length, 2)
  assert.equal(requests[0].body, requests[1].body)
  assert.equal(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key'])
})
test('expired, legacy and changed-recipient jobs do not send', async () => {
  const never = async () => assert.fail('Unexpected provider call')
  assert.equal(await processNotification(fixture({ firstAttemptAt: 1, attempts: 1, status: 'RETRY' }), key, config, never, RETRY_WINDOW_MS + 1), 'UNCONFIRMED')
  assert.equal(await processNotification(fixture({ version: 1 }), key, config, never, 1000), 'LEGACY')
  const store = fixture()
  store.user.findUnique = async () => ({ email: 'other@example.test', emailVerifiedAt: new Date() })
  assert.equal(await processNotification(store, key, config, never, 1000), 'SKIPPED')
})

test('staff dispute notifications bind the private configured inbox and block recipient changes after an attempt', async () => {
  const staffKey = 'order-email.order-1.DISPUTE_SUPPORT.so-1-1'
  const store = fixture({ kind: 'DISPUTE_SUPPORT', eventId: 'so-1-1', payload: { from: '', to: [''], subject: 'Support', html: '<p>Sign in</p>' } })
  store.user.findUnique = async () => assert.fail('Staff inbox must not resolve from customer data')
  const requests = []
  const send = async (_, request) => { requests.push(request); return { ok: false, status: 502 } }
  assert.equal(await processNotification(store, staffKey, config, send, 1000), 'BLOCKED')
  assert.equal(requests.length, 0)
  await processNotification(store, staffKey, { ...config, supportEmail: 'private@example.test' }, send, 1000)
  assert.deepEqual(JSON.parse(requests[0].body).to, ['private@example.test'])
  assert.equal(await processNotification(store, staffKey, { ...config, supportEmail: 'different@example.test' }, send, 62000), 'BLOCKED')
  assert.equal(requests.length, 1)
})

test('dispute outbox routes by actor, binds each version and omits conversation bodies', async () => {
  const records = new Map()
  const tx = { order: { findUnique: async () => ({ userId: 'user-1', user: { email: 'customer@example.test', emailVerifiedAt: new Date() } }) },
    storeSetting: { findUnique: async ({ where }) => records.get(where.key), create: async ({ data }) => { records.set(data.key, data); return data } } }
  const dispute = { status: 'OPEN', version: 1, messages: [{ audience: 'customer', action: 'support-open', body: 'PRIVATE_BODY' }] }
  assert.equal((await enqueueDisputeNotifications(tx, 'order-1', 'so-1', dispute)).length, 1)
  await enqueueDisputeNotifications(tx, 'order-1', 'so-1', dispute)
  assert.equal(records.size, 1)
  assert.ok([...records.keys()][0].includes('DISPUTE_SUPPORT'))
  dispute.version = 2
  dispute.messages.push({ audience: 'admin', action: 'support-resolve', body: 'PRIVATE_DECISION' })
  await enqueueDisputeNotifications(tx, 'order-1', 'so-1', dispute)
  assert.equal(records.size, 2)
  const customer = JSON.parse([...records.values()][1].value)
  assert.equal(customer.kind, 'DISPUTE_CUSTOMER')
  assert.deepEqual(customer.payload.to, ['customer@example.test'])
  assert.doesNotMatch(JSON.stringify([...records.values()]), /PRIVATE_BODY|PRIVATE_DECISION/)
})
