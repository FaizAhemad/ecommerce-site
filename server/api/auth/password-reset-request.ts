import { createHash, randomBytes } from 'node:crypto'
import { db } from '../_lib/db.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { bodyRecord, requestId, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST') return response.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', requestId: id } })
  const rawEmail = bodyRecord(request).email
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  if (!email) return response.status(200).json({ accepted: true, requestId: id })
  try {
    const user = await db.user.findUnique({ where: { email } })
    if (user) {
      const token = randomBytes(32).toString('hex')
      await db.verificationToken.deleteMany({ where: { userId: user.id, purpose: 'PASSWORD_RESET' } })
      await db.verificationToken.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(token).digest('hex'), purpose: 'PASSWORD_RESET', expiresAt: new Date(Date.now() + 60 * 60 * 1000) } })
      const url = `${process.env.APP_URL ?? ''}/reset-password?token=${encodeURIComponent(token)}`
      await sendTransactionalEmail(email, 'Reset your Gadgify password', `<p>Reset your password using this link:</p><p><a href="${url}">${url}</a></p>`)
    }
    return response.status(200).json({ accepted: true, requestId: id })
  } catch { return response.status(200).json({ accepted: true, requestId: id }) }
}
