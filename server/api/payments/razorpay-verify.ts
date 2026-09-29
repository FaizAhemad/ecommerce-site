import { createHmac, timingSafeEqual } from 'node:crypto'
import { db } from '../_lib/db.js'
import {
  fetchPayment,
  matchesAuthorizedPayment,
  matchesCapturedPayment,
  recordAuthorizedPayment,
  recordCapturedPayment,
} from '../_lib/payment-confirmation.js'
import { requireUser } from '../_lib/auth.js'
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
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const providerOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
  const providerPaymentId = typeof body.razorpayPaymentId === 'string' ? body.razorpayPaymentId : ''
  const signature = typeof body.signature === 'string' ? body.signature : ''
  const secret = process.env.RAZORPAY_KEY_SECRET
  const key = process.env.RAZORPAY_KEY_ID
  if (!orderId || !providerOrderId || !providerPaymentId || !signature || !secret)
    return sendError(
      response,
      400,
      'VALIDATION_ERROR',
      'Payment verification details are incomplete.',
      id,
    )
  const expected = createHmac('sha256', secret)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest('hex')
  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  if (!valid) return sendError(response, 400, 'PAYMENT_VERIFICATION_FAILED', 'We could not verify this payment response. Refresh the order status before trying again.', id)
  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { payment: true },
    })
    if (!order?.payment || order.payment.providerOrderId !== providerOrderId)
      return sendError(response, 404, 'NOT_FOUND', 'Payment order not found.', id)
    if (!key)
      return sendError(
        response,
        503,
        'PAYMENT_UNAVAILABLE',
        'Payment verification is temporarily unavailable.',
        id,
      )
    const providerPayment = await fetchPayment(providerPaymentId, key, secret, fetchWithTimeout)
    if (
      matchesAuthorizedPayment(providerPayment, {
        id: providerPaymentId,
        orderId: providerOrderId,
        amount: order.totalMinor,
        currency: order.currency,
      })
    ) {
      const recorded = await recordAuthorizedPayment(db, orderId, providerOrderId, order.totalMinor)
      if (!recorded)
        return sendError(response, 409, 'PAYMENT_CONFLICT', 'Payment status changed. Refresh this order before taking further action.', id)
      return response.status(200).json({ verified: true, payment: { status: 'AUTHORIZED' }, orderStatus: order.status, requestId: id })
    }
    if (
      !matchesCapturedPayment(providerPayment, {
        id: providerPaymentId,
        orderId: providerOrderId,
        amount: order.totalMinor,
        currency: order.currency,
      })
    )
      return sendError(
        response,
        409,
        'PAYMENT_UNCONFIRMED',
        'Razorpay has not confirmed a completed payment yet. Your order is still awaiting payment. Refresh the order before retrying.',
        id,
      )
    const recorded = await recordCapturedPayment(db, orderId, providerOrderId, providerPaymentId)
    if (!recorded)
      return sendError(
        response,
        409,
        'PAYMENT_CONFLICT',
        'Payment status changed while we were checking it. Refresh this order before taking further action.',
        id,
      )
    const currentOrder = await db.order.findFirst({ where: { id: orderId, userId: user.id }, select: { status: true } })
    return response.status(200).json({ verified: true, payment: { status: 'CAPTURED' }, orderStatus: currentOrder?.status ?? order.status, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'We could not save the verified payment status. Refresh your order before trying again.',
      id,
    )
  }
}
