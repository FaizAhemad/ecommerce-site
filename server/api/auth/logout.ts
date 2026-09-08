import { clearSession } from '../_lib/auth.js'
import { requestId, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', requestId: requestId(request) } })
  await clearSession(request, response)
  return response.status(200).json({ loggedOut: true, requestId: requestId(request) })
}
