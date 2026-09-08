import { createHash, randomInt } from 'node:crypto'
import { db } from '../_lib/db.js'
import { sendVerificationSms } from '../_lib/sms.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const rawPhone = bodyRecord(request).phone
  const phone = typeof rawPhone === 'string' ? rawPhone.replace(/[^\d+]/g, '') : ''
  if (!/^\+?[1-9]\d{9,14}$/.test(phone)) return sendError(response, 400, 'VALIDATION_ERROR', 'Enter a valid mobile number.', id)
  try {
    const user = await db.user.findUnique({ where: { phone } })
    if (!user) return sendError(response, 404, 'NOT_FOUND', 'No account exists for this mobile number.', id)
    const code = String(randomInt(100000, 1000000))
    await db.verificationToken.deleteMany({ where: { userId: user.id, purpose: 'MOBILE_VERIFICATION' } })
    await db.verificationToken.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(code).digest('hex'), purpose: 'MOBILE_VERIFICATION', expiresAt: new Date(Date.now() + 10 * 60 * 1000) } })
    await sendVerificationSms(phone, code)
    return response.status(202).json({ accepted: true, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Mobile verification is temporarily unavailable.', id) }
}
