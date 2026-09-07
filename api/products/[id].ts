import { db } from '../_lib/db.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  const productId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'A product id is required.', id)

  try {
    const product = await db.product.findFirst({
      where: { id: productId, isActive: true },
      include: { images: { orderBy: { sortOrder: 'asc' } }, videos: { orderBy: { sortOrder: 'asc' } }, colors: true, reviews: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } } },
    })
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.', id)
    return response.status(200).json({ product, requestId: id })
  } catch {
    return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Product is temporarily unavailable.', id)
  }
}
