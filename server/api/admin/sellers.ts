import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { reviewApplication, SellerApplicationError, type SellerApplication } from '../_lib/seller-applications.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const admin = await requireAdmin(request, response), id = requestId(request)
  if (!admin) return
  try {
    if (request.method === 'GET') {
      const page = request.query?.page ?? '0'
      if (typeof page !== 'string' || !/^\d{1,5}$/.test(page)) return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid page.', id)
      const rows = await db.storeSetting.findMany({ where: { key: { startsWith: 'seller-application.' } }, orderBy: [{ updatedAt: 'desc' }, { key: 'asc' }], skip: Number(page) * 25, take: 26 })
      return response.status(200).json({ applications: rows.slice(0,25).map(row => {
        const a = JSON.parse(row.value) as SellerApplication
        return { id: a.id, userId: a.userId, name: a.name, city: a.city, description: a.description, status: a.status, reason: a.reason, version: a.version, updatedAt: a.updatedAt }
      }), nextPage: rows.length > 25 ? Number(page) + 1 : null, requestId: id })
    }
    if (request.method !== 'PATCH') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const application = await reviewApplication(db, admin.id, bodyRecord(request))
    return response.status(200).json({ status: application.status, requestId: id })
  } catch (error) {
    return sendError(response, error instanceof SellerApplicationError ? error.status : 503, 'SELLER_REVIEW_UNAVAILABLE', error instanceof SellerApplicationError ? error.message : 'Unable to confirm the decision. Refresh before retrying.', id)
  }
}
