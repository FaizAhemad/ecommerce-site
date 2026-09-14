import type { PrismaClient } from '@prisma/client'
import { ProfileError } from './profile.js'
export type Ticket = {
  id: string
  subject: string
  body: string
  status: string
  resolution: string | null
  emailStatus: string
  createdAt: Date
  updatedAt: Date
}
export function supportInput(body: Record<string, unknown>) {
  const id = typeof body.id === 'string' ? body.id : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.body === 'string' ? body.body.trim() : ''
  if (
    !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) ||
    !subject ||
    subject.length > 120 ||
    !message ||
    message.length > 4000
  )
    throw new ProfileError(
      400,
      'VALIDATION_ERROR',
      'Enter a subject (up to 120 characters) and message (up to 4000 characters).',
    )
  return { id, subject, message }
}
export function escapeEmail(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
}
// Parameterized queries keep this migration rollout independent of local generated client types.
export async function createSupportTicket(
  store: Pick<PrismaClient, '$queryRaw' | '$executeRaw'>,
  userId: string,
  body: Record<string, unknown>,
  notify: (ticket: Ticket) => Promise<boolean>,
) {
  const { id, subject, message } = supportInput(body)
  const created =
    await store.$executeRaw`INSERT INTO "SupportTicket" ("id","userId","subject","body") VALUES (${id},${userId},${subject},${message}) ON CONFLICT ("id") DO NOTHING`
  const tickets = await store.$queryRaw<
    Ticket[]
  >`SELECT "id","subject","body","status","resolution","emailStatus","createdAt","updatedAt" FROM "SupportTicket" WHERE "id"=${id} AND "userId"=${userId}`
  const ticket = tickets[0]
  if (!ticket) throw new ProfileError(409, 'CONFLICT', 'Please start a new support request.')
  if (ticket.subject !== subject || ticket.body !== message)
    throw new ProfileError(
      409,
      'CONFLICT',
      'This request was already recorded with different text. Check your requests before starting a new one.',
    )
  if (created) {
    let accepted = false
    try {
      accepted = await notify(ticket)
    } catch {
      /* Saved ticket is authoritative, email can fail separately. */
    }
    ticket.emailStatus = accepted ? 'ACCEPTED' : 'UNCONFIRMED'
    await store.$executeRaw`UPDATE "SupportTicket" SET "emailStatus"=${ticket.emailStatus} WHERE "id"=${id} AND "userId"=${userId}`
  }
  return ticket
}
