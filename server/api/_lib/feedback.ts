import type { PrismaClient } from '@prisma/client'

type Feedback = { rating: number; comment: string; createdAt: Date }
type Reader = Pick<PrismaClient, 'order' | '$queryRaw'>
export class FeedbackError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export async function feedbackState(store: Reader, userId: string) {
  const records = await store.$queryRaw<Feedback[]>`SELECT "rating","comment","createdAt" FROM "PurchaseFeedback" WHERE "userId"=${userId}`
  if (records[0]) return { feedback: records[0], order: null }
  const order = await store.order.findFirst({
    where: { userId, payment: { status: { in: ['CAPTURED', 'REFUNDED'] } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, orderNumber: true },
  })
  return { feedback: null, order }
}
export async function saveFeedback(store: Pick<PrismaClient, '$transaction'>, userId: string, input: Record<string, unknown>) {
  const rating = input.rating
  const comment = typeof input.comment === 'string' ? input.comment.trim() : ''
  if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5 || (input.comment !== undefined && typeof input.comment !== 'string') || comment.length > 2000)
    throw new FeedbackError(400, 'Choose a rating from 1 to 5 and keep your comments within 2000 characters.')
  return store.$transaction(async tx => {
    const state = await feedbackState(tx, userId)
    const match = (feedback: Feedback) => {
      if (feedback.rating !== rating || feedback.comment !== comment)
        throw new FeedbackError(409, 'Your first-purchase feedback has already been recorded.')
      return feedback
    }
    if (state.feedback) return match(state.feedback)
    if (!state.order) throw new FeedbackError(409, 'Feedback is available after a recorded paid purchase.')
    await tx.$executeRaw`INSERT INTO "PurchaseFeedback" ("userId","orderId","rating","comment") VALUES (${userId},${state.order.id},${Number(rating)},${comment}) ON CONFLICT ("userId") DO NOTHING`
    const records = await tx.$queryRaw<Feedback[]>`SELECT "rating","comment","createdAt" FROM "PurchaseFeedback" WHERE "userId"=${userId}`
    if (!records[0]) throw new FeedbackError(503, 'Unable to confirm feedback. Please check before trying again.')
    return match(records[0])
  }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
}
