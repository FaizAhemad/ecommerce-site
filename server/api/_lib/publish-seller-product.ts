import type { Prisma } from '@prisma/client'
import { CatalogError, mediaKey, type SellerDraft } from './seller-catalog.js'
import { sellerProductId } from './marketplace-purchases.js'
import { validateMediaUpload } from './media.js'

export async function publishSellerProduct(tx: Prisma.TransactionClient, draft: SellerDraft) {
  const id = sellerProductId(draft.shopId, draft.id)
  const existing = await tx.product.findUnique({ where: { id }, include: { shopOwnership: true } })
  if (existing && existing.shopOwnership?.shopId !== draft.shopId)
    throw new CatalogError(409, 'Product ownership is inconsistent. Contact support.')
  if (draft.status !== 'APPROVED') {
    if (existing) {
      await tx.product.update({ where: { id }, data: { isActive: false } })
      await tx.shopProduct.update({ where: { productId: id }, data: { moderationStatus: draft.status === 'REJECTED' ? 'REJECTED' : 'DRAFT' } })
    }
    return
  }
  const images: { url: string; alt: string; sortOrder: number }[] = []
  const videos: { url: string; sortOrder: number }[] = []
  const shop = await tx.shop.findUnique({ where: { id: draft.shopId }, select: { slug: true, status: true } })
  if (!shop || shop.status !== 'APPROVED') throw new CatalogError(409, 'Shop is unavailable.')
  for (const mediaId of draft.mediaIds) {
    const row = await tx.storeSetting.findUnique({ where: { key: mediaKey(draft.shopId, mediaId) } })
    const media = row ? JSON.parse(row.value) as { data: string; contentType: string } : null
    if (!media || !validateMediaUpload(media.data, media.contentType, 1000000))
      throw new CatalogError(409, 'Product media is unavailable or invalid. Request a revised draft.')
    const url = `/api/shops?slug=${encodeURIComponent(shop.slug)}&productId=${encodeURIComponent(draft.id)}&mediaId=${encodeURIComponent(mediaId)}&raw=1`
    if (media.contentType.startsWith('image/')) images.push({ url, alt: draft.name, sortOrder: images.length })
    else videos.push({ url, sortOrder: videos.length })
  }
  const fields = { name: draft.name, description: draft.description, category: draft.category, priceMinor: draft.priceMinor, compareAtPriceMinor: draft.compareAtPriceMinor ?? null, stock: draft.stock, isActive: true }
  if (existing) {
    // Approval is not a stock replenishment. Preserve reservations made since publication.
    const stock = existing.stock + draft.stock - (draft.publishedStock ?? existing.stock)
    if (!Number.isSafeInteger(stock) || stock < 0 || stock > 1000000) throw new CatalogError(409, 'Stock adjustment conflicts with existing reservations. Request a revised draft.')
    await tx.product.update({ where: { id }, data: { ...fields, stock } })
    await tx.productImage.deleteMany({ where: { productId: id } })
    await tx.productVideo.deleteMany({ where: { productId: id } })
  } else {
    await tx.product.create({ data: { id, slug: id, ...fields, currency: 'INR' } })
  }
  // The compatibility trigger initially assigns new products to Gadgify; replace it
  // inside this transaction before the product can become visible to another request.
  await tx.shopProduct.upsert({ where: { productId: id }, create: { productId: id, shopId: draft.shopId, moderationStatus: 'APPROVED' }, update: { shopId: draft.shopId, moderationStatus: 'APPROVED' } })
  if (images.length) await tx.productImage.createMany({ data: images.map(image => ({ ...image, productId: id })) })
  if (videos.length) await tx.productVideo.createMany({ data: videos.map(video => ({ ...video, productId: id })) })
}
