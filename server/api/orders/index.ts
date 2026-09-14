import {
  createCartOrder,
  OrderActionError,
  isTransactionConflict,
} from '../_lib/order-transactions.js'
import { db } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'
import { ownedOrderAddress } from '../_lib/order-address.js'
import { orderHistory } from '../_lib/order-history.js'
import {
  bodyRecord,
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const rawPage = request.query?.page ?? '0'
      if (typeof rawPage !== 'string' || !/^\d{1,5}$/.test(rawPage))
        return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid order page.', id)
      const result = await orderHistory(db, user.id, Number(rawPage))
      return response.status(200).json({ ...result, requestId: id })
    }
    if (request.method !== 'POST')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request)
    const address = await ownedOrderAddress(db, user.id, body.addressId)
    if (!address)
      return sendError(response, 400, 'INVALID_ADDRESS', 'Select a valid shipping address.', id)
    const order = await createCartOrder(db, user.id, address.id)
    return response.status(201).json({ order, requestId: id })
  } catch (error) {
    if (error instanceof OrderActionError)
      return sendError(response, error.status, error.code, error.message, id)
    if (isTransactionConflict(error))
      return sendError(
        response,
        409,
        'CONFLICT',
        'Your cart or stock changed. Refresh before placing the order again.',
        id,
      )
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Orders are temporarily unavailable.',
      id,
    )
  }
}
