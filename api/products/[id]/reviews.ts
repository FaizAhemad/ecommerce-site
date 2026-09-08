import { db } from '../../_lib/db.js'
import { requireUser } from '../../_lib/auth.js'
import { bodyRecord, isSafeHttpUrl, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const productId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'A product id is required.', id)
  if (request.method === 'GET') {
    setCacheControl(response, 'public')
    const reviews = await db.review.findMany({ where: { productId, status: 'APPROVED' }, select: { id: true, rating: true, body: true, createdAt: true, media: { select: { id: true, url: true } }, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } })
    return response.status(200).json({ reviews, requestId: id })
  }
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
  const user = await requireUser(request, response)
  if (!user) return
  const body = bodyRecord(request)
  const rating = Number(body.rating)
  const text = typeof body.body === 'string' ? body.body.trim() : null
  const media = Array.isArray(body.media) ? body.media.filter((url): url is string => typeof url === 'string' && isSafeHttpUrl(url)).slice(0, 4) : []
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return sendError(response, 400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5.', id)
  try {
    const review = await db.$transaction(async (transaction) => {
      const review = await transaction.review.create({ data: { productId, userId: user.id, rating, body: text, status: 'APPROVED', media: { create: media.map((url) => ({ url })) } }, include: { media: true } })
      const aggregate = await transaction.review.aggregate({ where: { productId, status: 'APPROVED' }, _avg: { rating: true }, _count: { rating: true } })
      await transaction.product.update({ where: { id: productId }, data: { rating: aggregate._avg.rating ?? rating, reviewCount: aggregate._count.rating } })
      return review
    })
    return response.status(201).json({ review, requestId: id })
  } catch { return sendError(response, 409, 'CONFLICT', 'You have already reviewed this product.', id) }
}
