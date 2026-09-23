import { db } from '../_lib/db.js'
import { notifyOrder } from '../_lib/order-notifications.js'
import { enqueueOrderNotification } from '../_lib/notification-queue.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { requireAdmin } from '../_lib/auth.js'
import { saveShipment, shipmentFields, ShipmentError } from '../_lib/shipments.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request), admin = await requireAdmin(request, response)
  if (!admin) return
  try {
    if (request.method === 'GET') {
      const lookup = request.query?.order
      if (typeof lookup !== 'string' || !lookup.trim() || lookup.length > 128) throw new ShipmentError(400, 'Enter an order number or ID.')
      const order = await db.order.findFirst({ where: { OR: [{ id: lookup.trim() }, { orderNumber: lookup.trim() }] }, select: {
        id: true, orderNumber: true, status: true, shipment: { select: shipmentFields },
      } })
      if (!order) throw new ShipmentError(404, 'Order not found.')
      return response.status(200).json({ order })
    }
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request)
    const shipment = await saveShipment(db, admin.id, body, enqueueOrderNotification)
    const emailStatus = shipment.status === 'IN_TRANSIT' || shipment.status === 'DELIVERED'
      ? await notifyOrder(db, String(body.orderId), shipment.status === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED', sendTransactionalEmail)
      : 'SKIPPED'
    return response.status(200).json({ shipment, emailStatus })
  } catch (error) {
    if (error instanceof ShipmentError) return sendError(response, error.status, 'SHIPMENT_REJECTED', error.message, id)
    if (error && typeof error === 'object' && 'code' in error && ['P2034', 'P2002'].includes(String(error.code)))
      return sendError(response, 409, 'CONFLICT', 'Shipment changed. Reload before saving.', id)
    return sendError(response, 503, 'SHIPMENT_UNAVAILABLE', 'Unable to confirm shipment. Reload its status before retrying.', id)
  }
}
