import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  try { const [products, customers, orders, revenue] = await Promise.all([db.product.count({ where: { isActive: true } }), db.user.count({ where: { role: 'CUSTOMER' } }), db.order.count(), db.order.aggregate({ _sum: { totalMinor: true }, where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } })]); return response.status(200).json({ products, customers, orders, revenueMinor: revenue._sum.totalMinor ?? 0, requestId: id }) } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Analytics are temporarily unavailable.', id) }
}
