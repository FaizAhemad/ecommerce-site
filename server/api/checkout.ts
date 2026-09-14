import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { checkoutRules, checkoutTotal } from './_lib/checkout.js'
import {
  createCartOrder,
  OrderActionError,
  isTransactionConflict,
} from './_lib/order-transactions.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request),
    user = await requireUser(request, response)
  if (!user) return
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      if (request.method === 'GET') return response.status(200).json({ enabled: false })
      if (request.method === 'POST')
        return sendError(
          response,
          503,
          'CHECKOUT_UNAVAILABLE',
          'Online ordering is temporarily unavailable.',
          id,
        )
    }
    if (request.method === 'GET') {
      const rules = checkoutRules(
        (await db.storeSetting.findUnique({ where: { key: 'checkout' } }))?.value,
      )
      if (!rules?.enabled) return response.status(200).json({ enabled: false })
      const cart = await db.cart.findUnique({
        where: { userId: user.id },
        include: { items: { include: { product: true } } },
      })
      if (!cart?.items.length) return response.status(200).json({ enabled: false })
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.product.priceMinor,
        0,
      )
      return response.status(200).json({ enabled: true, ...checkoutTotal(subtotal, rules) })
    }
    if (request.method !== 'POST')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request)
    if (
      typeof body.requestId !== 'string' ||
      !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(body.requestId) ||
      typeof body.addressId !== 'string' ||
      !body.addressId ||
      !Number.isSafeInteger(body.expectedTotalMinor)
    )
      return sendError(
        response,
        400,
        'VALIDATION_ERROR',
        'Review the total and select a delivery address.',
        id,
      )
    const order = await createCartOrder(db, user.id, body.addressId, {
      requestId: body.requestId,
      expectedTotalMinor: Number(body.expectedTotalMinor),
      rules: checkoutRules,
      calculate: checkoutTotal,
    })
    return response.status(201).json({ orderId: order.id })
  } catch (error) {
    if (error instanceof OrderActionError)
      return sendError(response, error.status, error.code, error.message, id)
    if (
      isTransactionConflict(error) ||
      (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
    )
      return sendError(
        response,
        409,
        'CONFLICT',
        'Checkout changed. Check your orders and review the cart before trying again.',
        id,
      )
    return sendError(
      response,
      503,
      'CHECKOUT_UNAVAILABLE',
      'Unable to confirm checkout. Check your orders before trying again.',
      id,
    )
  }
}
