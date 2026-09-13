import type { Prisma, PrismaClient, TokenPurpose } from '@prisma/client'

type Store = Pick<PrismaClient, '$transaction'>

/** Claim and apply together: failed changes roll back the claim; no automatic replay. */
export async function consumeVerification(
  store: Store,
  lookup: { tokenHash: string; purpose: TokenPurpose; userId?: string },
  apply: (tx: Prisma.TransactionClient, userId: string) => Promise<void>,
) {
  try {
    return await store.$transaction(
      async (tx) => {
        const where = { ...lookup, usedAt: null, expiresAt: { gt: new Date() } }
        const record = await tx.verificationToken.findFirst({
          where,
          select: { id: true, userId: true },
        })
        if (!record) return false
        const claimed = await tx.verificationToken.updateMany({
          where: { ...where, id: record.id, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        })
        if (claimed.count !== 1) return false
        await apply(tx, record.userId)
        return true
      },
      { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034')
      return false
    throw error
  }
}
