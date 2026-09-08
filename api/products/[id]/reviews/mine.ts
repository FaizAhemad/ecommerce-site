import { db } from '../../../_lib/db.js'
import { requireUser } from '../../../_lib/auth.js'
import { bodyRecord, isSafeHttpUrl, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  setCacheControl(response, 'private')
  const user = await requireUser(request, response)
  if (!user) return
  const productId = Array.isArray(request.query?.id) ? request.query.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'A product id is required.', id)
  if (request.method === 'GET') {
    const review = await db.review.findUnique({ where: { productId_userId: { productId, userId: user.id } }, include: { media: true } })
    return response.status(200).json({ review, requestId: id })
  }
  if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
  const body = bodyRecord(request)
  const rating = Number(body.rating)
  const text = typeof body.body === 'string' ? body.body.trim() : null
  const media = Array.isArray(body.media) ? body.media.filter((url): url is string => typeof url === 'string' && isSafeHttpUrl(url)).slice(0, 4) : []
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return sendError(response, 400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5.', id)
  try {
    const review = await db.$transaction(async (transaction) => {
      const existing = await transaction.review.findUnique({ where: { productId_userId: { productId, userId: user.id } } })
      if (!existing) return null
      await transaction.reviewMedia.deleteMany({ where: { reviewId: existing.id } })
      const updated = await transaction.review.update({ where: { id: existing.id }, data: { rating, body: text, media: { create: media.map((url) => ({ url })) } }, include: { media: true } })
      const aggregate = await transaction.review.aggregate({ where: { productId, status: 'APPROVED' }, _avg: { rating: true }, _count: { rating: true } })
      await transaction.product.update({ where: { id: productId }, data: { rating: aggregate._avg.rating ?? rating, reviewCount: aggregate._count.rating } })
      return updated
    })
    if (!review) return sendError(response, 404, 'NOT_FOUND', 'You have not reviewed this product yet.', id)
    return response.status(200).json({ review, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Your review could not be updated.', id) }
}
