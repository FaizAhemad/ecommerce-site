import { db } from '../../_lib/db.js'
import { requireAdmin } from '../../_lib/auth.js'
import { bodyRecord, isSafeHttpUrl, requestId, sendError, type VercelRequest, type VercelResponse } from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  const productId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'Product id is required.', id)
  try {
    if (request.method === 'DELETE') { await db.product.update({ where: { id: productId }, data: { isActive: false } }); return response.status(204).json(null) }
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use PATCH or DELETE.', id)
    const body = bodyRecord(request); const data: { name?: string; category?: string; description?: string; priceMinor?: number; stock?: number; isActive?: boolean } = {}
    if (typeof body.name === 'string') data.name = body.name.trim(); if (typeof body.category === 'string') data.category = body.category.trim(); if (typeof body.description === 'string') data.description = body.description; if (Number.isInteger(body.priceMinor)) data.priceMinor = Number(body.priceMinor); if (Number.isInteger(body.stock)) data.stock = Number(body.stock); if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if ((body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) || (body.category !== undefined && (typeof body.category !== 'string' || !body.category.trim())) || (body.priceMinor !== undefined && (!Number.isInteger(body.priceMinor) || Number(body.priceMinor) < 0)) || (body.stock !== undefined && (!Number.isInteger(body.stock) || Number(body.stock) < 0))) return sendError(response, 400, 'VALIDATION_ERROR', 'Valid name, category, non-negative price and stock are required.', id)
    if (data.category !== undefined && !(await db.category.findUnique({ where: { name: data.category } }))) return sendError(response, 400, 'VALIDATION_ERROR', 'Select a category from the list.', id)
    if (data.name) {
      const duplicate = await db.product.findFirst({ where: { id: { not: productId }, name: { equals: data.name, mode: 'insensitive' } }, select: { id: true } })
      if (duplicate) return sendError(response, 409, 'CONFLICT', 'A product with this name already exists.', id)
    }
    const colors = Array.isArray(body.colors) ? body.colors.filter((item): item is { name: string; hex: string } => typeof item === 'object' && item !== null && typeof item.name === 'string' && typeof item.hex === 'string') : null
    if (colors && (colors.some(color => !color.name.trim() || !/^#[0-9a-f]{6}$/i.test(color.hex.trim())) || new Set(colors.map(color => color.name.trim())).size !== colors.length)) return sendError(response, 400, 'VALIDATION_ERROR', 'Colors need unique names and six-digit hex values.', id)
    const mediaImages = Array.isArray(body.images) ? body.images.filter((item): item is { url: string; alt?: string; sortOrder?: number } => typeof item === 'object' && item !== null && typeof item.url === 'string') : null
    const mediaVideos = Array.isArray(body.videos) ? body.videos.filter((item): item is { url: string; poster?: string; sortOrder?: number } => typeof item === 'object' && item !== null && typeof item.url === 'string') : null
    if (mediaImages?.some(image => !isSafeHttpUrl(image.url) || (image.alt !== undefined && image.alt.length > 200)) || mediaVideos?.some(video => !isSafeHttpUrl(video.url) || (video.poster !== undefined && !isSafeHttpUrl(video.poster)))) return sendError(response, 400, 'VALIDATION_ERROR', 'Media URLs must use HTTP(S) and safe alt text.', id)
    const product = await db.$transaction(async transaction => { const updated = await transaction.product.update({ where: { id: productId }, data }); if (colors) { await transaction.productColor.deleteMany({ where: { productId } }); if (colors.length) await transaction.productColor.createMany({ data: colors.map(color => ({ productId, name: color.name.trim(), hex: color.hex.trim() })) }) } if (mediaImages) { await transaction.productImage.deleteMany({ where: { productId } }); await transaction.productImage.createMany({ data: mediaImages.map((image, index) => ({ productId, url: image.url, alt: image.alt ?? updated.name, sortOrder: Number.isInteger(image.sortOrder) ? image.sortOrder as number : index })) }) } if (mediaVideos) { await transaction.productVideo.deleteMany({ where: { productId } }); await transaction.productVideo.createMany({ data: mediaVideos.map((video, index) => ({ productId, url: video.url, poster: video.poster ?? null, sortOrder: Number.isInteger(video.sortOrder) ? video.sortOrder as number : index })) }) } return transaction.product.findUnique({ where: { id: productId }, include: { images: true, videos: true, colors: true } }) }); return response.status(200).json({ product, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Product update is temporarily unavailable.', id) }
}
