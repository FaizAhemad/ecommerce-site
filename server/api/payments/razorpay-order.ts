import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import {
  bodyRecord,
  fetchWithTimeout,
  LONG_RUNNING_API_TIMEOUT_MS,
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
  const rawOrderId = bodyRecord(request).orderId
  const orderId = typeof rawOrderId === 'string' ? rawOrderId : ''
  const keyId = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!orderId || !keyId || !secret)
    return sendError(response, 503, 'PAYMENT_UNAVAILABLE', 'Payment service is not configured.', id)
  const publicKeyId: string = keyId
  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { payment: true },
    })
    if (!order || !order.payment)
      return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    if (
      !['PENDING', 'CONFIRMED'].includes(order.status) ||
      !['PENDING', 'FAILED'].includes(order.payment.status)
    )
      return sendError(response, 409, 'PAYMENT_CONFLICT', 'This order is not awaiting payment.', id)
    const ready = (paymentOrderId: string) => ({
      paymentOrderId,
      amount: order.totalMinor,
      currency: order.currency,
      keyId: publicKeyId,
      requestId: id,
    })
    if (order.payment.providerOrderId)
      return response.status(200).json(ready(order.payment.providerOrderId))
    const auth = Buffer.from(`${keyId}:${secret}`).toString('base64')
    const result = await fetchWithTimeout('https://api.razorpay.com/v1/orders', {
      timeoutMs: LONG_RUNNING_API_TIMEOUT_MS,
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: order.totalMinor,
        currency: order.currency,
        receipt: order.orderNumber,
      }),
    })
    if (!result.ok)
      return sendError(response, 502, 'PAYMENT_FAILED', 'Payment provider rejected the order.', id)
    const providerOrder = (await result.json()) as { id?: unknown }
    const providerOrderId = typeof providerOrder.id === 'string' ? providerOrder.id : ''
    if (!providerOrderId)
      return sendError(
        response,
        502,
        'PAYMENT_FAILED',
        'Payment provider returned an invalid order.',
        id,
      )
    const saved = await db.payment.updateMany({
      where: {
        orderId,
        providerOrderId: null,
        status: { in: ['PENDING', 'FAILED'] },
        order: { status: 'PENDING' },
      },
      data: { provider: 'RAZORPAY', providerOrderId, status: 'PENDING' },
    })
    if (saved.count !== 1) {
      const current = await db.payment.findUnique({
        where: { orderId },
        include: { order: { select: { status: true } } },
      })
      if (
        current?.providerOrderId &&
        current.order.status === 'PENDING' &&
        ['PENDING', 'FAILED'].includes(current.status)
      )
        return response.status(200).json(ready(current.providerOrderId))
      return sendError(
        response,
        409,
        'PAYMENT_CONFLICT',
        'Order changed. Check its status before trying again.',
        id,
      )
    }
    return response.status(201).json({
      paymentOrderId: String(providerOrderId),
      amount: Number(order.totalMinor),
      currency: String(order.currency),
      keyId: String(publicKeyId),
      requestId: id,
    })
  } catch {
    return sendError(
      response,
      502,
      'PAYMENT_FAILED',
      'Payment service is temporarily unavailable.',
      id,
    )
  }
}
