import { db } from '../_lib/db.js'
import { requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

function toProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.priceMinor / 100,
    rating: product.rating,
    reviewCount: product.reviewCount,
    tone: product.colors[0]?.name.toLowerCase() ?? 'sage',
    badge: '',
    colorValues: Object.fromEntries(product.colors.map((color: { name: string; hex: string }) => [color.name, color.hex])),
    colors: product.colors.map((color: { name: string }) => color.name),
    media: {
      images: product.images.map((image: { id: string; url: string; alt: string | null }, index: number) => ({ id: image.id, url: image.url, alt: image.alt ?? product.name, isPrimary: index === 0 })),
      videos: product.videos.map((video: { id: string; url: string; poster: string | null }) => ({ id: video.id, url: video.url, posterUrl: video.poster ?? undefined, alt: product.name })),
    },
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  setCacheControl(response, 'public')
  const productId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'A product id is required.', id)

  try {
    const product = await db.product.findFirst({
      where: { id: productId, isActive: true },
      include: { images: { orderBy: { sortOrder: 'asc' } }, videos: { orderBy: { sortOrder: 'asc' } }, colors: true, reviews: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } } },
    })
    if (!product) return sendError(response, 404, 'NOT_FOUND', 'Product not found.', id)
    return response.status(200).json({ product: toProduct(product), requestId: id })
  } catch {
    return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Product is temporarily unavailable.', id)
  }
}
