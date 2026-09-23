import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'

export type RefundAttempt = {
  status: 'UNCONFIRMED' | 'PENDING' | 'FAILED' | 'REFUNDED'
  actorId: string; reason: string; paymentId: string; amount: number; currency: string
  providerRefundId?: string; createdAt: string
}
export const refundKey = (orderId: string) => `refund-attempt.${orderId}`

// A durable claim precedes the external write. No request, including an explicit
// browser retry, may send a second refund for an already claimed order.
export async function initiateFullRefund(
  store: Pick<PrismaClient, 'storeSetting'>,
  input: { orderId: string; actorId: string; reason: string; paymentId: string; amount: number; currency: string },
  credentials: { key: string; secret: string },
  fetcher: typeof fetch,
) {
  const key = refundKey(input.orderId)
  const attempt: RefundAttempt = { status: 'UNCONFIRMED', actorId: input.actorId, reason: input.reason,
    paymentId: input.paymentId, amount: input.amount, currency: input.currency, createdAt: new Date().toISOString() }
  const value = JSON.stringify(attempt)
  const claimed = await store.storeSetting.createMany({ data: { key, value }, skipDuplicates: true })
  if (claimed.count !== 1) return { status: 'UNCONFIRMED' as const, existing: true }
  try {
    const response = await fetcher(`https://api.razorpay.com/v1/payments/${encodeURIComponent(input.paymentId)}/refund`, {
      method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${credentials.key}:${credentials.secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: input.amount, speed: 'normal', receipt: createHash('sha256').update(key).digest('hex').slice(0, 40) }),
    })
    if (!response.ok) return { status: 'UNCONFIRMED' as const, existing: false }
    const refund = await response.json() as Record<string, unknown>
    if (typeof refund.id !== 'string' || !/^rfnd_[A-Za-z0-9]+$/.test(refund.id) || refund.payment_id !== input.paymentId || refund.amount !== input.amount || refund.currency !== input.currency)
      return { status: 'UNCONFIRMED' as const, existing: false }
    // Even a processed creation response requires independent payment verification.
    const status = refund.status === 'failed' ? 'FAILED' as const : 'PENDING' as const
    await store.storeSetting.updateMany({ where: { key, value }, data: { value: JSON.stringify({ ...attempt, status, providerRefundId: refund.id }) } })
    return { status, existing: false }
  } catch { return { status: 'UNCONFIRMED' as const, existing: false } }
}
