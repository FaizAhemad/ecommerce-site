import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { fetchPayment, matchesFullRefund, recordFullRefund } from '../_lib/payment-confirmation.js'
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
  if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET')
      return response.status(200).json({
        payments: await db.payment.findMany({
          include: {
            order: { select: { id: true, orderNumber: true, userId: true, totalMinor: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        requestId: id,
      })
    if (request.method !== 'PATCH')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request)
    const orderId = typeof body.orderId === 'string' ? body.orderId : ''
    if (!orderId || body.action !== 'reconcile-refund')
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
    const proof = await fetchPayment(payment.providerPaymentId, key, secret, fetchWithTimeout)
    if (
      payment.amountMinor !== payment.order.totalMinor ||
      !matchesFullRefund(proof, {
        id: payment.providerPaymentId,
        orderId: payment.providerOrderId,
        amount: payment.order.totalMinor,
        currency: payment.order.currency,
      })
    )
      return sendError(
        response,
        409,
        'REFUND_UNCONFIRMED',
        'The provider has not confirmed a matching full refund. No refund status was changed.',
        id,
      )
    await recordFullRefund(
      db,
      orderId,
      payment.providerOrderId,
      payment.providerPaymentId,
      payment.amountMinor,
    )
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
