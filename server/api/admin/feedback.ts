import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET.', id)
  try {
    const feedback = await db.$queryRaw`SELECT f."rating",f."comment",f."createdAt",o."orderNumber" FROM "PurchaseFeedback" f JOIN "Order" o ON o."id"=f."orderId" ORDER BY f."createdAt" DESC,f."userId" DESC LIMIT 100`
    return response.status(200).json({ feedback })
  } catch { return sendError(response, 503, 'FEEDBACK_UNAVAILABLE', 'Feedback is temporarily unavailable.', id) }
}
