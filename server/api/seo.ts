import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from './_lib/db.js'
import { publishedProductWhere, purchaseEligibility } from './_lib/marketplace-purchases.js'
import { canonicalOrigin, imageUrl, productHead, xmlEscape } from './_lib/seo.js'
import type { VercelRequest, VercelResponse } from './_lib/http.js'
type TextResponse = VercelResponse & { end?: (body?: string) => unknown }
const publicPaths = ['/', '/products', '/help', '/support']
const policyPaths = { privacy: '/privacy', returns: '/returns', refund: '/refund-policy', terms: '/terms', shipping: '/shipping', cancellation: '/cancellation', cookies: '/cookies' } as const
function send(response: TextResponse, status: number, type: string, body: string, head = false) {
  response.status(status)
  response.setHeader?.('Content-Type', type + '; charset=utf-8')
  response.setHeader?.('Cache-Control', 'no-store')
  response.setHeader?.('X-Content-Type-Options', 'nosniff')
  if (!response.end) throw new Error('Text response unavailable')
  return response.end(head ? undefined : body)
}
export default async function handler(request: VercelRequest, response: TextResponse) {
  const head = request.method === 'HEAD'
  if (request.method !== 'GET' && !head) return send(response, 405, 'text/plain', 'Use GET or HEAD.')
  const kind = request.query?.kind
  const origin = canonicalOrigin(process.env.VITE_SITE_URL)
  const host = request.headers?.host
  const indexable = !!origin && typeof host === 'string' && new URL(origin).host === host && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production')
  response.setHeader?.('X-Robots-Tag', indexable && kind === 'product' ? 'index, follow' : 'noindex, nofollow')
  if (kind === 'robots') return send(response, 200, 'text/plain', indexable
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n', head)
  try {
    if (kind === 'sitemap') {
      if (!indexable || !origin) return send(response, 200, 'application/xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', head)
      const page = request.query?.page
      const count = await db.product.count({ where: publishedProductWhere })
      const pageCount = Math.max(1, Math.ceil(count / 1000))
      if (pageCount > 50000) return send(response, 503, 'text/plain', 'Sitemap capacity requires review.', head)
      if (page === undefined) {
        const entries = Array.from({ length: pageCount }, (_, index) => `<sitemap><loc>${xmlEscape(origin + '/sitemap.xml?page=' + index)}</loc></sitemap>`)
        return send(response, 200, 'application/xml', `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</sitemapindex>`, head)
      }
      if (typeof page !== 'string' || !/^\d{1,5}$/.test(page)) return send(response, 400, 'text/plain', 'Invalid sitemap page.', head)
      if (Number(page) >= pageCount) return send(response, 404, 'text/plain', 'Sitemap page not found.', head)
      const products = await db.product.findMany({ where: publishedProductWhere, select: { id: true, updatedAt: true }, orderBy: { id: 'asc' }, skip: Number(page) * 1000, take: 1000 })
      const entries = products.map((product) => `<url><loc>${xmlEscape(origin + '/product/' + encodeURIComponent(product.id))}</loc><lastmod>${product.updatedAt.toISOString()}</lastmod></url>`)
      if (page === '0') {
        const paths = [...publicPaths]
        const policies = await db.storeSetting.findMany({ where: { key: { startsWith: 'policy.' } }, select: { key: true, value: true } })
        for (const [kind, path] of Object.entries(policyPaths)) {
          if (policies.some((policy) => { try { return policy.key === `policy.${kind}.en` && !!JSON.parse(policy.value).published } catch { return false } })) paths.push(path)
        }
        entries.unshift(...paths.map((path) => `<url><loc>${xmlEscape(origin + path)}</loc></url>`))
      }
      return send(response, 200, 'application/xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`, head)
    }
    if (kind !== 'product') return send(response, 404, 'text/plain', 'Not found.', head)
    const id = request.query?.id
    if (typeof id !== 'string' || !id || id.length > 128 || /[/\\\x00-\x1f]/.test(id)) return send(response, 404, 'text/plain', 'Product not found.', head)
    const product = await db.product.findFirst({ where: { id, ...publishedProductWhere }, select: { id: true, name: true, description: true, priceMinor: true, stock: true, shopOwnership: { include: { shop: true } }, images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 10 } } })
    if (!product) { response.setHeader?.('X-Robots-Tag', 'noindex'); return send(response, 404, 'text/html', '<!doctype html><title>Product not found | Gadgify</title><h1>Product not found</h1><a href="/products">Browse products</a>', head) }
    const development = process.env.VERCEL_ENV === 'development' || process.env.NODE_ENV !== 'production'
    let html = await readFile(join(process.cwd(), development ? 'index.html' : 'dist/index.html'), 'utf8')
    html = html.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\b[^>]*name=["'](?:description|robots)["'][^>]*>/gi, '')
    const purchasable = purchaseEligibility(product.shopOwnership).available
    html = html.replace('</head>', productHead({ ...product, purchasable }, origin, indexable) + '</head>')
    const leadImage = imageUrl(product.images[0]?.url ?? '')
    const productFallback = `<main class="seo-product-fallback"><div class="seo-product-fallback__image${leadImage ? '' : ' seo-product-fallback__image--empty'}">${leadImage ? `<img src="${xmlEscape(leadImage)}" alt="${xmlEscape(product.name)}" fetchpriority="high">` : '<span>Product image unavailable</span>'}</div><div class="seo-product-fallback__details"><p class="seo-product-fallback__eyebrow">Gadgify | Product details</p><h1>${xmlEscape(product.name)}</h1>${product.description ? `<p class="seo-product-fallback__description">${xmlEscape(product.description)}</p>` : ''}<p class="seo-product-fallback__price">INR ${(product.priceMinor / 100).toFixed(2)}</p><p class="seo-product-fallback__stock">${!purchasable ? 'Ordering from this shop is not available yet' : product.stock > 0 ? 'In stock' : 'Out of stock'}</p><a class="seo-product-fallback__link" href="/products">Browse products</a></div></main>`
    html = html.replace('<div id="root"></div>', `<div id="root">${productFallback}</div>`)
    if (development) html = html.replace('</head>', '<script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/@vite/client"></script></head>')
    return send(response, 200, 'text/html', html, head)
  } catch { response.setHeader?.('X-Robots-Tag', 'noindex'); response.setHeader?.('Retry-After', '30'); return send(response, 503, 'text/plain', 'This page is temporarily unavailable. Please try again.', head) }
}
