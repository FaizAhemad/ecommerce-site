import { createHmac, timingSafeEqual } from 'node:crypto'
import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const providerOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
  const providerPaymentId = typeof body.razorpayPaymentId === 'string' ? body.razorpayPaymentId : ''
  const signature = typeof body.signature === 'string' ? body.signature : ''
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!orderId || !providerOrderId || !providerPaymentId || !signature || !secret) return sendError(response, 400, 'VALIDATION_ERROR', 'Payment verification details are incomplete.', id)
  const expected = createHmac('sha256', secret).update(`${providerOrderId}|${providerPaymentId}`).digest('hex')
  const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  if (!valid) return sendError(response, 400, 'PAYMENT_FAILED', 'Payment signature is invalid.', id)
  try {
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { payment: true } })
    if (!order?.payment || order.payment.providerOrderId !== providerOrderId) return sendError(response, 404, 'NOT_FOUND', 'Payment order not found.', id)
    const payment = await db.payment.update({ where: { orderId }, data: { providerPaymentId, status: 'CAPTURED' } })
    await db.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
    return response.status(200).json({ verified: true, payment, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Payment status could not be saved.', id) }
}
