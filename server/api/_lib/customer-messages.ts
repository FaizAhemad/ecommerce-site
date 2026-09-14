import type { PrismaClient } from '@prisma/client'
type Store = Pick<PrismaClient, 'customerMessage' | 'user'>
export class MessageError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
export async function createCustomerMessage(
  store: Store,
  senderId: string,
  input: Record<string, unknown>,
  send: (email: string, subject: string, message: string) => Promise<boolean>,
) {
  const id = typeof input.id === 'string' ? input.id : '',
    recipientEmail =
      typeof input.recipientEmail === 'string' ? input.recipientEmail.trim().toLowerCase() : '',
    subject = typeof input.subject === 'string' ? input.subject.trim() : '',
    body = typeof input.body === 'string' ? input.body.trim() : ''
  if (
    !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) ||
    recipientEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) ||
    !subject ||
    subject.length > 120 ||
    /[\r\n]/.test(subject) ||
    !body ||
    body.length > 4000
  )
    throw new MessageError(
      400,
      'Enter a valid customer email, subject (up to 120 characters) and message (up to 4000 characters).',
    )
  const existing = await store.customerMessage.findUnique({ where: { id } })
  const check = (message: NonNullable<typeof existing>) => {
    if (
      message.senderId !== senderId ||
      message.recipientEmail !== recipientEmail ||
      message.subject !== subject ||
      message.body !== body
    )
      throw new MessageError(
        409,
        'This request was already used. Review message history before sending again.',
      )
    return message
  }
  if (existing) return check(existing)
  const recipient = await store.user.findUnique({
    where: { email: recipientEmail },
    select: { id: true, emailVerifiedAt: true },
  })
  if (!recipient?.emailVerifiedAt)
    throw new MessageError(400, 'Choose an existing customer with a verified email address.')
  const inserted = await store.customerMessage.createMany({
    data: {
      id,
      senderId,
      recipientId: recipient.id,
      recipientEmail,
      subject,
      body,
      status: 'UNCONFIRMED',
    },
    skipDuplicates: true,
  })
  const recorded = await store.customerMessage.findUnique({ where: { id } })
  if (!recorded)
    throw new MessageError(
      503,
      'Unable to confirm the message. Check message history before retrying.',
    )
  check(recorded)
  if (!inserted.count) return recorded
  let accepted = false
  try {
    accepted = await send(recipientEmail, subject, body)
  } catch {
    accepted = false
  }
  if (!accepted) return recorded
  return store.customerMessage.update({
    where: { id },
    data: { status: 'ACCEPTED', sentAt: new Date() },
  })
}
