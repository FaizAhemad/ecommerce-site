import type { PrismaClient, Prisma } from '@prisma/client'

type Store = Pick<PrismaClient | Prisma.TransactionClient, '$queryRaw'>
export class ShopAccessError extends Error {
  readonly status = 403
  readonly code = 'SHOP_ACCESS_DENIED'
  constructor() { super('Approved shop access is required.') }
}
export type ShopScope = { id: string; name: string; slug: string }

/** userId must come from requireUser, never a submitted body/query parameter. */
export async function approvedShop(store: Store, userId: string, shopId: string): Promise<ShopScope> {
  if (!userId || !shopId || userId.length > 100 || shopId.length > 100) throw new ShopAccessError()
  const rows = await store.$queryRaw<ShopScope[]>`
    SELECT s."id", s."name", s."slug" FROM "Shop" s
    JOIN "ShopMembership" m ON m."shopId" = s."id"
    WHERE s."id" = ${shopId} AND m."userId" = ${userId}
      AND s."status" = 'APPROVED' AND m."status" = 'ACTIVE' AND s."isPlatform" = FALSE
    LIMIT 1
  `
  if (rows.length !== 1) throw new ShopAccessError()
  return rows[0]
}

// Read scope and ownership in the SAME statement: do not trust an earlier access check
// followed by an unscoped product lookup. Missing ownership never falls back to public data.
export async function ownedShopProduct(store: Store, userId: string, shopId: string, productId: string) {
  if (!userId || !shopId || !productId || [userId, shopId, productId].some(value => value.length > 100)) throw new ShopAccessError()
  const rows = await store.$queryRaw<{ id: string; name: string; stock: number; priceMinor: number; moderationStatus: string }[]>`
    SELECT p."id", p."name", p."stock", p."priceMinor", sp."moderationStatus"
    FROM "Product" p
    JOIN "ShopProduct" sp ON sp."productId" = p."id"
    JOIN "Shop" s ON s."id" = sp."shopId"
    JOIN "ShopMembership" m ON m."shopId" = s."id"
    WHERE p."id" = ${productId} AND s."id" = ${shopId} AND m."userId" = ${userId}
      AND s."status" = 'APPROVED' AND m."status" = 'ACTIVE' AND s."isPlatform" = FALSE
    LIMIT 1
  `
  if (rows.length !== 1) throw new ShopAccessError()
  return rows[0]
}
