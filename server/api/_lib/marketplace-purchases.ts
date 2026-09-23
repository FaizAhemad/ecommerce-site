import type { Prisma } from '@prisma/client'

// Missing ownership is not permission to sell. Requires the marketplace backfill.
export const publishedProductWhere = {
  isActive: true,
  shopOwnership: { is: { moderationStatus: 'APPROVED', shop: { status: 'APPROVED' } } },
} satisfies Prisma.ProductWhereInput

export type PublicShop = { id: string; name: string; slug: string; isPlatform: boolean; status: string }
export function purchaseEligibility(ownership: { moderationStatus: string; shop: PublicShop } | null) {
  if (!ownership || ownership.moderationStatus !== 'APPROVED' || ownership.shop.status !== 'APPROVED')
    return { available: false, reason: 'This product is currently unavailable.' }
  if (!ownership.shop.isPlatform)
    return { available: false, reason: 'Ordering from this shop is not available yet.' }
  return { available: true, reason: null }
}

export function publicSeller(ownership: { shop: PublicShop } | null) {
  return ownership ? { name: ownership.shop.name, slug: ownership.shop.slug, isPlatform: ownership.shop.isPlatform } : null
}

export const sellerProductId = (shopId: string, draftId: string) => `seller-${shopId}-${draftId}`
