import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { mutateAddress, ProfileError } from './_lib/profile.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (!['POST', 'PATCH', 'DELETE'].includes(request.method ?? ''))
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use POST, PATCH or DELETE.', id)
  try {
    const addresses = await mutateAddress(db, user.id, request.method!, bodyRecord(request))
    return response.status(200).json({ addresses })
  } catch (error) {
    if (error instanceof ProfileError)
      return sendError(response, error.status, error.code, error.message, id)
    const conflict =
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['P2034', 'P2003'].includes(String(error.code))
    return sendError(
      response,
      conflict ? 409 : 503,
      conflict ? 'CONFLICT' : 'ADDRESS_UNAVAILABLE',
      conflict
        ? 'Address changed or is in use. Refresh before trying again.'
        : 'Unable to confirm this change. Refresh your addresses before trying again.',
      id,
    )
  }
}
