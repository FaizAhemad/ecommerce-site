export function canonicalOrigin(value: string | undefined) {
  try {
    const url = new URL(value ?? '')
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash ? url.origin : null
  } catch { return null }
}
export const xmlEscape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!)
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
export function imageUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}
export type SeoProduct = { id: string; name: string; description: string | null; priceMinor: number; stock: number; images: { url: string }[]; purchasable?: boolean }
export function productMetadata(product: SeoProduct, origin: string | null) {
  const title = `${product.name} | Gadgify`
  const description = (product.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Explore ${product.name} at Gadgify.`).slice(0, 160)
  const images = product.images.map((image) => imageUrl(image.url)).filter((url): url is string => !!url)
  const url = origin ? `${origin}/product/${encodeURIComponent(product.id)}` : null
  const structuredData = url ? {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, description, url,
    ...(images.length ? { image: images } : {}),
    ...(product.purchasable === false ? {} : { offers: { '@type': 'Offer', url, priceCurrency: 'INR', price: (product.priceMinor / 100).toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } }),
  } : null
  return { title, description, images, url, structuredData }
}
export function productHead(product: SeoProduct, origin: string | null, indexable: boolean) {
  const meta = productMetadata(product, origin)
  return `<title>${xmlEscape(meta.title)}</title>
<meta name="description" content="${xmlEscape(meta.description)}">
<meta name="robots" content="${indexable ? 'index, follow' : 'noindex, nofollow'}">
<meta property="og:type" content="product"><meta property="og:title" content="${xmlEscape(meta.title)}">
<meta property="og:description" content="${xmlEscape(meta.description)}">
<meta name="twitter:card" content="${meta.images.length ? 'summary_large_image' : 'summary'}">
${meta.url ? `<link rel="canonical" href="${xmlEscape(meta.url)}"><meta property="og:url" content="${xmlEscape(meta.url)}">` : ''}
${meta.images.map((url) => `<meta property="og:image" content="${xmlEscape(url)}">`).join('\n')}
${meta.structuredData ? `<script id="product-structured-data" type="application/ld+json">${safeJson(meta.structuredData)}</script>` : ''}`
}
