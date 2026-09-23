import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { draftInput, draftKey, mediaKey } from '../server/api/_lib/seller-catalog.ts'
const id = '12345678-1234-4123-8123-123456789abc'
const input = { id, shopId: id, name: 'Kitchen mop', description: 'Reusable cleaning equipment', category: 'Home', priceMinor: 12900, stock: 5, mediaIds: [] }
test('draft validation rejects unsafe prices, fractional stock, invalid IDs and media overflow', () => {
  assert.equal(draftInput(input).priceMinor, 12900)
  for (const change of [{ priceMinor: -1 }, { priceMinor: 100.1 }, { stock: 0.5 }, { id: '../other' }, { mediaIds: [id,id,id,id] }, { description: '' }]) assert.throws(() => draftInput({ ...input, ...change }))
})
test('ownership namespaces differ by shop and discard supplied moderation state', () => {
  assert.notEqual(draftKey('shop-a', id), draftKey('shop-b', id))
  assert.notEqual(mediaKey('shop-a', id), mediaKey('shop-b', id))
  assert.equal(draftInput({ ...input, status: 'APPROVED', isActive: true }).status, undefined)
})
test('catalog publication stays behind scoped, versioned moderation', () => {
  const source = readFileSync(new URL('../server/api/seller/catalog.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /tx\.product\.(create|update|upsert)/)
  assert.match(source, /approvedShop\(tx, user\.id, shopId\)/)
  assert.match(source, /previous\?\.version/)
  assert.match(source, /publishSellerProduct\(tx, next\)/)
  const publication = readFileSync(new URL('../server/api/_lib/publish-seller-product.ts', import.meta.url), 'utf8')
  assert.match(publication, /draft.status !== 'APPROVED'/)
  assert.match(publication, /existing.shopOwnership\?\.shopId !== draft.shopId/)
})
test('shop media publication requires explicit approval and attachment membership', () => {
  const source = readFileSync(new URL('../server/api/shops.ts', import.meta.url), 'utf8')
  assert.match(source, /product\.status !== 'APPROVED'/)
  assert.match(source, /product\.mediaIds\.includes\(mediaId\)/)
  assert.match(source, /"status"='APPROVED'/)
})
