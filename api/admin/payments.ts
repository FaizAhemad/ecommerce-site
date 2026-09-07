import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') return response.status(200).json({ payments: await db.payment.findMany({ include: { order: { select: { id: true, orderNumber: true, userId: true, totalMinor: true } } }, orderBy: { createdAt: 'desc' } }), requestId: id })
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request); const orderId = typeof body.orderId === 'string' ? body.orderId : ''; if (!orderId || body.action !== 'refund') return sendError(response, 400, 'VALIDATION_ERROR', 'A payment order and refund action are required.', id)
    const payment = await db.payment.update({ where: { orderId }, data: { status: 'REFUNDED' } }); await db.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } }); return response.status(200).json({ payment, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Payment management is temporarily unavailable.', id) }
}
