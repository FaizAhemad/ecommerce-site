import { createHash, randomBytes } from 'node:crypto'
import { db } from '../_lib/db.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { passwordResetLink } from '../_lib/reset-link.js'
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
  const rawEmail = bodyRecord(request).email
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return response.status(200).json({ accepted: true, requestId: id })
  try {
    const token = randomBytes(32).toString('hex')
    const url = passwordResetLink(process.env.APP_URL, token, process.env.NODE_ENV === 'production')
    const user = await db.user.findUnique({ where: { email } })
    if (user) {
      await db.$transaction(
        async (tx) => {
          await tx.verificationToken.deleteMany({
            where: { userId: user.id, purpose: 'PASSWORD_RESET' },
          })
          await tx.verificationToken.create({
            data: {
              userId: user.id,
              tokenHash: createHash('sha256').update(token).digest('hex'),
              purpose: 'PASSWORD_RESET',
              expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
          })
        },
        { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
      )
      await sendTransactionalEmail(
        email,
        'Reset your Gadgify password',
        `<p>Reset your password using this link:</p><p><a href="${url}">${url}</a></p>`,
      )
    }
    return response.status(200).json({ accepted: true, requestId: id })
  } catch {
    return response.status(200).json({ accepted: true, requestId: id })
  }
}
