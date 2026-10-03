import { ratingBands } from '../_lib/rating-filter.js'
import { publishedProductWhere, purchaseEligibility, publicSeller } from '../_lib/marketplace-purchases.js'
import type { Prisma } from '@prisma/client'
import { db } from '../_lib/db.js'
import {
  queryValue,
  logApiFailure,
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

const PAGE_SIZE = 24

function toProduct(
  product: Prisma.ProductGetPayload<{ include: { images: true; videos: true; colors: true; shopOwnership: { include: { shop: true } } } }>,
) {
  return {
    id: product.id,
    seller: publicSeller(product.shopOwnership),
    purchase: purchaseEligibility(product.shopOwnership),
    name: product.name,
    description: product.description?.slice(0, 240) ?? null,
    category: product.category,
    priceMinor: product.priceMinor,
    compareAtPriceMinor: product.compareAtPriceMinor,
    stock: product.stock,
    price: product.priceMinor / 100,
    rating: product.rating,
    reviewCount: product.reviewCount,
    tone: product.colors[0]?.name.toLowerCase() ?? 'sage',
    badge: '',
    colorValues: Object.fromEntries(
      product.colors.map((color: { name: string; hex: string }) => [color.name, color.hex]),
    ),
    colors: product.colors.map((color) => color.name),
    media: {
      images: product.images.map((image, index) => ({
        id: image.id,
        url: image.url,
        alt: image.alt ?? product.name,
        isPrimary: index === 0,
      })),
      videos: product.videos.map((video) => ({
        id: video.id,
        url: video.url,
        posterUrl: video.poster ?? undefined,
        alt: product.name,
      })),
    },
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'GET')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  setCacheControl(response, 'private')

  const search = queryValue(request.query?.search)?.trim()
  const category = queryValue(request.query?.category)?.trim()
  const categoryTerms = category?.match(/[\p{L}\p{N}]+/gu) ?? []
  const sort = queryValue(request.query?.sort)
  const cursor = queryValue(request.query?.cursor)
  const colors = queryValue(request.query?.colors)
    ?.split(',')
    .map((color) => color.trim())
    .filter(Boolean)
  const minRating = Number(queryValue(request.query?.minRating))
  const ratings = ratingBands(queryValue(request.query?.ratings))
  if (ratings === null)
    return sendError(response, 400, 'VALIDATION_ERROR', 'Select valid rating bands.', id)

  const filterConditions: Prisma.ProductWhereInput[] = [
    ...categoryTerms.map((term) => ({ category: { contains: term, mode: 'insensitive' as const } })),
    ...(ratings.length
      ? [{ OR: ratings.map((rating) => ({ rating: { gte: rating, lt: rating + 1 } })) }]
      : []),
  ]
  const where: Prisma.ProductWhereInput = {
    ...publishedProductWhere,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(colors?.length
      ? { colors: { some: { name: { in: colors, mode: 'insensitive' } } } }
      : {}),
    ...(filterConditions.length ? { AND: filterConditions } : {}),
    ...(!ratings.length && Number.isFinite(minRating) && minRating > 0
        ? { rating: { gte: minRating, lt: minRating + 1 } }
        : {}),
  }

  try {
    const products = await db.product.findMany({
      where,
      include: {
        shopOwnership: { include: { shop: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        videos: { orderBy: { sortOrder: 'asc' } },
        colors: true,
      },
      orderBy:
        sort === 'price-low'
          ? { priceMinor: 'asc' }
          : sort === 'price-high'
            ? { priceMinor: 'desc' }
            : { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE + 1,
    })
    const hasMore = products.length > PAGE_SIZE
    const page = hasMore ? products.slice(0, PAGE_SIZE) : products
    return response.status(200).json({
      products: page.map(toProduct),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
      requestId: id,
    })
  } catch (error) {
    logApiFailure(error, id, 'products')
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Products are temporarily unavailable.',
      id,
    )
  }
}
