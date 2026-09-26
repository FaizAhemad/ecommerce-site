import { requireAdmin } from '../_lib/auth.js'
import { db } from '../_lib/db.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  if (request.method !== 'GET')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)
  try {
    const rows = await db.storeSetting.findMany({
      where: { key: { startsWith: 'audit.' } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })
    const events = rows.map((row) => {
      const event = JSON.parse(row.value) as Record<string, unknown>
      // Normalize existing marketplace audit shapes without exposing draft/reason bodies.
      if (!event.action && row.key.startsWith('audit.seller-product.')) {
        event.action = 'seller-product.reviewed'
        event.resource = event.productId
        event.createdAt = row.updatedAt.toISOString()
      } else if (!event.action && row.key.startsWith('audit.seller.')) {
        event.action = 'seller.reviewed'
        event.resource = event.applicationId
        event.createdAt = event.at
      }
      if (
        !['policy.published', 'coupon.saved', 'coupon.archived', 'shipment.updated', 'shop-dispute.updated', 'inspection.updated', 'seller-product.reviewed', 'seller.reviewed'].includes(String(event.action)) ||
        typeof event.actorId !== 'string' ||
        typeof event.resource !== 'string' ||
        !Number.isSafeInteger(event.version) ||
        typeof event.createdAt !== 'string'
      )
        throw new Error('Invalid audit record')
      return {
        id: row.key.slice(6),
        action: event.action,
        actorId: event.actorId,
        resource: event.resource,
        version: event.version,
        createdAt: event.createdAt,
      }
    })
    return response.status(200).json({ events, requestId: id })
  } catch {
    return sendError(
      response,
      503,
      'AUDIT_UNAVAILABLE',
      'Audit history is temporarily unavailable.',
      id,
    )
  }
}
