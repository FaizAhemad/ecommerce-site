import { createHash, randomBytes } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { passwordResetLink } from './reset-link.js'

export function emailVerificationLink(
  base: string | undefined,
  token: string,
  production: boolean,
) {
  const link = new URL(passwordResetLink(base, token, production))
  link.pathname = '/verify-email'
  return link.href
}

/** Only the authenticated account ID chooses the recipient. Replace links atomically. */
export async function issueEmailVerification(
  store: Pick<PrismaClient, '$transaction'>,
  userId: string,
  base: string | undefined,
  production: boolean,
  send: (to: string, subject: string, html: string) => Promise<boolean>,
) {
  const token = randomBytes(32).toString('hex')
  const link = emailVerificationLink(base, token, production)
  const recipient = await store.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, emailVerifiedAt: true },
      })
      if (!user?.email) return { kind: 'missing' as const }
      if (user.emailVerifiedAt) return { kind: 'verified' as const }
      await tx.verificationToken.deleteMany({ where: { userId, purpose: 'EMAIL_VERIFICATION' } })
      await tx.verificationToken.create({
        data: {
          userId,
          purpose: 'EMAIL_VERIFICATION',
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
      return { kind: 'send' as const, email: user.email }
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
  if (recipient.kind !== 'send') return recipient.kind
  const sent = await send(
    recipient.email,
    'Verify your Gadgify email',
    `<p>Confirm your email address. This link expires in 24 hours.</p><p><a href="${link}">Verify email</a></p>`,
  )
  return sent ? 'sent' : 'failed'
}
