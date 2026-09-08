import type { Prisma } from '@prisma/client'
import { db } from '../_lib/db.js'
import { queryValue, requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

const PAGE_SIZE = 24

function toProduct(product: Prisma.ProductGetPayload<{ include: { images: true; videos: true; colors: true } }>) {
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
    colors: product.colors.map((color) => color.name),
    media: {
      images: product.images.map((image, index) => ({ id: image.id, url: image.url, alt: image.alt ?? product.name, isPrimary: index === 0 })),
      videos: product.videos.map((video) => ({ id: video.id, url: video.url, posterUrl: video.poster ?? undefined, alt: product.name })),
    },
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  setCacheControl(response, 'public')

  const search = queryValue(request.query?.search)?.trim()
  const category = queryValue(request.query?.category)?.trim()
  const sort = queryValue(request.query?.sort)
  const cursor = queryValue(request.query?.cursor)
  const colors = queryValue(request.query?.colors)?.split(',').map((color) => color.trim()).filter(Boolean)
  const minRating = Number(queryValue(request.query?.minRating))

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(category ? { category } : {}),
    ...(colors?.length ? { colors: { some: { name: { in: colors } } } } : {}),
    ...(Number.isFinite(minRating) && minRating > 0 ? { rating: { gte: minRating, lt: minRating + 1 } } : {}),
  }

  try {
    const products = await db.product.findMany({
      where,
      include: { images: { orderBy: { sortOrder: 'asc' } }, videos: { orderBy: { sortOrder: 'asc' } }, colors: true },
      orderBy: sort === 'price-low' ? { priceMinor: 'asc' } : sort === 'price-high' ? { priceMinor: 'desc' } : { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE + 1,
    })
    const hasMore = products.length > PAGE_SIZE
    const page = hasMore ? products.slice(0, PAGE_SIZE) : products
    return response.status(200).json({ products: page.map(toProduct), nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null, requestId: id })
  } catch {
    return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Products are temporarily unavailable.', id)
  }
}
