import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { bodyRecord, fetchWithTimeout, LONG_RUNNING_API_TIMEOUT_MS, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const rawOrderId = bodyRecord(request).orderId
  const orderId = typeof rawOrderId === 'string' ? rawOrderId : ''
  const keyId = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!orderId || !keyId || !secret) return sendError(response, 503, 'PAYMENT_UNAVAILABLE', 'Payment service is not configured.', id)
  const publicKeyId: string = keyId
  try {
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { payment: true } })
    if (!order || !order.payment) return sendError(response, 404, 'NOT_FOUND', 'Order not found.', id)
    const auth = Buffer.from(`${keyId}:${secret}`).toString('base64')
    const result = await fetchWithTimeout('https://api.razorpay.com/v1/orders', { timeoutMs: LONG_RUNNING_API_TIMEOUT_MS, method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: order.totalMinor, currency: order.currency, receipt: order.orderNumber, notes: { userId: user.id } }) })
    if (!result.ok) return sendError(response, 502, 'PAYMENT_FAILED', 'Payment provider rejected the order.', id)
    const providerOrder = await result.json() as { id?: unknown }
    const providerOrderId = typeof providerOrder.id === 'string' ? providerOrder.id : ''
    if (!providerOrderId) return sendError(response, 502, 'PAYMENT_FAILED', 'Payment provider returned an invalid order.', id)
    await db.payment.update({ where: { orderId }, data: { provider: 'RAZORPAY', providerOrderId, status: 'PENDING' } })
    return response.status(201).json({ paymentOrderId: String(providerOrderId), amount: Number(order.totalMinor), currency: String(order.currency), keyId: String(publicKeyId), requestId: id })
  } catch { return sendError(response, 502, 'PAYMENT_FAILED', 'Payment service is temporarily unavailable.', id) }
}
