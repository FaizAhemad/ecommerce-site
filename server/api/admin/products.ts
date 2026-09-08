import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, isSafeHttpUrl, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') return response.status(200).json({ products: await db.product.findMany({ include: { images: true, colors: true, videos: true }, orderBy: { createdAt: 'desc' } }), requestId: id })
    if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request); const name = typeof body.name === 'string' ? body.name.trim() : ''; const category = typeof body.category === 'string' ? body.category.trim() : ''; const priceMinor = Number(body.priceMinor); const stock = Number(body.stock)
    if (!name || !category || !Number.isInteger(priceMinor) || priceMinor < 0 || !Number.isInteger(stock) || stock < 0) return sendError(response, 400, 'VALIDATION_ERROR', 'Name, category, price, and stock are required.', id)
    if (!(await db.category.findUnique({ where: { name: category } }))) return sendError(response, 400, 'VALIDATION_ERROR', 'Select a category from the list.', id)
    const duplicate = await db.product.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } })
    if (duplicate) return sendError(response, 409, 'CONFLICT', 'A product with this name already exists.', id)
    const colors = Array.isArray(body.colors) ? body.colors.filter((item): item is { name: string; hex: string } => typeof item === 'object' && item !== null && typeof item.name === 'string' && typeof item.hex === 'string') : []
    const images = Array.isArray(body.images) ? body.images.filter((item): item is { url: string; alt?: string; sortOrder?: number } => typeof item === 'object' && item !== null && typeof item.url === 'string') : []
    const videos = Array.isArray(body.videos) ? body.videos.filter((item): item is { url: string; poster?: string; sortOrder?: number } => typeof item === 'object' && item !== null && typeof item.url === 'string') : []
    if (images.some(image => !isSafeHttpUrl(image.url) || (image.alt !== undefined && image.alt.length > 200)) || videos.some(video => !isSafeHttpUrl(video.url) || (video.poster !== undefined && !isSafeHttpUrl(video.poster)))) return sendError(response, 400, 'VALIDATION_ERROR', 'Media URLs must use HTTP(S) and safe alt text.', id)
    const product = await db.product.create({ data: { id: crypto.randomUUID(), slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`, name, category, priceMinor, stock, description: typeof body.description === 'string' ? body.description : null, colors: { create: colors.map(color => ({ name: color.name.trim(), hex: color.hex.trim() })) }, images: { create: images.map((image, index) => ({ url: image.url.trim(), alt: image.alt?.trim() || name, sortOrder: Number.isInteger(image.sortOrder) ? image.sortOrder : index })) }, videos: { create: videos.map((video, index) => ({ url: video.url.trim(), poster: video.poster?.trim() || null, sortOrder: Number.isInteger(video.sortOrder) ? video.sortOrder : index })) } }, include: { colors: true, images: true, videos: true } })
    return response.status(201).json({ product, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Product management is temporarily unavailable.', id) }
}
