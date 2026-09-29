import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { Prisma } from '@prisma/client'
import {
  bodyRecord,
  isSafeHttpUrl,
  setCacheControl,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'
import { AdminGridQueryError, parseAdminGridQuery } from '../_lib/admin-grid-query.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') {
      const query = parseAdminGridQuery(request, {
        defaultSort: 'createdAt',
        sortFields: ['createdAt', 'name', 'category', 'priceMinor', 'compareAtPriceMinor', 'stock', 'isActive'],
        filters: {
          product: { type: 'text' },
          category: { type: 'text', maxLength: 80 },
          price: { type: 'number' },
          originalPrice: { type: 'number' },
          stock: { type: 'number' },
          visibility: { type: 'enum', values: ['published', 'archived'] },
        },
      })
      const and: Prisma.ProductWhereInput[] = [
        { shopOwnership: { is: { shop: { isPlatform: true } } } },
      ]
      const filters = query.filters
      if (filters.product) and.push({ name: { contains: filters.product, mode: 'insensitive' } })
      if (filters.category) and.push({ category: filters.category })
      if (filters.price) and.push({ priceMinor: Math.round(Number(filters.price) * 100) })
      if (filters.originalPrice) and.push({ compareAtPriceMinor: Math.round(Number(filters.originalPrice) * 100) })
      if (filters.stock) and.push({ stock: Number(filters.stock) })
      if (filters.visibility) and.push({ isActive: filters.visibility === 'published' })
      if (query.search) {
        const or: Prisma.ProductWhereInput[] = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
        ]
        if (/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(query.search)) {
          const amount = Math.round(Number(query.search) * 100)
          if (amount <= 2_147_483_647) or.push({ priceMinor: amount })
          if (/^\d+$/.test(query.search)) or.push({ stock: Number(query.search) })
        }
        if (query.search.toLowerCase() === 'published') or.push({ isActive: true })
        if (query.search.toLowerCase() === 'archived') or.push({ isActive: false })
        and.push({ OR: or })
      }
      const where: Prisma.ProductWhereInput = { AND: and }
      const orderBy: Prisma.ProductOrderByWithRelationInput = {
        [query.sortBy]: query.sortDirection,
      }
      const [products, total] = await Promise.all([
        db.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            category: true,
            priceMinor: true,
            shippingFeeMinor: true,
            compareAtPriceMinor: true,
            stock: true,
            isActive: true,
            description: true,
            images: { select: { url: true, alt: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
            colors: { select: { name: true, hex: true } },
            videos: { select: { url: true, poster: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
          },
          orderBy: [orderBy, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        db.product.count({ where }),
      ])
      return response.status(200).json({
        products,
        pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
        requestId: id,
      })
    }
    if (request.method !== 'POST')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const priceMinor = Number(body.priceMinor)
    const shippingFeeMinor = 0
    const compareAtPriceMinor = body.compareAtPriceMinor == null ? null : Number(body.compareAtPriceMinor)
    const stock = Number(body.stock)
    if (
      !name ||
      !category ||
      !Number.isInteger(priceMinor) ||
      priceMinor < 0 || priceMinor > 2147483647 ||
      !Number.isInteger(shippingFeeMinor) || shippingFeeMinor < 0 || shippingFeeMinor > 10000000 ||
      (compareAtPriceMinor !== null && (!Number.isInteger(compareAtPriceMinor) || compareAtPriceMinor <= priceMinor || compareAtPriceMinor > 2147483647)) ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      (body.shippingFeeMinor !== undefined && body.shippingFeeMinor !== null && body.shippingFeeMinor !== 0)
    )
      return sendError(
        response,
        400,
        'VALIDATION_ERROR',
        'Name, category, valid price, and stock are required. Original price must exceed the selling price.',
        id,
      )
    if (!(await db.category.findUnique({ where: { name: category } })))
      return sendError(response, 400, 'VALIDATION_ERROR', 'Select a category from the list.', id)
    const duplicate = await db.product.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    })
    if (duplicate)
      return sendError(response, 409, 'CONFLICT', 'A product with this name already exists.', id)
    const colors = Array.isArray(body.colors)
      ? body.colors.filter(
          (item): item is { name: string; hex: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.name === 'string' &&
            typeof item.hex === 'string',
        )
      : []
    const images = Array.isArray(body.images)
      ? body.images.filter(
          (item): item is { url: string; alt?: string; sortOrder?: number } =>
            typeof item === 'object' && item !== null && typeof item.url === 'string',
        )
      : []
    const videos = Array.isArray(body.videos)
      ? body.videos.filter(
          (item): item is { url: string; poster?: string; sortOrder?: number } =>
            typeof item === 'object' && item !== null && typeof item.url === 'string',
        )
      : []
    if (
      images.some(
        (image) => !isSafeHttpUrl(image.url) || (image.alt !== undefined && image.alt.length > 200),
      ) ||
      videos.some(
        (video) =>
          !isSafeHttpUrl(video.url) || (video.poster !== undefined && !isSafeHttpUrl(video.poster)),
      )
    )
      return sendError(
        response,
        400,
        'VALIDATION_ERROR',
        'Media URLs must use HTTP(S) and safe alt text.',
        id,
      )
    const product = await db.product.create({
      data: {
        id: crypto.randomUUID(),
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        name,
        category,
        priceMinor,
        shippingFeeMinor,
        compareAtPriceMinor,
        stock,
        description: typeof body.description === 'string' ? body.description : null,
        colors: {
          create: colors.map((color) => ({ name: color.name.trim(), hex: color.hex.trim() })),
        },
        images: {
          create: images.map((image, index) => ({
            url: image.url.trim(),
            alt: image.alt?.trim() || name,
            sortOrder: Number.isInteger(image.sortOrder) ? image.sortOrder : index,
          })),
        },
        videos: {
          create: videos.map((video, index) => ({
            url: video.url.trim(),
            poster: video.poster?.trim() || null,
            sortOrder: Number.isInteger(video.sortOrder) ? video.sortOrder : index,
          })),
        },
      },
      include: { colors: true, images: true, videos: true },
    })
    return response.status(201).json({ product, requestId: id })
  } catch (error) {
    if (error instanceof AdminGridQueryError)
      return sendError(response, 400, 'VALIDATION_ERROR', 'Search, filters, sorting or pagination are invalid.', id)
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Product management is temporarily unavailable.',
      id,
    )
  }
}
