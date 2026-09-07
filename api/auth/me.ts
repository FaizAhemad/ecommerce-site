import { currentUser } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  const user = await currentUser(request)
  if (!user) return sendError(response, 401, 'UNAUTHORIZED', 'Sign in is required.', id)
  return response.status(200).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, requestId: id })
}
