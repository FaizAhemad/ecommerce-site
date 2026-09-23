import { currentSession, expireSessionCookie } from '../_lib/auth.js'
import { sessionDeadline } from '../_lib/session-policy.js'
import {
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  if (request.method !== 'GET')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  const session = await currentSession(request)
  if (!session) {
    expireSessionCookie(response)
    return sendError(response, 401, 'UNAUTHORIZED', 'Sign in is required.', id)
  }
  const user = session.user
  return response.status(200).json({
    session: { expiresAt: sessionDeadline(session), serverNow: Date.now() },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
    },
    requestId: id,
  })
}
