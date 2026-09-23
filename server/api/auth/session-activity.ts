import { db } from '../_lib/db.js'
import { currentSession, expireSessionCookie } from '../_lib/auth.js'
import { sessionLimits } from '../_lib/session-policy.js'
import { requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use POST.', id)
  const session = await currentSession(request)
  const now = Date.now()
  if (!session) {
    expireSessionCookie(response)
    return sendError(response, 401, 'UNAUTHORIZED', 'Your session expired. Sign in again.', id)
  }
  const limits = sessionLimits(session.user.role)
  const deadline = Math.min(now + limits.idleMs, session.createdAt.getTime() + limits.absoluteMs)
  const changed = deadline > now && await db.session.updateMany({ where: {
    id: session.id, expiresAt: { gt: new Date(now) },
  }, data: { expiresAt: new Date(deadline) } })
  if (!changed || changed.count !== 1) return sendError(response, 401, 'UNAUTHORIZED', 'Your session expired. Sign in again.', id)
  return response.status(200).json({ session: { expiresAt: deadline, serverNow: now }, requestId: id })
}
