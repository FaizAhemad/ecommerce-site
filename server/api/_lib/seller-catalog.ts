import { UUID_V4_PATTERN } from './validation-patterns.ts'

export type SellerDraft = {
  id: string; shopId: string; shopName: string; name: string; description: string; category: string;
  priceMinor: number; compareAtPriceMinor?: number | null; stock: number; mediaIds: string[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  version: number; reason: string; updatedAt: string;
  publishedStock?: number;
  offerVersion?: number;
  offer?: { status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED'; type: 'FIXED_PER_UNIT' | 'PERCENTAGE'; value: number; version: number; proposedAt: string; responseAt?: string; acceptedVersion?: number | null };
}
export type SellerOffer = NonNullable<SellerDraft['offer']>
export class CatalogError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export const validId = (value: unknown): value is string => typeof value === 'string' && UUID_V4_PATTERN.test(value)
export const draftKey = (shopId: string, id: string) => `seller-product.${shopId}.${id}`
export const mediaKey = (shopId: string, id: string) => `seller-media.${shopId}.${id}`
export function proposeSellerOffer(previous: SellerOffer | undefined, type: unknown, value: unknown, proposedAt: string, previousVersion = 0): SellerOffer {
  if (!['FIXED_PER_UNIT','PERCENTAGE'].includes(String(type)) || !Number.isSafeInteger(value) || Number(value) < 1 ||
    (type === 'FIXED_PER_UNIT' && Number(value) > 1000000000) || (type === 'PERCENTAGE' && Number(value) > 10000))
    throw new CatalogError(400, 'Enter a fixed fee per unit or a percentage from 0.01% to 100%.')
  return { status: 'PROPOSED', type: type as SellerOffer['type'], value: Number(value), version: Math.max(previous?.version ?? 0, previousVersion) + 1, proposedAt, responseAt: undefined, acceptedVersion: null }
}
export function respondToSellerOffer(offer: SellerOffer | undefined, expectedVersion: unknown, decision: 'ACCEPTED' | 'REJECTED', responseAt: string): SellerOffer {
  if (!offer || offer.status !== 'PROPOSED' || expectedVersion !== offer.version)
    throw new CatalogError(409, 'This fee offer has changed. Refresh the product and review the latest terms.')
  return { ...offer, status: decision, responseAt, acceptedVersion: decision === 'ACCEPTED' ? offer.version : null }
}
export function draftInput(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const priceMinor = body.priceMinor, compareAtPriceMinor = body.compareAtPriceMinor == null ? null : body.compareAtPriceMinor, stock = body.stock
  if (!validId(body.id) || !validId(body.shopId) || name.length < 2 || name.length > 120 || description.length < 10 || description.length > 4000 ||
    !category || category.length > 100 || typeof priceMinor !== 'number' || !Number.isSafeInteger(priceMinor) || priceMinor < 100 || priceMinor > 100000000 ||
    (compareAtPriceMinor !== null && (typeof compareAtPriceMinor !== 'number' || !Number.isSafeInteger(compareAtPriceMinor) || compareAtPriceMinor <= priceMinor || compareAtPriceMinor > 100000000)) ||
    typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0 || stock > 1000000 || !Array.isArray(body.mediaIds) || body.mediaIds.length > 10 || !body.mediaIds.every(validId))
    throw new CatalogError(400, 'Enter a valid product name, description, category, price and whole-number stock; attach no more than 10 photos or videos.')
  return { id: body.id, shopId: body.shopId, name, description, category, priceMinor, compareAtPriceMinor, stock, mediaIds: [...new Set(body.mediaIds as string[])] }
}
