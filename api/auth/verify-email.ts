import { createHash } from 'node:crypto'
import { db } from '../_lib/db.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const token = typeof request.body === 'object' && request.body && 'token' in request.body && typeof request.body.token === 'string' ? request.body.token : ''
  if (!token) return sendError(response, 400, 'VALIDATION_ERROR', 'Verification token is required.', id)
  try {
    const verification = await db.verificationToken.findFirst({ where: { tokenHash: createHash('sha256').update(token).digest('hex'), purpose: 'EMAIL_VERIFICATION', usedAt: null, expiresAt: { gt: new Date() } } })
    if (!verification) return sendError(response, 400, 'INVALID_TOKEN', 'This verification link is invalid or expired.', id)
    await db.$transaction([db.verificationToken.update({ where: { id: verification.id }, data: { usedAt: new Date() } }), db.user.update({ where: { id: verification.userId }, data: { emailVerifiedAt: new Date() } })])
    return response.status(200).json({ verified: true, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Verification is temporarily unavailable.', id) }
}
