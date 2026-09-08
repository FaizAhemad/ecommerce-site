import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  try { return response.status(200).json({ customers: await db.user.findMany({ select: { id: true, email: true, phone: true, name: true, role: true, emailVerifiedAt: true, phoneVerifiedAt: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' } }), requestId: id }) } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Customer management is temporarily unavailable.', id) }
}
