import { createHash } from 'node:crypto'
import { db } from '../_lib/db.js'
import { hashPassword } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!token || password.length < 8) return sendError(response, 400, 'VALIDATION_ERROR', 'A valid token and password of at least 8 characters are required.', id)
  try {
    const record = await db.verificationToken.findFirst({ where: { tokenHash: createHash('sha256').update(token).digest('hex'), purpose: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: new Date() } } })
    if (!record) return sendError(response, 400, 'INVALID_TOKEN', 'This reset link is invalid or expired.', id)
    await db.$transaction([db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }), db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }), db.session.deleteMany({ where: { userId: record.userId } })])
    return response.status(200).json({ reset: true, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Password reset is temporarily unavailable.', id) }
}
