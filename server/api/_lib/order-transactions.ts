import { randomUUID } from 'node:crypto'
import { purchaseEligibility } from './marketplace-purchases.js'
import { allocateDiscount, sellerFeeAmount } from './seller-fees.js'
import type { PrismaClient, OrderStatus } from '@prisma/client'
import type { checkoutRules, checkoutTotal } from './checkout.js'
import type { quoteCoupon, couponUsagePrefix } from './coupons.js'
import type { enqueueOrderNotification } from './notification-queue.js'

type Store = Pick<PrismaClient, '$transaction'>
const transactionOptions = {
  isolationLevel: 'Serializable' as const,
  maxWait: 5_000,
  timeout: 10_000,
}
export class OrderActionError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function isTransactionConflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034'
}

export async function createCartOrder(
  store: Store,
  userId: string,
  addressId: string,
  checkout?: {
    requestId: string
    expectedTotalMinor: number
    rules: typeof checkoutRules
    calculate: typeof checkoutTotal
    couponCode?: string
    quoteCoupon?: typeof quoteCoupon
    couponUsagePrefix?: typeof couponUsagePrefix
  },
  enqueue?: typeof enqueueOrderNotification,
) {
  return store.$transaction(async (tx) => {
    if (checkout) {
      const existing = await tx.order.findUnique({
        where: { orderNumber: `GAD-${checkout.requestId}` },
        include: { payment: true },
      })
      if (existing) {
        if (existing.userId !== userId || existing.shippingAddressId !== addressId)
          throw new OrderActionError(
            409,
            'CONFLICT',
            'Check your previous order before starting another checkout.',
          )
        return existing
      }
    }
    // All eligibility, price and cart reads participate in the same serializable snapshot.
    const address = await tx.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true, country: true },
    })
    if (!address)
      throw new OrderActionError(400, 'INVALID_ADDRESS', 'Select a valid shipping address.')
    const rules = checkout
      ? checkout.rules((await tx.storeSetting.findUnique({ where: { key: 'checkout' } }))?.value)
      : null
    if (checkout && (!rules?.enabled || address.country !== 'IN'))
      throw new OrderActionError(
        409,
        'CHECKOUT_UNAVAILABLE',
        'Online ordering is unavailable for this address.',
      )
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { shopOwnership: { include: { shop: true } } } } }, orderBy: { productId: 'asc' } } },
    })
    if (!cart?.items.length)
      throw new OrderActionError(400, 'EMPTY_CART', 'Add items before placing an order.')
    let subtotalMinor = 0
    for (const item of cart.items) {
      const eligibility = purchaseEligibility(item.product.shopOwnership)
      if (!eligibility.available) throw new OrderActionError(409, 'SHOP_UNAVAILABLE', eligibility.reason!)
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1)
        throw new OrderActionError(409, 'INVALID_CART', 'Update your cart before placing an order.')
      const reserved = await tx.product.updateMany({
        where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (reserved.count !== 1)
        throw new OrderActionError(
          409,
          'OUT_OF_STOCK',
          'One or more products are unavailable or out of stock.',
        )
      subtotalMinor += item.quantity * item.product.priceMinor
    }
    if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor < 0 || subtotalMinor > 2_147_483_647)
      throw new OrderActionError(409, 'INVALID_CART', 'Update your cart before placing an order.')
    const coupon = checkout?.couponCode && checkout.quoteCoupon
      ? await checkout.quoteCoupon(tx, userId, checkout.couponCode, subtotalMinor) : null
    if (checkout?.couponCode && (!coupon || !checkout.couponUsagePrefix))
      throw new OrderActionError(503, 'COUPON_UNAVAILABLE', 'Coupon checkout is unavailable.')
    const totals =
      rules && checkout
        ? checkout.calculate(subtotalMinor, rules, coupon?.discountMinor, coupon?.taxTreatment, rules.shippingMinor)
        : { subtotalMinor, totalMinor: subtotalMinor }
    if (checkout && totals.totalMinor !== checkout.expectedTotalMinor)
      throw new OrderActionError(
        409,
        'PRICE_CHANGED',
        'Your cart or charges changed. Review the latest total before placing the order.',
      )
    const discounts = allocateDiscount(cart.items.map(item => ({ productId: item.productId, quantity: item.quantity, unitPriceMinor: item.product.priceMinor })), coupon?.discountMinor ?? 0)
    const discountByProduct = new Map(cart.items.map((item, index) => [item.productId, discounts[index]]))
    const feeByProduct = new Map<string, { baseMinor: number; amountMinor: number }>()
    for (const item of cart.items) {
      const ownership = item.product.shopOwnership as unknown as { feeType?: string | null; feeValue?: number | null; offerVersion?: number | null }
      const terms = ownership?.feeType && ownership.feeValue != null && ownership.offerVersion != null
        ? { type: ownership.feeType as 'FIXED_PER_UNIT' | 'PERCENTAGE', value: ownership.feeValue, version: ownership.offerVersion } : null
      try { feeByProduct.set(item.productId, sellerFeeAmount(terms, item.quantity, item.product.priceMinor, discountByProduct.get(item.productId) ?? 0)) }
      catch { throw new OrderActionError(409, 'SELLER_FEE_CONFLICT', 'A fee offer exceeds the discounted item price. Review the offer with the shop before ordering.') }
    }
    const order = await tx.order.create({
      data: {
        orderNumber: checkout ? `GAD-${checkout.requestId}` : `GAD-${randomUUID().toUpperCase()}`,
        userId,
        shippingAddressId: address.id,
        ...totals,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPriceMinor: item.product.priceMinor,
            shippingFeeMinor: 0,
            quantity: item.quantity,
          })),
        },
        payment: {
          create: { provider: checkout ? 'RAZORPAY' : 'COD', amountMinor: totals.totalMinor },
        },
      },
      include: { items: true, payment: true },
    })
    for (const orderItem of order.items) {
      const discountMinor = discountByProduct.get(orderItem.productId) ?? 0
      if (!discountMinor) continue
      const fee = feeByProduct.get(orderItem.productId)
      if (!fee) throw new OrderActionError(503, 'ORDER_UNAVAILABLE', 'Unable to preserve the order fee snapshot.')
      await tx.$executeRaw`UPDATE "OrderItem" SET "discountMinor"=${discountMinor} WHERE "id"=${orderItem.id}`
      await tx.$executeRaw`UPDATE "ShopOrderItem" SET "feeBaseMinor"=${fee.baseMinor}, "feeAmountMinor"=${fee.amountMinor} WHERE "orderItemId"=${orderItem.id}`
    }
    if (coupon && checkout?.couponUsagePrefix) {
      await tx.storeSetting.create({ data: {
        key: checkout.couponUsagePrefix(coupon.code, userId) + order.id,
        value: JSON.stringify({ ...coupon, orderId: order.id, createdAt: new Date().toISOString() }),
      } })
    }
    if (enqueue) await enqueue(tx, order.id, 'ORDER_RECORDED')
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
    return order
  }, transactionOptions)
}

// Both customer and admin cancellation use the same guarded status/restock transaction.
export async function cancelOrder(store: Store, orderId: string, userId?: string) {
  return store.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, ...(userId ? { userId } : {}) },
      include: { items: true },
    })
    if (!order) throw new OrderActionError(404, 'NOT_FOUND', 'Order not found.')
    if (order.status === 'CANCELLED') return order
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED')
      throw new OrderActionError(409, 'CONFLICT', 'This order can no longer be cancelled.')
    const changed = await tx.order.updateMany({
      where: { id: order.id, userId: order.userId, status: order.status },
      data: { status: 'CANCELLED' },
    })
    if (changed.count !== 1)
      throw new OrderActionError(409, 'CONFLICT', 'Order changed. Refresh before trying again.')
    await tx.$executeRaw`UPDATE "ShopOrderItem" SET "feeStatus"='VOID' WHERE "sellerOrderId" IN (SELECT "id" FROM "SellerOrder" WHERE "orderId"=${order.id}) AND "feeStatus"='PENDING'`
    // Consistent product ordering reduces lock contention across multi-item orders.
    for (const item of [...order.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }
    return { ...order, status: 'CANCELLED' as const }
  }, transactionOptions)
}

export async function updateOrderStatus(store: Store, orderId: string, status: OrderStatus) {
  if (status === 'SHIPPED' || status === 'DELIVERED')
    throw new OrderActionError(409, 'SHIPMENT_REQUIRED', 'Use Shipments to record dispatch and delivery with tracking history.')
  if (status === 'REFUNDED')
    throw new OrderActionError(
      409,
      'REFUND_UNCONFIRMED',
      'Verify the provider refund through Payments before recording a refunded order.',
    )
  if (status === 'CANCELLED') return cancelOrder(store, orderId)
  return store.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) throw new OrderActionError(404, 'NOT_FOUND', 'Order not found.')
    if (order.status === status) return order
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED')
      throw new OrderActionError(409, 'CONFLICT', 'Fulfilled orders cannot move backward through order status editing.')
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED')
      throw new OrderActionError(
        409,
        'CONFLICT',
        'A closed order cannot be reopened through status editing.',
      )
    const result = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status },
    })
    if (result.count !== 1)
      throw new OrderActionError(409, 'CONFLICT', 'Order changed. Refresh before trying again.')
    return { ...order, status }
  }, transactionOptions)
}
