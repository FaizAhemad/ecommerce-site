import type { PrismaClient, ShipmentStatus } from '@prisma/client'
import type { enqueueOrderNotification } from './notification-queue.js'
export class ShipmentError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}
export const shipmentFields = { id: true, carrier: true, trackingCode: true, status: true, updatedAt: true } as const
const transitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING: ['PENDING', 'IN_TRANSIT'],
  IN_TRANSIT: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'],
  OUT_FOR_DELIVERY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'],
  EXCEPTION: ['EXCEPTION', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  DELIVERED: ['DELIVERED'],
}
export async function saveShipment(store: Pick<PrismaClient, '$transaction'>, actorId: string, input: Record<string, unknown>, enqueue?: typeof enqueueOrderNotification) {
  const text = (key: string) => typeof input[key] === 'string' ? input[key].trim() : ''
  const orderId = text('orderId'), carrier = text('carrier'), trackingCode = text('trackingCode'), description = text('description')
  const status = text('status') as ShipmentStatus
  if (!orderId || orderId.length > 128 || !Object.hasOwn(transitions, status) || !carrier || carrier.length > 100 || trackingCode.length > 150 || !description || description.length > 1000 || (status !== 'PENDING' && !trackingCode))
    throw new ShipmentError(400, 'Provide a carrier, status, customer-visible update (up to 1000 characters) and tracking reference before dispatch.')
  return store.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { shipment: true, payment: true } })
    if (!order) throw new ShipmentError(404, 'Order not found.')
    if (['CANCELLED', 'REFUNDED', 'PENDING'].includes(order.status)) throw new ShipmentError(409, 'This order is not available for fulfillment.')
    if (order.payment?.provider !== 'COD' && order.payment?.status !== 'CAPTURED') throw new ShipmentError(409, 'Confirm payment before fulfillment.')
    const current = order.shipment
    if (input.expectedUpdatedAt !== (current?.updatedAt.toISOString() ?? null) || input.expectedOrderStatus !== order.status)
      throw new ShipmentError(409, 'Shipment or order changed. Reload before saving.')
    if (!transitions[current?.status ?? 'PENDING'].includes(status) || (order.status === 'DELIVERED' && status !== 'DELIVERED'))
      throw new ShipmentError(409, 'This shipment status transition is not allowed.')
    const updatedAt = new Date(Math.max(Date.now(), (current?.updatedAt.getTime() ?? 0) + 1))
    const shipment = await tx.shipment.upsert({ where: { orderId },
      create: { orderId, carrier, trackingCode: trackingCode || null, status, updatedAt },
      update: { carrier, trackingCode: trackingCode || null, status, updatedAt }, select: shipmentFields })
    const orderStatus = status === 'DELIVERED' ? 'DELIVERED' : status === 'PENDING' ? order.status : 'SHIPPED'
    const changed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: orderStatus } })
    if (changed.count !== 1) throw new ShipmentError(409, 'Order changed. Reload before saving.')
    const event = await tx.trackingEvent.create({ data: { shipmentId: shipment.id, status, description, occurredAt: updatedAt } })
    await tx.storeSetting.create({ data: { key: `audit.shipment.${event.id}`, value: JSON.stringify({ action: 'shipment.updated', actorId, resource: orderId, version: updatedAt.getTime(), createdAt: updatedAt.toISOString(), eventId: event.id }) } })
    if (enqueue && (status === 'IN_TRANSIT' || status === 'DELIVERED'))
      await enqueue(tx, order.id, status === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED')
    return shipment
  }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
}
