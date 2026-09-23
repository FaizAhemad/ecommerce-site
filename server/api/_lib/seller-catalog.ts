export type SellerDraft = {
  id: string; shopId: string; shopName: string; name: string; description: string; category: string;
  priceMinor: number; stock: number; mediaIds: string[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  version: number; reason: string; updatedAt: string;
  publishedStock?: number;
}
export class CatalogError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)
export const draftKey = (shopId: string, id: string) => `seller-product.${shopId}.${id}`
export const mediaKey = (shopId: string, id: string) => `seller-media.${shopId}.${id}`
export function draftInput(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const priceMinor = body.priceMinor, stock = body.stock
  if (!validId(body.id) || !validId(body.shopId) || name.length < 2 || name.length > 120 || description.length < 10 || description.length > 4000 ||
    !category || category.length > 100 || typeof priceMinor !== 'number' || !Number.isSafeInteger(priceMinor) || priceMinor < 100 || priceMinor > 100000000 ||
    typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0 || stock > 1000000 || !Array.isArray(body.mediaIds) || body.mediaIds.length > 3 || !body.mediaIds.every(validId))
    throw new CatalogError(400, 'Check product name, description, category, price, stock and up to three attachments.')
  return { id: body.id, shopId: body.shopId, name, description, category, priceMinor, stock, mediaIds: [...new Set(body.mediaIds as string[])] }
}
