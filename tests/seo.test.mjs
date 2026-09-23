import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { canonicalOrigin, productMetadata, productHead, safeJson, xmlEscape } from '../server/api/_lib/seo.ts'
const product = { id: 'product-1', name: 'Mop </title><script>alert(1)</script>', description: 'A useful mop & mat.', priceMinor: 12999, stock: 3, images: [{ url: 'https://example.com/mop.jpg' }, { url: 'javascript:alert(1)' }] }
test('canonical configuration rejects credentials, paths and insecure origins', () => {
  for (const value of [undefined, '', 'http://example.com', 'https://user:secret@example.com', 'https://example.com/path', 'https://example.com?token=secret']) assert.equal(canonicalOrigin(value), null)
  assert.equal(canonicalOrigin('https://example.com/'), 'https://example.com')
})
test('product offers use server minor units and stock without fabricated review claims', () => {
  const data = productMetadata(product, 'https://example.com')
  assert.equal(data.structuredData.offers.price, '129.99')
  assert.equal(data.structuredData.offers.priceCurrency, 'INR')
  assert.equal(data.images.length, 1)
  assert.equal(data.structuredData.aggregateRating, undefined)
  assert.equal(productMetadata({ ...product, stock: 0 }, 'https://example.com').structuredData.offers.availability, 'https://schema.org/OutOfStock')
  assert.equal(productMetadata(product, null).structuredData, null)
})
test('HTML, XML and JSON-LD escape executable product content', () => {
  const html = productHead(product, 'https://example.com', true)
  assert.ok(!html.includes('<script>alert(1)'))
  assert.ok(html.includes('&lt;/title&gt;'))
  assert.ok(!safeJson({ value: '</script>&' }).includes('</script>'))
  assert.equal(xmlEscape('a&b<c'), 'a&amp;b&lt;c')
  assert.ok(productHead(product, null, false).includes('noindex, nofollow'))
})
test('public SEO routes use the sole dispatcher after filesystem preservation', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  const filesystem = config.routes.findIndex((route) => route.handle === 'filesystem')
  for (const [path, kind] of [['/robots.txt', 'robots'], ['/sitemap.xml', 'sitemap'], ['/product/product-1', 'product']]) {
    const index = config.routes.findIndex((route) => route.src && new RegExp(`^${route.src}$`).test(path))
    assert.ok(index > filesystem)
    assert.ok(config.routes[index].dest.includes('route=seo&kind=' + kind))
  }
  assert.ok(config.functions['api/[...route].ts'].includeFiles.includes('dist/index.html'))
})
