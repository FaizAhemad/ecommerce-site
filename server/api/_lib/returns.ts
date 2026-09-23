import type { PrismaClient } from '@prisma/client'
export const customerReturnFields = {
  id: true, reason: true, status: true, resolution: true, createdAt: true, updatedAt: true,
} as const

export async function requestReturn(store: Pick<PrismaClient, '$transaction'>, userId: string, input: Record<string, unknown>) {
  const id = typeof input.requestId === 'string' ? input.requestId : ''
  const orderId = typeof input.orderId === 'string' ? input.orderId : ''
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || !orderId || orderId.length > 128 || !reason || reason.length > 2000)
    throw new ReturnActionError(400, 'Select an order and provide a reason of up to 2000 characters.')
  return store.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, userId }, select: { id: true, status: true } })
    if (!order) throw new ReturnActionError(404, 'Order not found.')
    const previous = await tx.returnRequest.findUnique({ where: { id }, select: { ...customerReturnFields, userId: true, orderId: true } })
    if (previous) {
      if (previous.userId !== userId || previous.orderId !== orderId || previous.reason !== reason)
        throw new ReturnActionError(409, 'Request details changed. Refresh return status before trying again.')
      const { userId: _user, orderId: _order, ...result } = previous
      return result
    }
    const existing = await tx.returnRequest.findFirst({ where: { orderId }, select: { id: true } })
    if (existing) throw new ReturnActionError(409, 'A return request already exists for this order. Refresh its status or contact support.')
    if (order.status !== 'DELIVERED')
      throw new ReturnActionError(409, 'Return requests can be recorded after delivery. Contact support for other order issues.')
    return tx.returnRequest.create({ data: { id, userId, orderId, reason }, select: customerReturnFields })
  }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
}
export class ReturnActionError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
export async function reviewReturn(
  store: Pick<PrismaClient, '$transaction'>,
  input: Record<string, unknown>,
) {
  const returnId = typeof input.returnId === 'string' ? input.returnId : '',
    status = input.status,
    resolution = typeof input.resolution === 'string' ? input.resolution.trim() : ''
  if (
    !returnId ||
    !['APPROVED', 'REJECTED'].includes(String(status)) ||
    input.expectedStatus !== 'REQUESTED' ||
    !resolution ||
    resolution.length > 2000
  )
    throw new ReturnActionError(
      400,
      'Select approve or reject and provide a decision reason (up to 2000 characters).',
    )
  return store.$transaction(
    async (tx) => {
      const request = await tx.returnRequest.findUnique({
        where: { id: returnId },
        select: { id: true, userId: true, order: { select: { userId: true } } },
      })
      if (!request || request.userId !== request.order.userId)
        throw new ReturnActionError(
          409,
          'Return unavailable or inconsistent. Review its order before proceeding.',
        )
      const result = await tx.returnRequest.updateMany({
        where: { id: returnId, status: 'REQUESTED' },
        data: { status: status as 'APPROVED' | 'REJECTED', resolution },
      })
      if (result.count !== 1)
        throw new ReturnActionError(
          409,
          'This request was already reviewed. Refresh before trying again.',
        )
      return { id: returnId, status, resolution }
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}
