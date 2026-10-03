import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { validateMediaUpload } from './_lib/media.js'
import { sellerProductId } from './_lib/marketplace-purchases.js'
import { validId, mediaKey, type SellerDraft } from './_lib/seller-catalog.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from './_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse & { end?: (data: Buffer) => unknown }) {
  const id = requestId(request)
  response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET.', id)
  const publicProductMedia = request.query?.raw === '1'
    && typeof request.query?.slug === 'string'
    && typeof request.query?.productId === 'string'
    && typeof request.query?.mediaId === 'string'
  if (!publicProductMedia) {
    const user = await requireUser(request, response)
    if (!user) return
    if (user.role !== 'ADMIN') {
      try {
        const access = await db.$queryRaw<{ allowed: boolean }[]>`
          SELECT EXISTS (
            SELECT 1 FROM "Shop" s
            JOIN "ShopMembership" m ON m."shopId" = s."id"
            WHERE m."userId" = ${user.id} AND m."status" = 'ACTIVE'
              AND s."status" = 'APPROVED' AND s."isPlatform" = FALSE
          ) AS "allowed"
        `
        if (access[0]?.allowed !== true) return sendError(response, 403, 'FORBIDDEN', 'Approved seller access is required to browse shops.', id)
      } catch {
        return sendError(response, 503, 'SHOPS_UNAVAILABLE', 'Shops are temporarily unavailable.', id)
      }
    }
  }
  const page = request.query?.page ?? '0', slug = request.query?.slug
  if (typeof page !== 'string' || !/^\d{1,5}$/.test(page) || (slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(slug))))
    return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid shop request.', id)
  try {
    if (!slug) {
      const shops = await db.$queryRaw<{ name: string; slug: string }[]>`SELECT "name","slug" FROM "Shop" WHERE "status"='APPROVED' AND "isPlatform"=FALSE ORDER BY "name", "id" LIMIT 21 OFFSET ${Number(page) * 20}`
      return response.status(200).json({ shops: shops.slice(0,20), nextPage: shops.length > 20 ? Number(page) + 1 : null })
    }
    const [shop] = await db.$queryRaw<{ id: string; name: string; slug: string }[]>`SELECT "id","name","slug" FROM "Shop" WHERE "slug"=${slug} AND "status"='APPROVED' AND "isPlatform"=FALSE LIMIT 1`
    if (!shop) return sendError(response, 404, 'NOT_FOUND', 'Shop unavailable.', id)
    // Approved content is a showcase only. No customer/provider/financial ledger fields.
    const rows = await db.storeSetting.findMany({ where: { key: { startsWith: `seller-product.${shop.id}.` }, value: { contains: '"status":"APPROVED"' } }, orderBy: { key: 'asc' }, skip: Number(page) * 20, take: 21 })
    const products = rows.map(row => JSON.parse(row.value) as SellerDraft).filter(product => product.status === 'APPROVED' && product.shopId === shop.id)
    const mediaId = request.query?.mediaId
    if (mediaId !== undefined) {
      if (!validId(mediaId)) return sendError(response, 404, 'NOT_FOUND', 'Media unavailable.', id)
      const productId = request.query?.productId
      if (!validId(productId)) return sendError(response, 404, 'NOT_FOUND', 'Media unavailable.', id)
      const productRow = await db.storeSetting.findUnique({ where: { key: `seller-product.${shop.id}.${productId}` } })
      const product = productRow && JSON.parse(productRow.value) as SellerDraft | null
      if (!product || product.status !== 'APPROVED' || !product.mediaIds.includes(mediaId)) return sendError(response, 404, 'NOT_FOUND', 'Media unavailable.', id)
      const media = await db.storeSetting.findUnique({ where: { key: mediaKey(shop.id, mediaId) } })
      if (!media) return sendError(response, 404, 'NOT_FOUND', 'Media unavailable.', id)
      const value = JSON.parse(media.value) as { contentType: string; data: string }
      if (request.query?.raw === '1') {
        const safe = validateMediaUpload(value.data, value.contentType, 1000000)
        if (!safe || !response.end) return sendError(response, 503, 'MEDIA_UNAVAILABLE', 'Media unavailable.', id)
        response.setHeader?.('Content-Type', safe.contentType)
        response.setHeader?.('X-Content-Type-Options', 'nosniff')
        response.setHeader?.('Content-Length', String(safe.bytes.length))
        response.status(200)
        return response.end(safe.bytes)
      }
      return response.status(200).json({ contentType: value.contentType, data: value.data })
    }
    const published = await db.product.findMany({ where: { id: { in: products.slice(0,20).map(product => sellerProductId(shop.id, product.id)) }, isActive: true, shopOwnership: { is: { shopId: shop.id, moderationStatus: 'APPROVED' } } }, select: { id: true } })
    const publishedIds = new Set(published.map(product => product.id))
    return response.status(200).json({ shop: { name: shop.name, slug: shop.slug }, products: products.slice(0,20).map(product => ({ id: product.id, name: product.name, description: product.description, category: product.category, mediaIds: product.mediaIds, priceMinor: product.priceMinor, catalogId: publishedIds.has(sellerProductId(shop.id, product.id)) ? sellerProductId(shop.id, product.id) : null })), nextPage: rows.length > 20 ? Number(page) + 1 : null })
  } catch { return sendError(response, 503, 'SHOPS_UNAVAILABLE', 'Shops are temporarily unavailable.', id) }
}
