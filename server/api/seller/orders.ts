import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response), id = requestId(request)
  if (!user) return
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET.', id)
  const page = request.query?.page ?? '0'
  if (typeof page !== 'string' || !/^\d{1,5}$/.test(page)) return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid page.', id)
  try {
    const items = await db.$queryRaw<{ id: string; orderNumber: string; shopName: string; productName: string; quantity: number; unitPriceMinor: number; currency: string; status: string; createdAt: Date }[]>`
      SELECT oi."id", o."orderNumber", so."shopName", oi."productName", oi."quantity", oi."unitPriceMinor", o."currency", o."status", o."createdAt"
      FROM "ShopOrderItem" so JOIN "OrderItem" oi ON oi."id"=so."orderItemId"
      JOIN "Order" o ON o."id"=oi."orderId" JOIN "Shop" s ON s."id"=so."shopId"
      JOIN "ShopMembership" m ON m."shopId"=s."id"
      WHERE m."userId"=${user.id} AND m."status"='ACTIVE' AND s."status"='APPROVED' AND s."isPlatform"=FALSE
      ORDER BY o."createdAt" DESC, oi."id" ASC LIMIT 21 OFFSET ${Number(page) * 20}
    `
    return response.status(200).json({ items: items.slice(0,20), nextPage: items.length > 20 ? Number(page) + 1 : null })
  } catch { return sendError(response, 503, 'SELLER_ORDERS_UNAVAILABLE', 'Shop order records are unavailable.', id) }
}
