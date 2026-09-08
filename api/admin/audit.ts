import { requireAdmin } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) { const id = requestId(request); if (!(await requireAdmin(request, response))) return; if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id); return response.status(200).json({ events: [], requestId: id }) }
