import { db } from './_lib/db.js'
import { requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET.', id)
  try {
    setCacheControl(response, 'public')
    const categories = await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { name: true } })
    return response.status(200).json({ categories: categories.map(category => category.name), requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Categories are temporarily unavailable.', id) }
}
