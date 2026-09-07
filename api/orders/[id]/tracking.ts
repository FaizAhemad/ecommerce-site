import { db } from '../../_lib/db.js'
import { requireUser } from '../../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  const orderId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!orderId) return sendError(response, 400, 'VALIDATION_ERROR', 'An order id is required.', id)
  try {
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, select: { id: true, status: true, shipment: { include: { events: { orderBy: { occurredAt: 'desc' } } } } } })
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    return response.status(200).json({ orderId: order.id, status: order.status, shipment: order.shipment, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Tracking is temporarily unavailable.', id) }
}
