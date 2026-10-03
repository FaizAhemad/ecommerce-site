import type { Prisma } from '@prisma/client'

// Missing ownership is not permission to sell. Requires the marketplace backfill.
export const publishedProductWhere = {
  isActive: true,
  shopOwnership: { is: { moderationStatus: 'APPROVED', shop: { status: 'APPROVED' } } },
} satisfies Prisma.ProductWhereInput

export type PublicShop = { id: string; name: string; slug: string; isPlatform: boolean; status: string; gstReviewStatus?: string }
export function purchaseEligibility(ownership: { moderationStatus: string; shop: PublicShop; offerStatus?: string; offerVersion?: number; acceptedOfferVersion?: number | null } | null) {
  if (!ownership || ownership.moderationStatus !== 'APPROVED' || ownership.shop.status !== 'APPROVED')
    return { available: false, reason: 'This product is currently unavailable.' }
  if (!ownership.shop.isPlatform && ownership.shop.gstReviewStatus !== 'APPROVED')
    return { available: false, reason: 'The shop’s tax details are awaiting review.' }
  if (!ownership.shop.isPlatform && (ownership.offerStatus !== 'ACCEPTED' || ownership.acceptedOfferVersion !== ownership.offerVersion))
    return { available: false, reason: 'This item is waiting for the shop to accept Gadgify’s fee offer.' }
  return { available: true, reason: null }
}

export function publicSeller(ownership: { shop: PublicShop } | null) {
  return ownership ? { isPlatform: ownership.shop.isPlatform } : null
}

export const sellerProductId = (shopId: string, draftId: string) => `seller-${shopId}-${draftId}`
