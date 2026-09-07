import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

const include = { items: { include: { product: { include: { images: true, colors: true } } }, orderBy: { createdAt: 'desc' as const } } }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  try {
    const wishlist = await db.wishlist.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {}, include })
    if (request.method === 'GET') return response.status(200).json({ wishlist, requestId: id })
    if (request.method !== 'POST' && request.method !== 'DELETE') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET, POST, or DELETE.', id)
    const body = bodyRecord(request)
    const productId = typeof body.productId === 'string' ? body.productId : ''
    if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'A product id is required.', id)
    const product = await db.product.findFirst({ where: { id: productId, isActive: true } })
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.', id)
    if (request.method === 'POST') await db.wishlistItem.upsert({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId } }, create: { wishlistId: wishlist.id, productId }, update: {} })
    else await db.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } })
    const updated = await db.wishlist.findUnique({ where: { id: wishlist.id }, include })
    return response.status(200).json({ wishlist: updated ?? { items: [] }, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Wishlist is temporarily unavailable.', id) }
}
