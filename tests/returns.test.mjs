import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reviewReturn } from '../server/api/_lib/returns.ts'
const input = {
  returnId: 'return_1',
  status: 'APPROVED',
  expectedStatus: 'REQUESTED',
  resolution: 'Reviewed against approved policy',
}
function fixture({ owner = 'customer', status = 'REQUESTED' } = {}) {
  let current = status
  const store = {
    $transaction: async (callback, options) => {
      assert.equal(options.isolationLevel, 'Serializable')
      return callback({
        returnRequest: {
          findUnique: async () => ({
            id: 'return_1',
            userId: 'customer',
            order: { userId: owner },
          }),
          updateMany: async ({ where, data }) => {
            assert.equal(where.id, 'return_1')
            if (current !== where.status) return { count: 0 }
            current = data.status
            return { count: 1 }
          },
        },
      })
    },
  }
  return { store, status: () => current }
}
test('return review records only an explicit decision without touching payments or stock', async () => {
  const f = fixture()
  assert.deepEqual(await reviewReturn(f.store, input), {
    id: 'return_1',
    status: 'APPROVED',
    resolution: input.resolution,
  })
  assert.equal(f.status(), 'APPROVED')
})
test('return review rejects reopening and stale decisions without replay', async () => {
  const f = fixture()
  await reviewReturn(f.store, input)
  await assert.rejects(reviewReturn(f.store, { ...input, status: 'REJECTED' }), { status: 409 })
  assert.equal(f.status(), 'APPROVED')
})
test('return review rejects financial status changes, absent reasons and unbounded drafts', async () => {
  for (const change of [
    { status: 'REFUNDED' },
    { status: 'REQUESTED' },
    { expectedStatus: 'APPROVED' },
    { resolution: '' },
    { resolution: 'x'.repeat(2001) },
  ]) {
    const f = fixture()
    await assert.rejects(reviewReturn(f.store, { ...input, ...change }), { status: 400 })
    assert.equal(f.status(), 'REQUESTED')
  }
})
test('return record ownership must match its associated order before approval', async () => {
  const f = fixture({ owner: 'different' })
  await assert.rejects(reviewReturn(f.store, input), { status: 409 })
  assert.equal(f.status(), 'REQUESTED')
})
