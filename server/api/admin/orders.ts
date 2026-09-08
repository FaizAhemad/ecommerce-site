import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') return response.status(200).json({ orders: await db.order.findMany({ include: { user: { select: { id: true, email: true, name: true } }, items: true, payment: true, shipment: true }, orderBy: { createdAt: 'desc' } }), requestId: id })
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request); const rawOrderId = body.orderId; const orderId = typeof rawOrderId === 'string' ? rawOrderId : ''; const status = body.status
    if (!orderId || typeof status !== 'string' || !statuses.includes(status as typeof statuses[number])) return sendError(response, 400, 'VALIDATION_ERROR', 'A valid order and status are required.', id)
    const order = await db.order.update({ where: { id: orderId }, data: { status: status as typeof statuses[number] } }); return response.status(200).json({ order, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Order management is temporarily unavailable.', id) }
}
