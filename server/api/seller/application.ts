import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { applicationKey, submitApplication, updateGstProfile, SellerApplicationError, type SellerApplication } from '../_lib/seller-applications.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response), id = requestId(request)
  if (!user) return
  try {
    let application: SellerApplication | null
    if (request.method === 'GET') {
      const row = await db.storeSetting.findUnique({ where: { key: applicationKey(user.id) } })
      application = row ? JSON.parse(row.value) as SellerApplication : null
    } else if (request.method === 'POST') {
      const body = bodyRecord(request)
      application = body.action === 'update_gst' ? await updateGstProfile(db, user.id, body) : await submitApplication(db, user.id, body)
    }
    else return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const selected = application && { id: application.id, name: application.name, city: application.city, address: application.address, phone: application.phone, description: application.description, gstRegistered: application.gstRegistered, gstin: application.gstin, gstNotRegisteredReason: application.gstNotRegisteredReason, gstOtherReason: application.gstOtherReason, gstEnrolmentId: application.gstEnrolmentId, gstReviewStatus: application.gstReviewStatus ?? 'PENDING', status: application.status, reason: application.reason, version: application.version, updatedAt: application.updatedAt }
    return response.status(200).json({ application: selected, requestId: id })
  } catch (error) {
    return sendError(response, error instanceof SellerApplicationError ? error.status : 503, 'SELLER_APPLICATION_UNAVAILABLE', error instanceof SellerApplicationError ? error.message : 'Unable to confirm your application. Refresh before retrying.', id)
  }
}
