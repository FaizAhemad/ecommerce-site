import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sellerMediaLibrary, deleteUnusedSellerMedia } from '../server/api/_lib/seller-media-library.ts'

const shop = '11111111-1111-4111-8111-111111111111'
const id = '22222222-2222-4222-8222-222222222222'
const updatedAt = new Date('2026-09-23T12:00:00.000Z')
function fixture(overrides = {}, count = 1) {
  const calls = []
  return { calls, tx: {
    $queryRaw: async (sql, ...values) => {
      assert.ok(values.includes(`seller-media.${shop}.`))
      assert.ok(values.includes(`seller-product.${shop}.`))
      return [{ id, updatedAt, bytes: 640, contentType: 'image/png', inUse: false, ...overrides }]
    },
    storeSetting: { deleteMany: async (input) => { calls.push(input); return { count } } },
  } }
}
test('inventory provides bounded usage metadata without media contents', async () => {
  const { tx } = fixture()
  const result = await sellerMediaLibrary(tx, shop)
  assert.equal(result.usedBytes, 640)
  assert.equal(result.usedFiles, 1)
  assert.equal(result.maxFiles, 100)
  assert.equal(result.items[0].data, undefined)
})
test('attached uploads cannot be removed', async () => {
  const { tx, calls } = fixture({ inUse: true })
  await assert.rejects(deleteUnusedSellerMedia(tx, shop, id, updatedAt.toISOString()), { status: 409 })
  assert.equal(calls.length, 0)
})
test('stale metadata cannot remove a replacement upload', async () => {
  const { tx, calls } = fixture()
  await assert.rejects(deleteUnusedSellerMedia(tx, shop, id, new Date(0).toISOString()), { status: 409 })
  assert.equal(calls.length, 0)
})
test('removal scopes the key and timestamp and reports concurrent changes', async () => {
  const { tx, calls } = fixture()
  assert.deepEqual(await deleteUnusedSellerMedia(tx, shop, id, updatedAt.toISOString()), { deleted: true })
  assert.deepEqual(calls[0], { where: { key: `seller-media.${shop}.${id}`, updatedAt } })
  await assert.rejects(deleteUnusedSellerMedia(fixture({}, 0).tx, shop, id, updatedAt.toISOString()), { status: 409 })
})
