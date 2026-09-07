import { db } from '../../_lib/db.js'
import { requireUser } from '../../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const productId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'A product id is required.', id)
  if (request.method === 'GET') {
    const reviews = await db.review.findMany({ where: { productId, status: 'APPROVED' }, select: { id: true, rating: true, body: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } })
    return response.status(200).json({ reviews, requestId: id })
  }
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
  const user = await requireUser(request, response)
  if (!user) return
  const body = bodyRecord(request)
  const rating = Number(body.rating)
  const text = typeof body.body === 'string' ? body.body.trim() : null
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return sendError(response, 400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5.', id)
  try {
    const review = await db.review.create({ data: { productId, userId: user.id, rating, body: text } })
    return response.status(201).json({ review, requestId: id })
  } catch { return sendError(response, 409, 'CONFLICT', 'You have already reviewed this product.', id) }
}
