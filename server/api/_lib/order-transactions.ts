import { randomUUID } from 'node:crypto'
import type { PrismaClient, OrderStatus } from '@prisma/client'

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

export async function createCartOrder(store: Store, userId: string, addressId: string) {
  return store.$transaction(async (tx) => {
    // All eligibility, price and cart reads participate in the same serializable snapshot.
    const address = await tx.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    })
    if (!address)
      throw new OrderActionError(400, 'INVALID_ADDRESS', 'Select a valid shipping address.')
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true }, orderBy: { productId: 'asc' } } },
    })
    if (!cart?.items.length)
      throw new OrderActionError(400, 'EMPTY_CART', 'Add items before placing an order.')
    let subtotalMinor = 0
    for (const item of cart.items) {
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
    const order = await tx.order.create({
      data: {
        orderNumber: `GAD-${randomUUID().toUpperCase()}`,
        userId,
        shippingAddressId: address.id,
        subtotalMinor,
        totalMinor: subtotalMinor,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPriceMinor: item.product.priceMinor,
            quantity: item.quantity,
          })),
        },
        payment: { create: { provider: 'COD', amountMinor: subtotalMinor } },
      },
      include: { items: true, payment: true },
    })
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
  if (status === 'CANCELLED') return cancelOrder(store, orderId)
  return store.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) throw new OrderActionError(404, 'NOT_FOUND', 'Order not found.')
    if (order.status === status) return order
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
