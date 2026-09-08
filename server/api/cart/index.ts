import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

const include = { items: { include: { product: { include: { images: true, colors: true } } }, orderBy: { productId: 'asc' as const } } }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const cart = await db.cart.findUnique({ where: { userId: user.id }, include })
      return response.status(200).json({ cart: cart ?? { items: [] }, requestId: id })
    }
    if (request.method !== 'POST' && request.method !== 'PATCH' && request.method !== 'DELETE') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET, POST, PATCH, or DELETE.', id)
    const body = bodyRecord(request)
    const productId = typeof body.productId === 'string' ? body.productId : ''
    const quantity = Number(body.quantity)
    if (!productId || (request.method !== 'DELETE' && (!Number.isInteger(quantity) || quantity < 1 || quantity > 99))) return sendError(response, 400, 'VALIDATION_ERROR', 'A valid product and quantity are required.', id)
    const product = await db.product.findFirst({ where: { id: productId, isActive: true } })
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.', id)
    const cart = await db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} })
    if (request.method === 'DELETE') await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } })
    else await db.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, create: { cartId: cart.id, productId, quantity }, update: { quantity: request.method === 'POST' ? { increment: quantity } : quantity } })
    const updated = await db.cart.findUnique({ where: { id: cart.id }, include })
    return response.status(200).json({ cart: updated ?? { items: [] }, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Cart is temporarily unavailable.', id) }
}
