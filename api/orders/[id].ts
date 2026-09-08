import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  const orderId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!orderId) return sendError(response, 400, 'VALIDATION_ERROR', 'An order id is required.', id)
  try {
    if (request.method === 'PATCH') {
      const action = bodyRecord(request).action
      if (action !== 'cancel') return sendError(response, 400, 'VALIDATION_ERROR', 'Only cancellation is supported.', id)
      const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } })
      if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
      if (!['PENDING', 'CONFIRMED'].includes(order.status)) return sendError(response, 409, 'CONFLICT', 'This order can no longer be cancelled.', id)
      const updated = await db.$transaction(async (tx) => {
        const result = await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })
        await Promise.all(order.items.map((item) => tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })))
        return result
      })
      return response.status(200).json({ order: updated, requestId: id })
    }
    if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true, payment: true, shipment: { include: { events: { orderBy: { occurredAt: 'desc' } } } }, shippingAddress: true } })
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    return response.status(200).json({ order, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Order is temporarily unavailable.', id) }
}
