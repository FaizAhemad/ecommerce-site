import type { PrismaClient } from '@prisma/client'
import { parseNotificationJob, processNotification } from './notification-queue.js'
type Kind = 'ORDER_RECORDED' | 'DISPATCHED' | 'DELIVERED'
type Status = 'ACCEPTED' | 'UNCONFIRMED' | 'SKIPPED' | 'QUEUED'
type Store = Pick<PrismaClient, 'order' | 'storeSetting' | 'user'>
const copy: Record<Kind, { subject: string; text: string }> = {
  ORDER_RECORDED: { subject: 'Your Gadgify order has been recorded', text: 'Your order has been recorded. This email does not confirm payment. Sign in and open Orders to check payment and order status.' },
  DISPATCHED: { subject: 'Your Gadgify order has been dispatched', text: 'The store has recorded dispatch of your order. Sign in and open Orders for the carrier, tracking reference and latest updates.' },
  DELIVERED: { subject: 'Your Gadgify order is marked delivered', text: 'The store has marked your order delivered. Sign in and open Orders for details. If you have not received it, please contact support.' },
}
// One send attempt per order/milestone. UNCONFIRMED is not a retry queue or proof of failure.
export async function notifyOrder(
  store: Store, orderId: string, kind: Kind,
  send: (to: string, subject: string, html: string, timeoutMs?: number) => Promise<boolean>,
): Promise<Status> {
  try {
    const key = `order-email.${orderId}.${kind}`
    const previous = await store.storeSetting.findUnique({ where: { key } })
    if (previous && parseNotificationJob(previous.value)) {
      const status = await processNotification(store, key, { apiKey: process.env.RESEND_API_KEY, from: process.env.RESEND_FROM_EMAIL })
      return status === 'ACCEPTED' ? 'ACCEPTED' : status === 'SKIPPED' ? 'SKIPPED' : ['PENDING','PROCESSING','RETRY','BUSY'].includes(status) ? 'QUEUED' : 'UNCONFIRMED'
    }
    if (previous) return JSON.parse(previous.value).status === 'ACCEPTED' ? 'ACCEPTED' : 'UNCONFIRMED'
    const order = await store.order.findUnique({ where: { id: orderId }, select: {
      orderNumber: true, status: true, shipment: { select: { status: true } },
      user: { select: { email: true, emailVerifiedAt: true } },
    } })
    if (!order?.user.email || !order.user.emailVerifiedAt) return 'SKIPPED'
    if (kind !== 'ORDER_RECORDED' && (['CANCELLED', 'REFUNDED'].includes(order.status) ||
      (kind === 'DELIVERED' ? order.shipment?.status !== 'DELIVERED' : !['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'EXCEPTION'].includes(order.shipment?.status ?? '')))) return 'SKIPPED'
    const value = (status: Status) => JSON.stringify({ kind, status, updatedAt: new Date().toISOString() })
    const claim = await store.storeSetting.createMany({ data: { key, value: value('UNCONFIRMED') }, skipDuplicates: true })
    if (!claim.count) return 'UNCONFIRMED'
    const escape = (text: string) => text.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
    const accepted = await send(order.user.email, copy[kind].subject,
      `<p>Order ${escape(order.orderNumber)}</p><p>${copy[kind].text}</p>`, 5000)
    if (!accepted) return 'UNCONFIRMED'
    await store.storeSetting.update({ where: { key }, data: { value: value('ACCEPTED') } })
    return 'ACCEPTED'
  } catch {
    // Provider or notification-storage failure must never undo a saved order/shipment.
    return 'UNCONFIRMED'
  }
}
