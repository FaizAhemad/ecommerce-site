import { db } from './_lib/db.js'

import {
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  setCacheControl(response, 'private')
  if (request.method !== 'GET')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)

  try {
    await db.$queryRaw`SELECT 1`
    return response.status(200).json({ ok: true, database: 'connected' })
  } catch {
    return response.status(503).json({
      ok: false,
      database: 'unavailable',
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'The service is temporarily unavailable.',
        requestId: id,
      },
    })
  }
}
