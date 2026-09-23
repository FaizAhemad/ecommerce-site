import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { requestReturn, customerReturnFields, ReturnActionError } from './_lib/returns.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const orderId = request.query?.orderId
      if (typeof orderId !== 'string' || !orderId || orderId.length > 128)
        throw new ReturnActionError(400, 'Select an order.')
      const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, select: { status: true } })
      if (!order) throw new ReturnActionError(404, 'Order not found.')
      const returns = await db.returnRequest.findMany({
        where: { orderId, userId: user.id, order: { userId: user.id } },
        select: customerReturnFields, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100,
      })
      return response.status(200).json({ returns, canRequest: order.status === 'DELIVERED' && returns.length === 0 })
    }
    if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const item = await requestReturn(db, user.id, bodyRecord(request))
    return response.status(200).json({ return: item })
  } catch (error) {
    if (error instanceof ReturnActionError) return sendError(response, error.status, 'RETURN_REJECTED', error.message, id)
    if (error && typeof error === 'object' && 'code' in error && ['P2034', 'P2002'].includes(String(error.code)))
      return sendError(response, 409, 'CONFLICT', 'The order or return changed. Refresh return status before retrying.', id)
    return sendError(response, 503, 'RETURN_UNAVAILABLE', 'Unable to confirm the request. Check return status before retrying.', id)
  }
}
