import { db } from '../../_lib/db.js'
import { requireUser } from '../../_lib/auth.js'
import {
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'GET')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  const orderId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!orderId) return sendError(response, 400, 'VALIDATION_ERROR', 'An order id is required.', id)
  try {
    const order = await db.order.findFirst({
      where: { userId: user.id, OR: [{ id: orderId }, { orderNumber: orderId }] },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        shipment: { select: {
          carrier: true, trackingCode: true, status: true,
          events: { select: { id: true, status: true, description: true, location: true, occurredAt: true },
            orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }], take: 100 },
        } },
      },
    })
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    return response
      .status(200)
      .json({ orderId: order.id, orderNumber: order.orderNumber, status: order.status, createdAt: order.createdAt, shipment: order.shipment, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Tracking is temporarily unavailable.',
      id,
    )
  }
}
