import { test } from 'node:test'
import assert from 'node:assert/strict'
import { purchaseEligibility, publicSeller, sellerProductId } from '../server/api/_lib/marketplace-purchases.ts'
import { productMetadata } from '../server/api/_lib/seo.ts'

const shop = { id: 'platform', slug: 'gadgify', name: 'Gadgify', status: 'APPROVED', isPlatform: true }
test('purchase eligibility fails closed for missing ownership, moderation and suspension', () => {
  assert.equal(purchaseEligibility(null).available, false)
  for (const moderationStatus of ['DRAFT', 'PENDING', 'REJECTED'])
    assert.equal(purchaseEligibility({ moderationStatus, shop }).available, false)
  assert.equal(purchaseEligibility({ moderationStatus: 'APPROVED', shop: { ...shop, status: 'SUSPENDED' } }).available, false)
  assert.equal(purchaseEligibility({ moderationStatus: 'APPROVED', shop }).available, true)
})
test('content approval cannot enable external-shop financial collection', () => {
  assert.equal(purchaseEligibility({ moderationStatus: 'APPROVED', shop: { ...shop, isPlatform: false } }).available, false)
})
test('public seller identity excludes private records and product IDs isolate shops', () => {
  assert.deepEqual(publicSeller({ shop: { ...shop, bankAccount: 'synthetic-private' } }), { name: 'Gadgify', slug: 'gadgify', isPlatform: true })
  assert.notEqual(sellerProductId('shop-a', 'same-draft'), sellerProductId('shop-b', 'same-draft'))
})
test('catalog-only products do not advertise purchasable offers in structured data', () => {
  const metadata = productMetadata({ id: 'seller-item', name: 'Mat', description: null, priceMinor: 10000, stock: 10, images: [], purchasable: false }, 'https://example.com')
  assert.equal('offers' in metadata.structuredData, false)
})
