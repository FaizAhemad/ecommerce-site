import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const orders = await db.order.findMany({ where: { userId: user.id }, include: { items: true, payment: true, shipment: true }, orderBy: { createdAt: 'desc' } })
      return response.status(200).json({ orders, requestId: id })
    }
    if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request)
    const addressId = typeof body.addressId === 'string' ? body.addressId : undefined
    const cart = await db.cart.findUnique({ where: { userId: user.id }, include: { items: { include: { product: true } } } })
    if (!cart?.items.length) return sendError(response, 400, 'EMPTY_CART', 'Add items before placing an order.', id)
    if (cart.items.some((item) => item.quantity > item.product.stock)) return sendError(response, 409, 'OUT_OF_STOCK', 'One or more products are out of stock.', id)
    const subtotalMinor = cart.items.reduce((sum, item) => sum + item.quantity * item.product.priceMinor, 0)
    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { orderNumber: `GAD-${Date.now().toString(36).toUpperCase()}`, userId: user.id, shippingAddressId: addressId, subtotalMinor, totalMinor: subtotalMinor, items: { create: cart.items.map((item) => ({ productId: item.productId, productName: item.product.name, unitPriceMinor: item.product.priceMinor, quantity: item.quantity })) }, payment: { create: { provider: 'COD', amountMinor: subtotalMinor } } }, include: { items: true, payment: true } })
      await Promise.all(cart.items.map((item) => tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })))
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      return created
    })
    return response.status(201).json({ order, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Orders are temporarily unavailable.', id) }
}
