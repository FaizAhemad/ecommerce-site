import { createHash } from 'node:crypto'
import { db } from '../_lib/db.js'
import { expireSessionCookie, hashPassword } from '../_lib/auth.js'
import { consumeVerification } from '../_lib/verification.js'
import {
  bodyRecord,
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
  const body = bodyRecord(request)
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || password.length > 128)
    return sendError(
      response,
      400,
      'VALIDATION_ERROR',
      'A valid token and password between 8 and 128 characters are required.',
      id,
    )
  try {
    const passwordHash = await hashPassword(password)
    const reset = await consumeVerification(
      db,
      {
        tokenHash: createHash('sha256').update(token).digest('hex'),
        purpose: 'PASSWORD_RESET',
      },
      async (tx, userId) => {
        await tx.user.update({ where: { id: userId }, data: { passwordHash } })
        await tx.verificationToken.updateMany({
          where: { userId, purpose: 'PASSWORD_RESET', usedAt: null },
          data: { usedAt: new Date() },
        })
        await tx.session.deleteMany({ where: { userId } })
      },
    )
    if (!reset)
      return sendError(response, 400, 'INVALID_TOKEN', 'This reset link is invalid or expired.', id)
    expireSessionCookie(response)
    return response.status(200).json({ reset: true, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Password reset is temporarily unavailable.',
      id,
    )
  }
}
