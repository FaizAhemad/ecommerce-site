import { createHash } from 'node:crypto'
import { db } from '../_lib/db.js'
import { consumeVerification } from '../_lib/verification.js'
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
  const token =
    typeof request.body === 'object' &&
    request.body &&
    'token' in request.body &&
    typeof request.body.token === 'string'
      ? request.body.token
      : ''
  if (!token)
    return sendError(response, 400, 'VALIDATION_ERROR', 'Verification token is required.', id)
  try {
    const verified = await consumeVerification(
      db,
      {
        tokenHash: createHash('sha256').update(token).digest('hex'),
        purpose: 'EMAIL_VERIFICATION',
      },
      async (tx, userId) => {
        await tx.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })
      },
    )
    if (!verified)
      return sendError(
        response,
        400,
        'INVALID_TOKEN',
        'This verification link is invalid or expired.',
        id,
      )
    return response.status(200).json({ verified: true, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Verification is temporarily unavailable.',
      id,
    )
  }
}
