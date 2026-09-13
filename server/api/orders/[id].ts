import { cancelOrder, OrderActionError, isTransactionConflict } from '../_lib/order-transactions.js'
import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import {
  bodyRecord,
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

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
      if (action !== 'cancel')
        return sendError(response, 400, 'VALIDATION_ERROR', 'Only cancellation is supported.', id)
      const updated = await cancelOrder(db, orderId, user.id)
      return response.status(200).json({ order: updated, requestId: id })
    }
    if (request.method !== 'GET')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: {
        items: true,
        payment: true,
        shipment: { include: { events: { orderBy: { occurredAt: 'desc' } } } },
        shippingAddress: true,
      },
    })
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    // Protect historical orders that may have been linked before ownership validation.
    if (order.shippingAddress && order.shippingAddress.userId !== user.id)
      order.shippingAddress = null
    return response.status(200).json({ order, requestId: id })
  } catch (error) {
    if (error instanceof OrderActionError)
      return sendError(response, error.status, error.code, error.message, id)
    if (isTransactionConflict(error))
      return sendError(response, 409, 'CONFLICT', 'Order changed. Refresh before trying again.', id)
    return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Order is temporarily unavailable.', id)
  }
}
