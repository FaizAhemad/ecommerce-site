import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use POST.', id)
  const body = bodyRecord(request)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80) return sendError(response, 400, 'VALIDATION_ERROR', 'Category name must be between 1 and 80 characters.', id)
  try {
    const existing = await db.category.findUnique({ where: { name } })
    if (existing) return sendError(response, 409, 'CONFLICT', 'That category already exists.', id)
    const last = await db.category.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
    const category = await db.category.create({ data: { name, sortOrder: (last?.sortOrder ?? -1) + 1 } })
    return response.status(201).json({ category: category.name, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Category management is temporarily unavailable.', id) }
}
