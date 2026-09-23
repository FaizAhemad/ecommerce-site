import type { Prisma } from '@prisma/client'
import { CatalogError, mediaKey } from './seller-catalog.ts'

export type MediaEntry = { id: string; contentType: string; bytes: number; updatedAt: Date; inUse: boolean }
export async function sellerMediaLibrary(tx: Pick<Prisma.TransactionClient, '$queryRaw'>, shopId: string) {
  // Return metadata only. A shop may hold 100 MB of binary data; never load that
  // into an inventory response or return another shop's product references.
  const rows = await tx.$queryRaw<MediaEntry[]>`
    SELECT substring(m."key" from char_length(${`seller-media.${shopId}.`}) + 1) AS "id",
      m."value"::jsonb->>'contentType' AS "contentType", m."updatedAt",
      (length(split_part(m."value"::jsonb->>'data', ',', 2)) / 4 * 3 -
        CASE WHEN m."value"::jsonb->>'data' LIKE '%==' THEN 2 WHEN m."value"::jsonb->>'data' LIKE '%=' THEN 1 ELSE 0 END)::integer AS "bytes",
      (EXISTS (SELECT 1 FROM "StoreSetting" d WHERE starts_with(d."key", ${`seller-product.${shopId}.`})
        AND (d."value"::jsonb->'mediaIds') ? substring(m."key" from char_length(${`seller-media.${shopId}.`}) + 1))
       OR EXISTS (SELECT 1 FROM "ProductImage" i JOIN "ShopProduct" sp ON sp."productId"=i."productId"
         WHERE sp."shopId"=${shopId} AND position('&mediaId=' || substring(m."key" from char_length(${`seller-media.${shopId}.`}) + 1) || '&' in i."url") > 0)
       OR EXISTS (SELECT 1 FROM "ProductVideo" v JOIN "ShopProduct" sp ON sp."productId"=v."productId"
         WHERE sp."shopId"=${shopId} AND position('&mediaId=' || substring(m."key" from char_length(${`seller-media.${shopId}.`}) + 1) || '&' in v."url") > 0)) AS "inUse"
    FROM "StoreSetting" m WHERE starts_with(m."key", ${`seller-media.${shopId}.`})
    ORDER BY m."updatedAt" DESC, m."key" ASC
  `
  return { items: rows, usedFiles: rows.length, usedBytes: rows.reduce((sum, item) => sum + item.bytes, 0), maxFiles: 100, maxFileBytes: 1000000 }
}

export async function deleteUnusedSellerMedia(tx: Pick<Prisma.TransactionClient, '$queryRaw' | 'storeSetting'>, shopId: string, id: string, expectedUpdatedAt: unknown) {
  if (typeof expectedUpdatedAt !== 'string' || !Number.isFinite(Date.parse(expectedUpdatedAt)))
    throw new CatalogError(400, 'Refresh storage before removing an upload.')
  const library = await sellerMediaLibrary(tx, shopId)
  const item = library.items.find(item => item.id === id)
  if (!item) return { deleted: true }
  if (item.inUse) throw new CatalogError(409, 'This upload is attached to a saved or published product. Remove its references before deleting it.')
  if (item.updatedAt.getTime() !== Date.parse(expectedUpdatedAt)) throw new CatalogError(409, 'Upload changed. Refresh storage first.')
  const deleted = await tx.storeSetting.deleteMany({ where: { key: mediaKey(shopId, id), updatedAt: item.updatedAt } })
  if (deleted.count !== 1) throw new CatalogError(409, 'Upload changed. Refresh storage first.')
  return { deleted: true }
}
