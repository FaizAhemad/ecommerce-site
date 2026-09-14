import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { reviewReturn, ReturnActionError } from '../_lib/returns.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET')
      return response.status(200).json({
        returns: await db.returnRequest.findMany({
          select: {
            id: true,
            reason: true,
            status: true,
            resolution: true,
            createdAt: true,
            order: { select: { orderNumber: true } },
            user: { select: { email: true, name: true } },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 100,
        }),
        requestId: id,
      })
    if (request.method !== 'PATCH')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const item = await reviewReturn(db, bodyRecord(request))
    return response.status(200).json({ return: item, requestId: id })
  } catch (error) {
    if (error instanceof ReturnActionError)
      return sendError(response, error.status, 'RETURN_REJECTED', error.message, id)
    return sendError(
      response,
      503,
      'RETURN_UNAVAILABLE',
      'Unable to confirm the return decision. Refresh before trying again.',
      id,
    )
  }
}
