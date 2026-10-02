import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationInput, submitApplication, updateGstProfile, reviewApplication } from '../server/api/_lib/seller-applications.ts'
const input = { id: '12345678-1234-4123-8123-123456789abc', name: 'Sample shop', city: 'Pune', address: '1 Market Road, Pune, Maharashtra', phone: '+919876543210', description: 'Household cleaning products', gstRegistered: true, gstin: '27ABCDE1234F1Z5', gstNotRegisteredReason: '', gstOtherReason: '', gstEnrolmentId: '' }
function store(previous = null, verified = true, existingShop = null) {
  let row = previous && { key: 'seller-application.user-a', value: JSON.stringify(previous) }
  const calls = []
  const tx = {
    shop: { findUnique: async () => existingShop },
    user: { findUnique: async () => ({ email: 'synthetic@example.test', emailVerifiedAt: verified ? new Date() : null }) },
    storeSetting: {
      findUnique: async () => row,
      create: async ({ data }) => { calls.push(data); if (data.key.startsWith('seller-application.')) row = data; return data },
      updateMany: async ({ where, data }) => { if (row?.value !== where.value) return { count: 0 }; row = { ...row, ...data }; return { count: 1 } },
    },
    $executeRaw: async (sql, ...args) => { calls.push({ sql: sql.join('?'), args }); return 1 },
  }
  return { $transaction: async action => action(tx), calls, row: () => row }
}
test('application validation bounds identity and text', () => {
  assert.deepEqual(applicationInput(input), input)
  assert.throws(() => applicationInput({ ...input, id: 'not-an-id' }))
  assert.throws(() => applicationInput({ ...input, description: 'x'.repeat(2001) }))
})
test('GST profile requires a formatted GSTIN for registered shops and a reason for unregistered shops', () => {
  assert.throws(() => applicationInput({ ...input, gstin: '' }), /GSTIN/)
  assert.throws(() => applicationInput({ ...input, gstRegistered: false, gstin: '', gstNotRegisteredReason: '' }), /reason/)
  assert.throws(() => applicationInput({ ...input, gstRegistered: false, gstin: '', gstNotRegisteredReason: 'OTHER' }), /reason/)
  assert.deepEqual(applicationInput({ ...input, gstRegistered: false, gstin: '', gstNotRegisteredReason: 'BELOW_THRESHOLD' }).gstRegistered, false)
  assert.equal(applicationInput({ ...input, gstin: '27abcde1234f1z5' }).gstin, input.gstin)
})
test('unverified account can apply and submitted user identity is ignored', async () => {
  const result = await submitApplication(store(null, false), 'user-a', { ...input, userId: 'victim', status: 'APPROVED' })
  assert.equal(result.userId, 'user-a')
  assert.equal(result.status, 'PENDING')
})
test('repeating a saved request does not create a second application', async () => {
  const fixture = store()
  await submitApplication(fixture, 'user-a', input)
  await submitApplication(fixture, 'user-a', input)
  assert.equal(fixture.calls.length, 1)
})
test('approved sellers can update private GST details without changing shop approval', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 3, status: 'APPROVED' })
  const result = await updateGstProfile(fixture, 'user-a', { gstRegistered: false, gstin: '', gstNotRegisteredReason: 'BELOW_THRESHOLD', gstOtherReason: '', gstEnrolmentId: 'ENROL12345678901', expectedVersion: 3 })
  assert.equal(result.status, 'APPROVED')
  assert.equal(result.version, 4)
  assert.equal(result.gstRegistered, false)
  assert.equal(result.gstReviewStatus, 'PENDING')
  assert.match(fixture.calls[1].key, /^audit\.seller\.gst\./)
  assert.match(fixture.calls[0].sql, /SET "gstReviewStatus"='PENDING'/)
  await assert.rejects(updateGstProfile(fixture, 'user-a', { gstRegistered: true, gstin: input.gstin, expectedVersion: 3 }), /changed/)
})
test('stale decisions cannot create shop access', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 2, status: 'PENDING' })
  await assert.rejects(reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 1, status: 'APPROVED', gstDecision: 'APPROVED', reason: 'Reviewed details' }), /changed/)
  assert.equal(fixture.calls.length, 0)
})
test('approval without email verification binds membership to the application owner and writes an audit record', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 1, status: 'PENDING' }, false)
  const result = await reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 1, status: 'APPROVED', gstDecision: 'APPROVED', reason: 'Reviewed details' })
  assert.equal(result.status, 'APPROVED')
  assert.deepEqual(fixture.calls[1].args, [input.id, 'user-a'])
  assert.match(fixture.calls[3].key, /^audit\.seller\./)
})
test('admin must explicitly approve GST review before granting seller access', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 1, status: 'PENDING', gstRegistered: false, gstin: '', gstNotRegisteredReason: 'BELOW_THRESHOLD', gstEnrolmentId: 'ENROL12345678901' }, false)
  await assert.rejects(reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 1, status: 'APPROVED', reason: 'Reviewed details' }), /GST declaration/)
  assert.equal(fixture.calls.length, 0)
  const result = await reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 1, status: 'APPROVED', gstDecision: 'APPROVED', reason: 'Reviewed eligibility basis' })
  assert.equal(result.gstReviewStatus, 'APPROVED')
  assert.equal(result.status, 'APPROVED')
})
test('admin can edit the review note without changing the approved state', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 3, status: 'APPROVED', reason: 'Old note' })
  const result = await reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 3, status: 'APPROVED', gstDecision: 'APPROVED', reason: 'Corrected review note' })
  assert.equal(result.status, 'APPROVED')
  assert.equal(result.reason, 'Corrected review note')
  assert.equal(fixture.calls.length, 2)
})
test('admin can reverse an approved decision and revoke seller membership', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 4, status: 'APPROVED' })
  const result = await reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 4, status: 'REJECTED', gstDecision: 'REJECTED', reason: 'Review corrected' })
  assert.equal(result.status, 'REJECTED')
  assert.match(fixture.calls[0].sql, /SET "status"='REJECTED'/)
  assert.match(fixture.calls[1].sql, /SET "status"='REVOKED'/)
})
test('admin can approve a rejected application without taking another shop', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 5, status: 'REJECTED' })
  const result = await reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 5, status: 'APPROVED', gstDecision: 'APPROVED', reason: 'Decision corrected' })
  assert.equal(result.status, 'APPROVED')
  assert.match(fixture.calls[0].sql, /INSERT INTO "Shop"/)
  assert.deepEqual(fixture.calls[1].args, [input.id, 'user-a'])
})
test('admin review cannot claim a shop identifier owned by another seller', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 5, status: 'REJECTED' }, false, { id: input.id, isPlatform: false, memberships: [] })
  await assert.rejects(reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 5, status: 'APPROVED', gstDecision: 'APPROVED', reason: 'Decision corrected' }), /already in use/)
  assert.equal(fixture.calls.length, 0)
})
