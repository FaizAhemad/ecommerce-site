import { db } from '../../_lib/db.js'
import { requireAdmin } from '../../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  const productId = Array.isArray(request.query?.id) ? request.query?.id[0] : request.query?.id
  if (!productId) return sendError(response, 400, 'VALIDATION_ERROR', 'Product id is required.', id)
  try {
    if (request.method === 'DELETE') { await db.product.update({ where: { id: productId }, data: { isActive: false } }); return response.status(204).json(null) }
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use PATCH or DELETE.', id)
    const body = bodyRecord(request); const data: { name?: string; category?: string; description?: string; priceMinor?: number; stock?: number; isActive?: boolean } = {}
    if (typeof body.name === 'string') data.name = body.name.trim(); if (typeof body.category === 'string') data.category = body.category.trim(); if (typeof body.description === 'string') data.description = body.description; if (Number.isInteger(body.priceMinor)) data.priceMinor = Number(body.priceMinor); if (Number.isInteger(body.stock)) data.stock = Number(body.stock); if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    const product = await db.product.update({ where: { id: productId }, data }); return response.status(200).json({ product, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Product update is temporarily unavailable.', id) }
}
