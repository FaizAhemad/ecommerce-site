import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import {
  fetchPayment,
  matchesAuthorizedPayment,
  matchesCapturedPayment,
  matchesFailedPayment,
  recordAuthorizedPayment,
  recordCapturedPayment,
  recordFailedPayment,
} from '../_lib/payment-confirmation.js'
import {
  bodyRecord,
  fetchWithTimeout,
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)

  const body = bodyRecord(request)
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const providerOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
  const providerPaymentId = typeof body.razorpayPaymentId === 'string' ? body.razorpayPaymentId : ''
  if (
    !orderId || orderId.length > 128 ||
    !/^order_[A-Za-z0-9]+$/.test(providerOrderId) ||
    !/^pay_[A-Za-z0-9]+$/.test(providerPaymentId)
  )
    return sendError(response, 400, 'VALIDATION_ERROR', 'Payment attempt details are incomplete.', id)

  const key = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!key || !secret)
    return sendError(response, 503, 'PAYMENT_UNAVAILABLE', 'Payment status is temporarily unavailable.', id)

  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { payment: true },
    })
    if (!order?.payment)
      return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    if (
      order.payment.provider !== 'RAZORPAY' ||
      order.payment.providerOrderId !== providerOrderId ||
      order.payment.amountMinor !== order.totalMinor ||
      !['PENDING', 'AUTHORIZED', 'FAILED'].includes(order.payment.status)
    )
      return sendError(response, 409, 'PAYMENT_CONFLICT', 'This order is no longer awaiting payment.', id)

    const payment = await fetchPayment(providerPaymentId, key, secret, fetchWithTimeout)
    const expected = {
      id: providerPaymentId,
      orderId: providerOrderId,
      amount: order.totalMinor,
      currency: order.currency,
    }
    if (matchesCapturedPayment(payment, expected)) {
      const recorded = await recordCapturedPayment(db, orderId, providerOrderId, providerPaymentId)
      if (!recorded)
        return sendError(response, 409, 'PAYMENT_CONFLICT', 'Payment status changed. Refresh this order before taking further action.', id)
      return response.status(200).json({ verified: true, payment: { status: 'CAPTURED' }, orderStatus: order.status, requestId: id })
    }
    if (matchesAuthorizedPayment(payment, expected)) {
      const recorded = await recordAuthorizedPayment(db, orderId, providerOrderId, order.totalMinor)
      if (!recorded)
        return sendError(response, 409, 'PAYMENT_CONFLICT', 'Payment status changed. Refresh this order before taking further action.', id)
      return response.status(200).json({ verified: true, payment: { status: 'AUTHORIZED' }, orderStatus: order.status, requestId: id })
    }
    if (!matchesFailedPayment(payment, expected)) {
      const providerStatus = payment && typeof payment === 'object'
        ? (payment as Record<string, unknown>).status
        : undefined
      if (providerStatus === 'created' || providerStatus === 'processing')
        return sendError(
          response,
          409,
          'PAYMENT_UNCONFIRMED',
          'Razorpay is still processing this payment. Your order is not confirmed yet. Refresh the order before trying again.',
          id,
        )
      return sendError(
        response,
        409,
        'PAYMENT_UNCONFIRMED',
        'We could not match this payment attempt to your order, so its status was not changed. Refresh your order or contact customer care.',
        id,
      )
    }

    const recorded = await recordFailedPayment(db, orderId, providerOrderId, order.totalMinor)
    if (!recorded)
      return sendError(response, 409, 'PAYMENT_CONFLICT', 'Payment status changed. Refresh this order before trying again.', id)
    return response.status(200).json({ verified: true, payment: { status: 'FAILED' }, orderStatus: order.status, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'PAYMENT_STATUS_UNAVAILABLE',
      'We could not verify this payment attempt. Your order status has not been changed. Refresh the order before trying again.',
      id,
    )
  }
}
