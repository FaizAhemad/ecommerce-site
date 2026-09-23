import { db } from '../_lib/db.js'
import { publishSellerProduct } from '../_lib/publish-seller-product.js'
import { requireUser, requireAdmin } from '../_lib/auth.js'
import { approvedShop, ShopAccessError } from '../_lib/shop-access.js'
import { draftInput, draftKey, mediaKey, validId, CatalogError, type SellerDraft } from '../_lib/seller-catalog.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export function catalogHandler(admin: boolean) {
  return async (request: VercelRequest, response: VercelResponse) => {
    const user = await (admin ? requireAdmin : requireUser)(request, response), id = requestId(request)
    if (!user) return
    try {
      if (request.method === 'GET') {
        const page = request.query?.page ?? '0'
        if (typeof page !== 'string' || !/^\d{1,5}$/.test(page)) throw new CatalogError(400, 'Invalid page.')
        const shops = admin ? [] : await db.$queryRaw<{ id: string; name: string }[]>`
          SELECT s."id", s."name" FROM "Shop" s JOIN "ShopMembership" m ON m."shopId"=s."id"
          WHERE m."userId"=${user.id} AND m."status"='ACTIVE' AND s."status"='APPROVED' AND s."isPlatform"=FALSE ORDER BY s."id" LIMIT 50
        `
        const shopId = request.query?.shopId ?? shops[0]?.id
        if (!admin && !shops.some(shop => shop.id === shopId)) return response.status(200).json({ shops, products: [], nextPage: null })
        const prefix = admin ? 'seller-product.' : `seller-product.${shopId}.`
        const rows = await db.storeSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: [{ updatedAt: 'desc' }, { key: 'asc' }], skip: Number(page) * 20, take: 21 })
        return response.status(200).json({ shops, products: rows.slice(0,20).map(row => JSON.parse(row.value) as SellerDraft), nextPage: rows.length > 20 ? Number(page) + 1 : null })
      }
      if (request.method !== 'POST') throw new CatalogError(405, 'Use GET or POST.')
      const body = bodyRecord(request)
      if (!validId(body.id) || !validId(body.shopId)) throw new CatalogError(400, 'Select a shop product.')
      const shopId = body.shopId, productId = body.id, key = draftKey(shopId, productId)
      const product = await db.$transaction(async tx => {
        const shop = admin ? null : await approvedShop(tx, user.id, shopId)
        const row = await tx.storeSetting.findUnique({ where: { key } })
        const previous = row ? JSON.parse(row.value) as SellerDraft : null
        if (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion !== (previous?.version ?? 0)) throw new CatalogError(409, 'Product changed. Refresh before saving; your draft is preserved.')
        let next: SellerDraft
        if (admin) {
          const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
          if (!previous || previous.status !== 'PENDING' || !['APPROVED','REJECTED'].includes(String(body.status)) || reason.length < 3 || reason.length > 1000)
            throw new CatalogError(409, 'Review a pending product with a reason (3–1000 characters).')
          const available = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Shop" WHERE "id"=${shopId} AND "status"='APPROVED' AND "isPlatform"=FALSE`
          if (!available.length) throw new CatalogError(409, 'The shop is not approved.')
          next = { ...previous, status: body.status as SellerDraft['status'], reason }
        } else if (body.action === 'archive') {
          if (!previous || previous.status === 'ARCHIVED') throw new CatalogError(409, 'Refresh this product before archiving.')
          next = { ...previous, status: 'ARCHIVED' }
        } else {
          if (previous?.status === 'ARCHIVED') throw new CatalogError(409, 'Archived records cannot be edited.')
          const input = draftInput(body)
          if (!await tx.category.findUnique({ where: { name: input.category } })) throw new CatalogError(400, 'Choose an existing category.')
          for (const mediaId of input.mediaIds) {
            if (!await tx.storeSetting.findUnique({ where: { key: mediaKey(shopId, mediaId) } })) throw new CatalogError(400, 'Attachment is unavailable for this shop.')
          }
          if (body.action === 'submit' && !input.mediaIds.length) throw new CatalogError(400, 'Add product media before submitting for review.')
          if (!['save','submit'].includes(String(body.action))) throw new CatalogError(400, 'Choose save or submit.')
          next = { ...input, shopName: shop!.name, status: body.action === 'submit' ? 'PENDING' : 'DRAFT', reason: '', version: 0, updatedAt: '' }
        }
        next.version = (previous?.version ?? 0) + 1
        next.updatedAt = new Date().toISOString()
        next.publishedStock = previous?.publishedStock
        await publishSellerProduct(tx, next)
        if (next.status === 'APPROVED') next.publishedStock = next.stock
        if (row) {
          const changed = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(next) } })
          if (changed.count !== 1) throw new CatalogError(409, 'Product changed. Refresh before saving.')
        } else await tx.storeSetting.create({ data: { key, value: JSON.stringify(next) } })
        await tx.storeSetting.create({ data: { key: `audit.seller-product.${shopId}.${productId}.${next.version}`, value: JSON.stringify({ actorId: user.id, shopId, productId, status: next.status, reason: next.reason, version: next.version }) } })
        return next
      }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
      return response.status(200).json({ product, requestId: id })
    } catch (error) {
      const known = error instanceof CatalogError || error instanceof ShopAccessError
      return sendError(response, error instanceof CatalogError ? error.status : known ? 403 : 503, 'SELLER_CATALOG_UNAVAILABLE', known ? (error as Error).message : 'Unable to confirm product changes. Refresh before retrying.', id)
    }
  }
}
export default catalogHandler(false)
