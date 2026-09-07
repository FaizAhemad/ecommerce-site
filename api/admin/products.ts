import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') return response.status(200).json({ products: await db.product.findMany({ include: { images: true, colors: true }, orderBy: { createdAt: 'desc' } }), requestId: id })
    if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request); const name = typeof body.name === 'string' ? body.name.trim() : ''; const category = typeof body.category === 'string' ? body.category.trim() : ''; const priceMinor = Number(body.priceMinor); const stock = Number(body.stock)
    if (!name || !category || !Number.isInteger(priceMinor) || priceMinor < 0 || !Number.isInteger(stock) || stock < 0) return sendError(response, 400, 'VALIDATION_ERROR', 'Name, category, price, and stock are required.', id)
    const product = await db.product.create({ data: { id: crypto.randomUUID(), slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`, name, category, priceMinor, stock, description: typeof body.description === 'string' ? body.description : null } })
    return response.status(201).json({ product, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Product management is temporarily unavailable.', id) }
}
