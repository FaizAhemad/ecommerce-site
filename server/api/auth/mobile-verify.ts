import { createHash } from 'node:crypto'
import { db } from '../_lib/db.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const phone = typeof body.phone === 'string' ? body.phone.replace(/[^\d+]/g, '') : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!phone || !/^\d{6}$/.test(code)) return sendError(response, 400, 'VALIDATION_ERROR', 'Mobile number and six-digit code are required.', id)
  try {
    const user = await db.user.findUnique({ where: { phone } })
    const token = user && await db.verificationToken.findFirst({ where: { userId: user.id, purpose: 'MOBILE_VERIFICATION', tokenHash: createHash('sha256').update(code).digest('hex'), usedAt: null, expiresAt: { gt: new Date() } } })
    if (!user || !token) return sendError(response, 400, 'INVALID_TOKEN', 'The mobile code is invalid or expired.', id)
    await db.$transaction([db.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }), db.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } })])
    return response.status(200).json({ verified: true, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Mobile verification is temporarily unavailable.', id) }
}
