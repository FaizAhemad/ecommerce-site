import { test } from 'node:test'
import assert from 'node:assert/strict'
import { purchaseEligibility, publicSeller, sellerProductId } from '../server/api/_lib/marketplace-purchases.ts'
import { productMetadata } from '../server/api/_lib/seo.ts'
import { allocateDiscount, sellerFeeAmount } from '../server/api/_lib/seller-fees.ts'

const shop = { id: 'platform', slug: 'gadgify', name: 'Gadgify', status: 'APPROVED', isPlatform: true }
test('purchase eligibility fails closed for missing ownership, moderation and suspension', () => {
  assert.equal(purchaseEligibility(null).available, false)
  for (const moderationStatus of ['DRAFT', 'PENDING', 'REJECTED'])
    assert.equal(purchaseEligibility({ moderationStatus, shop }).available, false)
  assert.equal(purchaseEligibility({ moderationStatus: 'APPROVED', shop: { ...shop, status: 'SUSPENDED' } }).available, false)
  assert.equal(purchaseEligibility({ moderationStatus: 'APPROVED', shop }).available, true)
})
test('seller product requires the exact accepted fee-offer version before checkout', () => {
  const seller = { ...shop, id: 'seller-a', slug: 'seller-a', isPlatform: false, gstReviewStatus: 'APPROVED' }
  const ownership = { moderationStatus: 'APPROVED', shop: seller, offerStatus: 'PROPOSED', offerVersion: 1, acceptedOfferVersion: null }
  assert.equal(purchaseEligibility(ownership).available, false)
  assert.equal(purchaseEligibility({ ...ownership, shop: { ...seller, gstReviewStatus: 'PENDING' }, offerStatus: 'ACCEPTED', acceptedOfferVersion: 1 }).reason, 'The shop’s tax details are awaiting review.')
  assert.equal(purchaseEligibility({ ...ownership, offerStatus: 'ACCEPTED', acceptedOfferVersion: 1 }).available, true)
  assert.equal(purchaseEligibility({ ...ownership, offerStatus: 'ACCEPTED', offerVersion: 2, acceptedOfferVersion: 1 }).available, false)
})
test('public product channel omits shop identity and private records', () => {
  assert.deepEqual(publicSeller({ shop: { ...shop, bankAccount: 'synthetic-private' } }), { isPlatform: true })
  assert.deepEqual(publicSeller({ shop: { ...shop, name: 'Private Shop Name', slug: 'private-shop', isPlatform: false } }), { isPlatform: false })
  assert.notEqual(sellerProductId('shop-a', 'same-draft'), sellerProductId('shop-b', 'same-draft'))
})
test('catalog-only products do not advertise purchasable offers in structured data', () => {
  const metadata = productMetadata({ id: 'seller-item', name: 'Mat', description: null, priceMinor: 10000, stock: 10, images: [], purchasable: false }, 'https://example.com')
  assert.equal('offers' in metadata.structuredData, false)
})
test('seller fee basis snapshots exact per-unit and percentage terms after deterministic discount allocation', () => {
  const lines = [{ productId: 'a', quantity: 1, unitPriceMinor: 101 }, { productId: 'b', quantity: 1, unitPriceMinor: 100 }]
  assert.deepEqual(allocateDiscount(lines, 1), [1, 0])
  assert.equal(sellerFeeAmount({ type: 'FIXED_PER_UNIT', value: 25, version: 1 }, 2, 1000, 100).amountMinor, 50)
  assert.equal(sellerFeeAmount({ type: 'PERCENTAGE', value: 1000, version: 2 }, 1, 101, 1).amountMinor, 10)
  assert.throws(() => allocateDiscount(lines, 202))
})
