import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { fetchPayment, matchesCapturedPayment, matchesFullRefund, recordFullRefund } from '../_lib/payment-confirmation.js'
import { initiateFullRefund, refundKey, type RefundAttempt } from '../_lib/refund-initiation.js'
import {
  bodyRecord,
  fetchWithTimeout,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const admin = await requireAdmin(request, response)
  if (!admin) return
  try {
    if (request.method === 'GET') {
      const payments = await db.payment.findMany({
        select: { id: true, orderId: true, provider: true, providerPaymentId: true, amountMinor: true, status: true,
          order: { select: { orderNumber: true, currency: true } } }, orderBy: { createdAt: 'desc' }, take: 100,
      })
      const attempts = await db.storeSetting.findMany({ where: { key: { in: payments.map(payment => refundKey(payment.orderId)) } } })
      const statuses = new Map(attempts.map(row => [row.key, (JSON.parse(row.value) as { status: string }).status]))
      return response.status(200).json({
        payments: payments.map(payment => ({ ...payment, refundStatus: payment.status === 'REFUNDED' ? 'REFUNDED' : statuses.get(refundKey(payment.orderId)) ?? null })),
        requestId: id,
      })
    }
    if (request.method !== 'PATCH')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request)
    const orderId = typeof body.orderId === 'string' ? body.orderId : ''
    if (!orderId || orderId.length > 100 || !['reconcile-refund', 'initiate-refund'].includes(String(body.action)))
      return sendError(
        response,
        400,
        'VALIDATION_ERROR',
        'Use refund verification after an approved refund is processed through the payment provider.',
        id,
      )
    const payment = await db.payment.findUnique({ where: { orderId }, include: { order: true } })
    if (
      !payment ||
      payment.provider !== 'RAZORPAY' ||
      !payment.providerPaymentId ||
      !payment.providerOrderId
    )
      return sendError(
        response,
        409,
        'REFUND_UNCONFIRMED',
        'A recorded Razorpay payment is required for verification.',
        id,
      )
    const key = process.env.RAZORPAY_KEY_ID,
      secret = process.env.RAZORPAY_KEY_SECRET
    if (!key || !secret)
      return sendError(
        response,
        503,
        'PAYMENT_UNAVAILABLE',
        'Payment verification is unavailable.',
        id,
      )
    const proof = await fetchPayment(payment.providerPaymentId, key, secret,
      (url, init) => fetchWithTimeout(url, { ...init, timeoutMs: 10000 }))
    if (body.action === 'initiate-refund') {
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (body.confirmed !== true || reason.length < 3 || reason.length > 1000 || body.expectedAmount !== payment.amountMinor)
        return sendError(response, 400, 'VALIDATION_ERROR', 'Confirm the full amount and provide a refund reason (3–1000 characters).', id)
      const expected = { id: payment.providerPaymentId, orderId: payment.providerOrderId, amount: payment.amountMinor, currency: payment.order.currency }
      if (payment.status !== 'CAPTURED' || payment.amountMinor !== payment.order.totalMinor || payment.amountMinor <= 0 || payment.order.currency !== 'INR' ||
        !matchesCapturedPayment(proof, expected) || (proof as Record<string, unknown>).amount_refunded !== 0)
        return sendError(response, 409, 'REFUND_UNAVAILABLE', 'A matching captured INR payment with no prior refund is required. Verify provider status.', id)
      const refund = await initiateFullRefund(db, { orderId, actorId: admin.id, reason, paymentId: payment.providerPaymentId, amount: payment.amountMinor, currency: payment.order.currency }, { key, secret },
        (url, init) => fetchWithTimeout(url, { ...init, timeoutMs: 15000 }))
      return response.status(202).json({ refund, requestId: id })
    }
    if (
      payment.amountMinor !== payment.order.totalMinor ||
      !matchesFullRefund(proof, {
        id: payment.providerPaymentId,
        orderId: payment.providerOrderId,
        amount: payment.order.totalMinor,
        currency: payment.order.currency,
      })
    ) {
      const row = await db.storeSetting.findUnique({ where: { key: refundKey(orderId) } })
      if (row) {
        const attempt = JSON.parse(row.value) as RefundAttempt
        let status: RefundAttempt['status'] = 'UNCONFIRMED'
        if (attempt.providerRefundId) {
          const result = await fetchWithTimeout(`https://api.razorpay.com/v1/refunds/${encodeURIComponent(attempt.providerRefundId)}`, {
            timeoutMs: 10000, headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` },
          })
          if (!result.ok) throw new Error('Refund verification unavailable')
          const refund = await result.json() as Record<string, unknown>
          if (refund.id !== attempt.providerRefundId || refund.payment_id !== payment.providerPaymentId || refund.amount !== payment.amountMinor || refund.currency !== payment.order.currency)
            throw new Error('Refund binding mismatch')
          status = refund.status === 'failed' ? 'FAILED' : 'PENDING'
        }
        await db.storeSetting.updateMany({ where: { key: row.key, value: row.value }, data: { value: JSON.stringify({ ...attempt, status }) } })
        return response.status(202).json({ refund: { status }, requestId: id })
      }
      return sendError(response, 409, 'REFUND_UNCONFIRMED', 'The provider has not confirmed a matching full refund. No refund status was changed.', id)
    }
    await recordFullRefund(
      db,
      orderId,
      payment.providerOrderId,
      payment.providerPaymentId,
      payment.amountMinor,
    )
    const attempt = await db.storeSetting.findUnique({ where: { key: refundKey(orderId) } })
    if (attempt) await db.storeSetting.updateMany({ where: { key: attempt.key, value: attempt.value }, data: {
      value: JSON.stringify({ ...JSON.parse(attempt.value), status: 'REFUNDED' }),
    } })
    return response.status(200).json({ payment: { status: 'REFUNDED' }, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Payment management is temporarily unavailable.',
      id,
    )
  }
}
