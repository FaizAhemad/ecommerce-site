import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { draftInput, draftKey, mediaKey, proposeSellerOffer, respondToSellerOffer } from '../server/api/_lib/seller-catalog.ts'
const id = '12345678-1234-4123-8123-123456789abc'
const input = { id, shopId: id, name: 'Kitchen mop', description: 'Reusable cleaning equipment', category: 'Home', priceMinor: 12900, stock: 5, mediaIds: [] }
test('draft validation allows a mixed ten-file gallery and rejects unsafe fields or media overflow', () => {
  assert.equal(draftInput(input).priceMinor, 12900)
  const mediaIds = Array.from({ length: 11 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`)
  assert.equal(draftInput({ ...input, mediaIds: mediaIds.slice(0, 10) }).mediaIds.length, 10)
  for (const change of [{ priceMinor: -1 }, { priceMinor: 100.1 }, { stock: 0.5 }, { id: '../other' }, { mediaIds }, { description: '' }]) assert.throws(() => draftInput({ ...input, ...change }))
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
  assert.match(source, /const publicProductMedia = request\.query\?\.raw === '1'/)
  assert.match(source, /typeof request\.query\?\.slug === 'string'/)
  assert.match(source, /typeof request\.query\?\.productId === 'string'/)
  assert.match(source, /Approved seller access is required to browse shops\./)
  const access = readFileSync(new URL('../server/api/shops-access.ts', import.meta.url), 'utf8')
  assert.match(access, /user\.role === 'ADMIN'/)
  assert.match(access, /m\."userId" = \$\{user\.id\}/)
  assert.match(access, /s\."status" = 'APPROVED'/)
  assert.match(access, /s\."isPlatform" = FALSE/)
})
test('shop directory navigation is limited to admins and approved shop members', () => {
  const layout = readFileSync(new URL('../src/components/SiteLayout.tsx', import.meta.url), 'utf8')
  assert.match(layout, /const canBrowseShops = isAdmin \|\| shopAccess\.data\?\.allowed === true/)
  assert.match(layout, /canBrowseShops && <a[\s\S]*?Shops/)
  const router = readFileSync(new URL('../src/router.tsx', import.meta.url), 'utf8')
  assert.match(router, /case '\/shops': return isAuthenticated \? <ShopsPage/)
  const card = readFileSync(new URL('../src/components/ProductCard.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(card, /Sold by \{product\.seller\.name\}/)
})
test('seller offer requires an explicit admin proposal and an exact-version shop decision', () => {
  const offer = proposeSellerOffer(undefined, 'PERCENTAGE', 750, '2026-10-02T00:00:00.000Z')
  assert.equal(offer.status, 'PROPOSED')
  assert.equal(offer.value, 750)
  assert.equal(respondToSellerOffer(offer, 1, 'ACCEPTED', '2026-10-02T00:01:00.000Z').acceptedVersion, 1)
  assert.equal(respondToSellerOffer(offer, 1, 'REJECTED', '2026-10-02T00:01:00.000Z').status, 'REJECTED')
  assert.throws(() => respondToSellerOffer(offer, 2, 'ACCEPTED', '2026-10-02T00:01:00.000Z'), /changed/)
  assert.throws(() => proposeSellerOffer(undefined, 'PERCENTAGE', 10001, 'now'), /fee per unit or a percentage/)
})
test('seller product review form submits through the shared MUI button', () => {
  const source = readFileSync(new URL('../src/pages/SellerCatalogPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /<Stack component="form"[\s\S]*?onSubmit=\{\(event: FormEvent\)/)
  assert.match(source, /<Button type="submit" variant="contained" disabled=\{busy\}>[\s\S]*?Send fee offer/)
})
test('marketplace agreement gates seller checkout and order fee snapshots', () => {
  const migration = readFileSync(new URL('../prisma/migrations/20261002120000_marketplace_commercial_offers/migration.sql', import.meta.url), 'utf8')
  assert.match(migration, /"offerStatus"='ACCEPTED'/)
  assert.match(migration, /"acceptedOfferVersion"="offerVersion"/)
  assert.match(migration, /"feeAmountMinor"/)
  assert.match(migration, /NEW\."discountMinor"/)
  assert.match(migration, /"phone" TEXT/)
  assert.match(migration, /"address" TEXT/)
})
