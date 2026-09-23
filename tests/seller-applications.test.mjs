import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationInput, submitApplication, reviewApplication } from '../server/api/_lib/seller-applications.ts'
const input = { id: '12345678-1234-4123-8123-123456789abc', name: 'Sample shop', city: 'Pune', description: 'Household cleaning products' }
function store(previous = null, verified = true) {
  let row = previous && { key: 'seller-application.user-a', value: JSON.stringify(previous) }
  const calls = []
  const tx = {
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
test('verified account is required and submitted user identity is ignored', async () => {
  await assert.rejects(submitApplication(store(null, false), 'user-a', input), /Verify/)
  const result = await submitApplication(store(), 'user-a', { ...input, userId: 'victim', status: 'APPROVED' })
  assert.equal(result.userId, 'user-a')
  assert.equal(result.status, 'PENDING')
})
test('repeating a saved request does not create a second application', async () => {
  const fixture = store()
  await submitApplication(fixture, 'user-a', input)
  await submitApplication(fixture, 'user-a', input)
  assert.equal(fixture.calls.length, 1)
})
test('stale decisions cannot create shop access', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 2, status: 'PENDING' })
  await assert.rejects(reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 1, status: 'APPROVED', reason: 'Reviewed details' }), /changed/)
  assert.equal(fixture.calls.length, 0)
})
test('approval binds membership to the application owner and writes an audit record', async () => {
  const fixture = store({ ...input, userId: 'user-a', version: 1, status: 'PENDING' })
  const result = await reviewApplication(fixture, 'admin', { userId: 'user-a', expectedVersion: 1, status: 'APPROVED', reason: 'Reviewed details' })
  assert.equal(result.status, 'APPROVED')
  assert.deepEqual(fixture.calls[1].args, [input.id, 'user-a'])
  assert.match(fixture.calls[2].key, /^audit\.seller\./)
})
