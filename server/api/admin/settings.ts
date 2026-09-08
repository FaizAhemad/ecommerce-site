import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') return response.status(200).json({ settings: await db.storeSetting.findMany({ orderBy: { key: 'asc' } }), requestId: id })
    if (request.method !== 'PUT') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PUT.', id)
    const values = bodyRecord(request); const entries = Object.entries(values).filter(([, value]) => typeof value === 'string')
    await db.$transaction(entries.map(([key, value]) => db.storeSetting.upsert({ where: { key }, create: { key, value: value as string }, update: { value: value as string } })))
    return response.status(200).json({ settings: await db.storeSetting.findMany({ orderBy: { key: 'asc' } }), requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Settings are temporarily unavailable.', id) }
}
