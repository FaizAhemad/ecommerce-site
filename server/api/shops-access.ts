import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET.', id)
  const user = await requireUser(request, response)
  if (!user) return
  if (user.role === 'ADMIN') return response.status(200).json({ allowed: true })
  try {
    const rows = await db.$queryRaw<{ allowed: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM "Shop" s
        JOIN "ShopMembership" m ON m."shopId" = s."id"
        WHERE m."userId" = ${user.id} AND m."status" = 'ACTIVE'
          AND s."status" = 'APPROVED' AND s."isPlatform" = FALSE
      ) AS "allowed"
    `
    return response.status(200).json({ allowed: rows[0]?.allowed === true })
  } catch {
    return sendError(response, 503, 'SHOP_ACCESS_UNAVAILABLE', 'Shop access is temporarily unavailable.', id)
  }
}
