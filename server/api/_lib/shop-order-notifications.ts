import type { Prisma } from '@prisma/client'
import { notificationKey, type NotificationJob, type ShopNotificationKind } from './notification-queue.ts'

export function shopNotificationKind(action: unknown, status: unknown): ShopNotificationKind | null {
  if (action === 'fulfill') {
    if (status === 'SHIPPED') return 'SHOP_DISPATCHED'
    if (status === 'DELIVERED') return 'SHOP_DELIVERED'
  }
  if (action === 'review-return') {
    if (status === 'APPROVED') return 'SHOP_RETURN_APPROVED'
    if (status === 'REJECTED') return 'SHOP_RETURN_REJECTED'
    if (status === 'RECEIVED') return 'SHOP_RETURN_RECEIVED'
  }
  return null
}
const copy: Record<ShopNotificationKind, [string, string]> = {
  SHOP_DISPATCHED: ['Shop order dispatched', 'The shop has recorded dispatch of its items. Sign in for the carrier and tracking reference.'],
  SHOP_DELIVERED: ['Shop order marked delivered', 'The shop has marked its items delivered. If they have not arrived, open a support conversation.'],
  SHOP_RETURN_APPROVED: ['Shop return approved', 'The shop has approved your return request. Sign in to read its decision and arrange the next steps.'],
  SHOP_RETURN_REJECTED: ['Shop return rejected', 'The shop has rejected your return request. Sign in to read the explanation or escalate to Gadgify support.'],
  SHOP_RETURN_RECEIVED: ['Returned items marked received', 'The shop has recorded receipt of your returned items.'],
}
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export async function enqueueShopOrderNotification(
  tx: Pick<Prisma.TransactionClient, 'order' | 'storeSetting'>,
  input: { orderId: string; sellerOrderId: string; shopName: string; eventVersion: number; action: unknown; status: unknown },
) {
  const kind = shopNotificationKind(input.action, input.status)
  if (!kind) return []
  if (!Number.isSafeInteger(input.eventVersion) || input.eventVersion < 1) throw new Error('Invalid notification version')
  const eventId = `${input.sellerOrderId}-${input.eventVersion}`
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(eventId)) throw new Error('Invalid notification reference')
  const key = notificationKey({ orderId: input.orderId, kind, eventId })
  if (await tx.storeSetting.findUnique({ where: { key } })) return [key]
  const order = await tx.order.findUnique({ where: { id: input.orderId }, select: {
    userId: true, orderNumber: true, user: { select: { email: true, emailVerifiedAt: true } },
  } })
  if (!order) throw new Error('Notification owner unavailable')
  const now = Date.now(), [subject, description] = copy[kind]
  const job: NotificationJob = {
    version: 2, orderId: input.orderId, userId: order.userId, kind, eventId,
    status: order.user.email && order.user.emailVerifiedAt ? 'PENDING' : 'SKIPPED',
    payload: { from: '', to: [order.user.email ?? ''], subject: `Gadgify: ${subject}`,
      html: `<p>Order ${escape(order.orderNumber)} — ${escape(input.shopName)}</p><p>${description}</p><p>Sign in to Gadgify and open Orders → Shop shipments and returns. This update applies only to this shop's items.</p><p>This email does not confirm payment, a refund or bank settlement.</p>` },
    attempts: 0, firstAttemptAt: null, availableAt: now, leaseUntil: 0, credentialHash: null, updatedAt: new Date(now).toISOString(),
  }
  await tx.storeSetting.create({ data: { key, value: JSON.stringify(job) } })
  return [key]
}
