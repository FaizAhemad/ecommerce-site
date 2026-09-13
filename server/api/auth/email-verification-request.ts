import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { issueEmailVerification } from '../_lib/email-verification.js'
import {
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  setCacheControl(response, 'private')
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const user = await requireUser(request, response)
  if (!user) return
  if (user.emailVerifiedAt) return response.status(200).json({ verified: true, requestId: id })
  if (!user.email)
    return sendError(response, 400, 'EMAIL_REQUIRED', 'This account has no email address.', id)
  try {
    const result = await issueEmailVerification(
      db,
      user.id,
      process.env.APP_URL,
      process.env.NODE_ENV === 'production',
      sendTransactionalEmail,
    )
    if (result === 'verified') return response.status(200).json({ verified: true, requestId: id })
    if (result === 'sent') return response.status(202).json({ accepted: true, requestId: id })
  } catch {
    // Never log token, recipient or provider payload; the caller may explicitly try later.
  }
  return sendError(
    response,
    503,
    'VERIFICATION_UNAVAILABLE',
    'We could not confirm the verification email was sent. Please try again later.',
    id,
  )
}
