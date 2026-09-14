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
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        currency: true,
        subtotalMinor: true,
        shippingMinor: true,
        taxMinor: true,
        totalMinor: true,
        items: { select: { id: true, productName: true, quantity: true, unitPriceMinor: true } },
        payment: { select: { status: true, provider: true } },
        shipment: { select: { status: true, carrier: true, trackingCode: true } },
        shippingAddress: {
          select: {
            userId: true,
            name: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
          },
        },
      },
    })
    if (!order) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    // Protect historical orders that may have been linked before ownership validation.
    if (order.shippingAddress && order.shippingAddress.userId !== user.id)
      order.shippingAddress = null
    const shippingAddress = order.shippingAddress
      ? (({ userId: _owner, ...address }) => address)(order.shippingAddress)
      : null
    return response.status(200).json({ order: { ...order, shippingAddress }, requestId: id })
  } catch (error) {
    if (error instanceof OrderActionError)
      return sendError(response, error.status, error.code, error.message, id)
    if (isTransactionConflict(error))
      return sendError(response, 409, 'CONFLICT', 'Order changed. Refresh before trying again.', id)
    return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Order is temporarily unavailable.', id)
  }
}
