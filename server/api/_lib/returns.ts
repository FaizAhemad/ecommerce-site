import type { PrismaClient } from '@prisma/client'
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
