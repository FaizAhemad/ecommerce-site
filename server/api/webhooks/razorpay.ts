import { createHmac, timingSafeEqual } from 'node:crypto'
import { db } from '../_lib/db.js'
import { matchesCapturedPayment, recordCapturedPayment } from '../_lib/payment-confirmation.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const signature = Array.isArray(request.headers?.['x-razorpay-signature'])
    ? request.headers?.['x-razorpay-signature'][0]
    : request.headers?.['x-razorpay-signature']
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const raw = typeof request.body === 'string' ? request.body : ''
  if (!signature || !secret || !raw)
    return sendError(response, 400, 'INVALID_WEBHOOK', 'Webhook signature is missing.', id)
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  )
    return sendError(response, 400, 'INVALID_WEBHOOK', 'Webhook signature is invalid.', id)
  try {
    const payload = JSON.parse(raw) as {
      event?: string
      payload?: {
        payment?: {
          entity?: {
            order_id?: string
            id?: string
            status?: string
            amount?: number
            currency?: string
          }
        }
      }
    }
    const entity = payload.payload?.payment?.entity
    if (entity?.order_id) {
      const status =
        payload.event === 'payment.captured'
          ? 'CAPTURED'
          : payload.event === 'payment.failed'
            ? 'FAILED'
            : undefined
      if (status === 'FAILED')
        await db.payment.updateMany({
          where: {
            providerOrderId: entity.order_id,
            status: { in: ['PENDING', 'AUTHORIZED', 'FAILED'] },
          },
          data: { status },
        })
      if (status === 'CAPTURED') {
        const order = await db.order.findFirst({
          where: { payment: { providerOrderId: entity.order_id } },
        })
        if (!order)
          return sendError(
            response,
            503,
            'PAYMENT_UNAVAILABLE',
            'Payment order is not available yet.',
            id,
          )
        if (
          !entity.id ||
          !matchesCapturedPayment(entity, {
            id: entity.id,
            orderId: entity.order_id,
            amount: order.totalMinor,
            currency: order.currency,
          })
        )
          return sendError(
            response,
            400,
            'INVALID_WEBHOOK',
            'Payment details do not match the order.',
            id,
          )
        await recordCapturedPayment(db, order.id, entity.order_id, entity.id)
      }
    }
    return response.status(200).json({ received: true, requestId: id })
  } catch (error) {
    if (error instanceof SyntaxError)
      return sendError(response, 400, 'INVALID_WEBHOOK', 'Webhook payload is invalid.', id)
    return sendError(
      response,
      503,
      'WEBHOOK_UNAVAILABLE',
      'Webhook processing is temporarily unavailable.',
      id,
    )
  }
}
