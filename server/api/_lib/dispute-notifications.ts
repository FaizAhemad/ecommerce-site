import type { Prisma } from '@prisma/client'
import { notificationKey, type NotificationJob } from './notification-queue.ts'
import type { ShopDispute } from './shop-disputes.ts'

export async function enqueueDisputeNotifications(
  tx: Pick<Prisma.TransactionClient, 'order' | 'storeSetting'>,
  orderId: string, sellerOrderId: string, dispute: ShopDispute,
) {
  const message = dispute.messages.at(-1)
  if (!message) return []
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { userId: true, user: { select: { email: true, emailVerifiedAt: true } } } })
  if (!order) throw new Error('Notification owner unavailable')
  const kinds: NotificationJob['kind'][] = []
  if (message.audience !== 'admin') kinds.push('DISPUTE_SUPPORT')
  if (message.audience !== 'customer') kinds.push('DISPUTE_CUSTOMER')
  const keys: string[] = []
  for (const kind of kinds) {
    const now = Date.now(), staff = kind === 'DISPUTE_SUPPORT'
    const label = message.action === 'support-open' ? 'A support conversation was opened' : message.action === 'support-escalate' ? 'A support conversation was escalated' : message.action === 'support-resolve' ? 'A support conversation was resolved' : 'A support conversation has a new reply'
    const job: NotificationJob = {
      version: 2, orderId, userId: order.userId, kind, eventId: `${sellerOrderId}-${dispute.version}`,
      status: staff || (order.user.email && order.user.emailVerifiedAt) ? 'PENDING' : 'SKIPPED',
      // Keep message bodies, addresses and private support recipients out of customer mail.
      payload: { from: '', to: [staff ? '' : order.user.email ?? ''], subject: `Gadgify: ${label.toLowerCase()}`,
        html: `<p>${label}.</p><p>Sign in to Gadgify and open ${staff ? 'Admin → Fulfillment oversight' : 'Orders → Shop shipments and returns'} to read the conversation.</p><p>This update does not confirm a payment or refund. Please respond in the website conversation.</p>` },
      attempts: 0, firstAttemptAt: null, availableAt: now, leaseUntil: 0, credentialHash: null, updatedAt: new Date(now).toISOString(),
    }
    const key = notificationKey(job)
    if (!await tx.storeSetting.findUnique({ where: { key } })) await tx.storeSetting.create({ data: { key, value: JSON.stringify(job) } })
    keys.push(key)
  }
  return keys
}
