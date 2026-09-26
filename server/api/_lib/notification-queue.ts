import { createHash } from 'node:crypto'
import type { PrismaClient, Prisma } from '@prisma/client'
type OrderNotificationKind = 'ORDER_RECORDED' | 'DISPATCHED' | 'DELIVERED'
export type ShopNotificationKind = 'SHOP_DISPATCHED' | 'SHOP_DELIVERED' | 'SHOP_RETURN_APPROVED' | 'SHOP_RETURN_REJECTED' | 'SHOP_RETURN_RECEIVED'
export type NotificationKind = OrderNotificationKind | 'DISPUTE_SUPPORT' | 'DISPUTE_CUSTOMER' | 'INSPECTION_SELLER' | ShopNotificationKind
export type QueueStatus = 'PENDING' | 'PROCESSING' | 'RETRY' | 'ACCEPTED' | 'FAILED' | 'UNCONFIRMED' | 'SKIPPED' | 'BLOCKED'
export type NotificationJob = {
  version: 2; orderId: string; userId: string; kind: NotificationKind; status: QueueStatus;
  payload: { from: string; to: string[]; subject: string; html: string };
  attempts: number; firstAttemptAt: number | null; availableAt: number; leaseUntil: number;
  credentialHash: string | null; updatedAt: string;
  eventId?: string;
  shopId?: string;
}
type QueueStore = Pick<PrismaClient, 'storeSetting' | 'user'>
export const RETRY_WINDOW_MS = 23 * 60 * 60 * 1000
export const MAX_NOTIFICATION_ATTEMPTS = 5
const kinds: readonly NotificationKind[] = ['ORDER_RECORDED', 'DISPATCHED', 'DELIVERED', 'DISPUTE_SUPPORT', 'DISPUTE_CUSTOMER', 'SHOP_DISPATCHED', 'SHOP_DELIVERED', 'SHOP_RETURN_APPROVED', 'SHOP_RETURN_REJECTED', 'SHOP_RETURN_RECEIVED', 'INSPECTION_SELLER']
export const notificationKey = (job: Pick<NotificationJob, 'orderId' | 'kind' | 'eventId'>) =>
  `order-email.${job.orderId}.${job.kind}${job.eventId ? `.${job.eventId}` : ''}`
const copy = {
  ORDER_RECORDED: ['Your Gadgify order has been recorded', 'Your order has been recorded. This does not confirm payment. Sign in and open Orders for current payment and order status.'],
  DISPATCHED: ['Your Gadgify order has been dispatched', 'The store has recorded dispatch of your order. Sign in and open Orders for tracking details.'],
  DELIVERED: ['Your Gadgify order is marked delivered', 'The store has marked your order delivered. If it has not arrived, please contact support.'],
} as const
export function parseNotificationJob(value: string): NotificationJob | null {
  try {
    const job = JSON.parse(value) as NotificationJob
    const scopedEvent = job.kind?.startsWith('DISPUTE_') || job.kind?.startsWith('SHOP_') || job.kind === 'INSPECTION_SELLER'
    if (job.kind === 'INSPECTION_SELLER' && (typeof job.shopId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(job.shopId))) return null
    if (scopedEvent && (typeof job.eventId !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(job.eventId))) return null
    if (!scopedEvent && job.eventId !== undefined) return null
    if (job.version !== 2 || !kinds.includes(job.kind) || typeof job.orderId !== 'string' || typeof job.userId !== 'string' ||
      !['PENDING','PROCESSING','RETRY','ACCEPTED','FAILED','UNCONFIRMED','SKIPPED','BLOCKED'].includes(job.status) ||
      !Number.isSafeInteger(job.attempts) || job.attempts < 0 || !Number.isFinite(job.availableAt) || !Number.isFinite(job.leaseUntil) ||
      (job.firstAttemptAt !== null && !Number.isFinite(job.firstAttemptAt)) ||
      (job.credentialHash !== null && (typeof job.credentialHash !== 'string' || !/^[a-f0-9]{64}$/.test(job.credentialHash))) ||
      typeof job.updatedAt !== 'string' || !Number.isFinite(Date.parse(job.updatedAt)) ||
      typeof job.payload?.from !== 'string' || !Array.isArray(job.payload.to) || job.payload.to.length !== 1 || typeof job.payload.to[0] !== 'string' ||
      typeof job.payload.subject !== 'string' || typeof job.payload.html !== 'string') return null
    return job
  } catch { return null }
}
export function notificationDue(job: NotificationJob, now: number) {
  return (['PENDING','RETRY'].includes(job.status) && job.availableAt <= now) || (job.status === 'PROCESSING' && job.leaseUntil <= now)
}
export async function enqueueOrderNotification(tx: Pick<Prisma.TransactionClient, 'order' | 'storeSetting'>, orderId: string, kind: OrderNotificationKind) {
  const key = `order-email.${orderId}.${kind}`
  // Never convert an older send attempt into a new provider request.
  if (await tx.storeSetting.findUnique({ where: { key } })) return
  const order = await tx.order.findUnique({ where: { id: orderId }, select: {
    orderNumber: true, userId: true, user: { select: { email: true, emailVerifiedAt: true } },
  } })
  if (!order) throw new Error('Notification order unavailable')
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
  const now = Date.now()
  const job: NotificationJob = { version: 2, orderId, userId: order.userId, kind,
    status: order.user.email && order.user.emailVerifiedAt ? 'PENDING' : 'SKIPPED',
    payload: { from: '', to: [order.user.email ?? ''], subject: copy[kind][0], html: `<p>Order ${escape(order.orderNumber)}</p><p>${copy[kind][1]}</p>` },
    attempts: 0, firstAttemptAt: null, availableAt: now, leaseUntil: 0, credentialHash: null, updatedAt: new Date(now).toISOString(),
  }
  await tx.storeSetting.create({ data: { key, value: JSON.stringify(job) } })
}
export async function processNotification(
  store: QueueStore, key: string, config: { apiKey?: string; from?: string; supportEmail?: string },
  fetcher: typeof fetch = fetch, now = Date.now(),
): Promise<QueueStatus | 'LEGACY' | 'BUSY'> {
  const record = await store.storeSetting.findUnique({ where: { key } })
  const job = record && parseNotificationJob(record.value)
  if (!record || !job || key !== notificationKey(job)) return 'LEGACY'
  if (!notificationDue(job, now)) return job.status
  const finishBeforeSend = async (status: QueueStatus) => {
    const updated = await store.storeSetting.updateMany({ where: { key, value: record.value }, data: {
      value: JSON.stringify({ ...job, status, leaseUntil: 0, updatedAt: new Date(now).toISOString() }),
    } })
    return updated.count ? status : 'BUSY' as const
  }
  if (job.attempts >= MAX_NOTIFICATION_ATTEMPTS || (job.firstAttemptAt !== null && now - job.firstAttemptAt >= RETRY_WINDOW_MS)) return finishBeforeSend('UNCONFIRMED')
  if (!config.apiKey || (!job.payload.from && !config.from)) return 'BLOCKED'
  const fingerprint = createHash('sha256').update(config.apiKey).digest('hex')
  if (job.credentialHash && job.credentialHash !== fingerprint) return finishBeforeSend('BLOCKED')
  let destination = job.payload.to[0]
  if (job.kind === 'DISPUTE_SUPPORT') {
    if (!config.supportEmail || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.supportEmail)) return 'BLOCKED'
    if (job.firstAttemptAt !== null && destination !== config.supportEmail) return finishBeforeSend('BLOCKED')
    destination = config.supportEmail
  } else {
    if (job.kind === 'INSPECTION_SELLER') {
      const member = await store.user.findFirst({ where: { id: job.userId, shopMemberships: { some: { shopId: job.shopId, status: 'ACTIVE', shop: { status: 'APPROVED', isPlatform: false } } } }, select: { id: true } })
      if (!member) return finishBeforeSend('SKIPPED')
    }
    const user = await store.user.findUnique({ where: { id: job.userId }, select: { email: true, emailVerifiedAt: true } })
    if (!user?.emailVerifiedAt || user.email !== destination) return finishBeforeSend('SKIPPED')
  }
  const claimed: NotificationJob = { ...job, status: 'PROCESSING', attempts: job.attempts + 1,
    firstAttemptAt: job.firstAttemptAt ?? now, leaseUntil: now + 90_000, credentialHash: fingerprint,
    payload: { ...job.payload, to: [destination], from: job.payload.from || config.from! }, updatedAt: new Date(now).toISOString() }
  const claimedValue = JSON.stringify(claimed)
  const claim = await store.storeSetting.updateMany({ where: { key, value: record.value }, data: { value: claimedValue } })
  if (claim.count !== 1) return 'BUSY'
  let status: QueueStatus = 'RETRY'
  try {
    const response = await fetcher('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': 'gadgify-' + createHash('sha256').update(key).digest('hex') },
      body: JSON.stringify(claimed.payload),
    })
    status = response.ok ? 'ACCEPTED' : response.status === 429 || response.status === 409 || response.status >= 500 ? 'RETRY' : 'FAILED'
  } catch { status = 'RETRY' }
  if (status === 'RETRY' && claimed.attempts >= MAX_NOTIFICATION_ATTEMPTS) status = 'UNCONFIRMED'
  const finished = { ...claimed, status, leaseUntil: 0, availableAt: now + Math.min(3600000, 60000 * 2 ** (claimed.attempts - 1)), updatedAt: new Date().toISOString() }
  // A crashed worker leaves a recoverable lease; provider retries keep the original key/payload.
  await store.storeSetting.updateMany({ where: { key, value: claimedValue }, data: { value: JSON.stringify(finished) } })
  return status
}
export async function processDueNotifications(store: QueueStore, config: { apiKey?: string; from?: string; supportEmail?: string }, limit = 3) {
  const rows = await store.storeSetting.findMany({ where: { key: { startsWith: 'order-email.' },
    OR: [{ value: { contains: '"status":"PENDING"' } }, { value: { contains: '"status":"RETRY"' } }, { value: { contains: '"status":"PROCESSING"' } }] },
    orderBy: [{ updatedAt: 'asc' }, { key: 'asc' }], take: 100 })
  let processed = 0
  for (const row of rows) {
    const job = parseNotificationJob(row.value)
    if (!job || !notificationDue(job, Date.now())) continue
    await processNotification(store, row.key, config)
    if (++processed >= Math.min(Math.max(limit, 1), 10)) break
  }
  return { processed, scanned: rows.length }
}
