import { db } from '../_lib/db.js'
import { deleteUnusedSellerMedia, sellerMediaLibrary } from '../_lib/seller-media-library.js'
import { requireUser } from '../_lib/auth.js'
import { approvedShop, ShopAccessError } from '../_lib/shop-access.js'
import { validateMediaUpload } from '../_lib/media.js'
import { mediaKey, validId, CatalogError } from '../_lib/seller-catalog.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
  const user = await requireUser(request, response), id = requestId(request)
  if (!user) return
  try {
    const body = request.method === 'GET' ? request.query ?? {} : bodyRecord(request)
    const inventory = request.method === 'GET' && body.id === undefined
    if (!validId(body.shopId) || (!inventory && !validId(body.id))) throw new CatalogError(400, 'Select a shop attachment.')
    const shopId = body.shopId
    if (!['GET','POST','DELETE'].includes(request.method ?? '')) throw new CatalogError(405, 'Use GET, POST or DELETE.')
    const result = await db.$transaction(async tx => {
      if (!(user.role === 'ADMIN' && request.method === 'GET')) await approvedShop(tx, user.id, shopId)
      if (inventory) return sellerMediaLibrary(tx, shopId)
      const mediaId = body.id as string, key = mediaKey(shopId, mediaId)
      if (request.method === 'DELETE') return deleteUnusedSellerMedia(tx, shopId, mediaId, body.expectedUpdatedAt)
      const existing = await tx.storeSetting.findUnique({ where: { key } })
      if (request.method === 'GET') {
        if (!existing) throw new CatalogError(404, 'Attachment unavailable.')
        const media = JSON.parse(existing.value) as { data: string; contentType: string }
        return { data: media.data, contentType: media.contentType }
      }
      if (typeof body.data !== 'string' || body.data.length > 1400000 || typeof body.contentType !== 'string') throw new CatalogError(400, 'Choose supported media up to 1 MB.')
      const media = validateMediaUpload(body.data, body.contentType, 1000000)
      if (!media) throw new CatalogError(400, 'Unsupported or invalid media. Maximum size is 1 MB.')
      const value = JSON.stringify({ data: body.data, contentType: media.contentType })
      if (existing) {
        if (existing.value !== value) throw new CatalogError(409, 'Attachment identifier already used.')
        return { id: body.id }
      }
      const count = await tx.storeSetting.count({ where: { key: { startsWith: `seller-media.${shopId}.` } } })
      if (count >= 100) throw new CatalogError(409, 'Shop media capacity reached. Contact support.')
      await tx.storeSetting.create({ data: { key, value } })
      return { id: body.id }
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
    return response.status(200).json(result)
  } catch (error) {
    const known = error instanceof CatalogError || error instanceof ShopAccessError
    return sendError(response, known ? error.status : 503, 'SELLER_MEDIA_UNAVAILABLE', known ? error.message : 'Media is temporarily unavailable.', id)
  }
}
