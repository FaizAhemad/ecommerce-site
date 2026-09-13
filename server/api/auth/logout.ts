import { clearSession } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST')
    return sendError(
      response,
      405,
      'METHOD_NOT_ALLOWED',
      'Only POST is supported.',
      requestId(request),
    )
  await clearSession(request, response)
  return response.status(200).json({ loggedOut: true, requestId: requestId(request) })
}
