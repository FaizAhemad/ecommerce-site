import type { PrismaClient } from '@prisma/client'

export function matchesFullRefund(
  value: unknown,
  expected: { id: string; orderId: string; amount: number; currency: string },
) {
  if (!value || typeof value !== 'object') return false
  const payment = value as Record<string, unknown>
  return (
    payment.id === expected.id &&
    payment.order_id === expected.orderId &&
    payment.amount === expected.amount &&
    payment.currency === expected.currency &&
    payment.status === 'refunded' &&
    payment.refund_status === 'full' &&
    payment.amount_refunded === expected.amount
  )
}
export async function recordFullRefund(
  store: Pick<PrismaClient, '$transaction'>,
  orderId: string,
  providerOrderId: string,
  paymentId: string,
  amount: number,
) {
  return store.$transaction(
    async (tx) => {
      const updated = await tx.payment.updateMany({
        where: {
          orderId,
          provider: 'RAZORPAY',
          providerOrderId,
          providerPaymentId: paymentId,
          amountMinor: amount,
        },
        data: { status: 'REFUNDED' },
      })
      if (updated.count !== 1) throw new Error('Payment binding changed')
      const order = await tx.order.updateMany({
        where: { id: orderId, totalMinor: amount },
        data: { status: 'REFUNDED' },
      })
      if (order.count !== 1) throw new Error('Order amount changed')
      return true
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}

export function matchesCapturedPayment(
  value: unknown,
  expected: { id: string; orderId: string; amount: number; currency: string },
) {
  if (!value || typeof value !== 'object') return false
  const payment = value as Record<string, unknown>
  return (
    payment.id === expected.id &&
    payment.order_id === expected.orderId &&
    payment.amount === expected.amount &&
    payment.currency === expected.currency &&
    payment.status === 'captured'
  )
}

export function matchesFailedPayment(
  value: unknown,
  expected: { id: string; orderId: string; amount: number; currency: string },
) {
  if (!value || typeof value !== 'object') return false
  const payment = value as Record<string, unknown>
  return (
    payment.id === expected.id &&
    payment.order_id === expected.orderId &&
    payment.amount === expected.amount &&
    payment.currency === expected.currency &&
    payment.status === 'failed'
  )
}

export function matchesAuthorizedPayment(
  value: unknown,
  expected: { id: string; orderId: string; amount: number; currency: string },
) {
  if (!value || typeof value !== 'object') return false
  const payment = value as Record<string, unknown>
  return (
    payment.id === expected.id &&
    payment.order_id === expected.orderId &&
    payment.amount === expected.amount &&
    payment.currency === expected.currency &&
    payment.status === 'authorized'
  )
}

/** Authorization is not capture: update payment state only; order remains unconfirmed. */
export async function recordAuthorizedPayment(
  store: Pick<PrismaClient, '$transaction'>,
  orderId: string,
  providerOrderId: string,
  amount: number,
) {
  return store.$transaction(
    async (tx) => {
      const result = await tx.payment.updateMany({
        where: {
          orderId,
          provider: 'RAZORPAY',
          providerOrderId,
          amountMinor: amount,
          status: { in: ['PENDING', 'AUTHORIZED', 'FAILED'] },
        },
        data: { status: 'AUTHORIZED' },
      })
      return result.count === 1
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}

/** Record a provider-verified failed attempt without failing/cancelling the unpaid order. */
export async function recordFailedPayment(
  store: Pick<PrismaClient, '$transaction'>,
  orderId: string,
  providerOrderId: string,
  amount: number,
) {
  return store.$transaction(
    async (tx) => {
      const result = await tx.payment.updateMany({
        where: {
          orderId,
          provider: 'RAZORPAY',
          providerOrderId,
          amountMinor: amount,
          // An authorization is a confirmed provider state. A delayed failure
          // event (possibly for another retry) must not erase that hold.
          status: { in: ['PENDING', 'FAILED'] },
        },
        data: { status: 'FAILED' },
      })
      return result.count === 1
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}

export async function fetchPayment(
  id: string,
  key: string,
  secret: string,
  fetcher: typeof fetch,
): Promise<unknown> {
  const response = await fetcher(`https://api.razorpay.com/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` },
  })
  if (!response.ok) throw new Error('Unable to verify provider payment')
  return response.json()
}
export async function recordCapturedPayment(
  store: Pick<PrismaClient, '$transaction'>,
  orderId: string,
  providerOrderId: string,
  paymentId: string,
) {
  return store.$transaction(
    async (tx) => {
      const result = await tx.payment.updateMany({
        where: {
          orderId,
          providerOrderId,
          status: { not: 'REFUNDED' },
          OR: [
            { providerPaymentId: null },
            { providerPaymentId: paymentId },
            { status: { in: ['PENDING', 'AUTHORIZED', 'FAILED'] } },
          ],
        },
        data: { providerPaymentId: paymentId, status: 'CAPTURED' },
      })
      if (result.count !== 1) return false
      await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      })
      return true
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}
