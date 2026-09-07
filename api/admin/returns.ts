import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
const statuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'] as const
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') return response.status(200).json({ returns: await db.returnRequest.findMany({ include: { order: true, user: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: 'desc' } }), requestId: id })
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request); const returnId = typeof body.returnId === 'string' ? body.returnId : ''; const status = body.status
    if (!returnId || typeof status !== 'string' || !statuses.includes(status as typeof statuses[number])) return sendError(response, 400, 'VALIDATION_ERROR', 'A valid return and status are required.', id)
    const item = await db.returnRequest.update({ where: { id: returnId }, data: { status: status as typeof statuses[number], resolution: typeof body.resolution === 'string' ? body.resolution : undefined } }); return response.status(200).json({ return: item, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Return management is temporarily unavailable.', id) }
}
