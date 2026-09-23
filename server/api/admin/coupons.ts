import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { saveCoupon, parseCoupon, couponUsagePrefix, CouponError } from '../_lib/coupons.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request),
    admin = await requireAdmin(request, response)
  if (!admin) return
  try {
    if (request.method === 'GET') {
      const page = request.query?.page ?? '0'
      if (typeof page !== 'string' || !/^\d{1,5}$/.test(page))
        throw new CouponError(400, 'Invalid coupon page.')
      const rows = await db.storeSetting.findMany({
        where: { key: { startsWith: 'coupon.' } },
        orderBy: { key: 'asc' },
        skip: Number(page) * 50,
        take: 51,
      })
      const coupons = await Promise.all(rows.slice(0, 50).map(async (row) => {
        const coupon = parseCoupon(row.value)
        if (row.key !== `coupon.${coupon.code}`)
          throw new CouponError(503, 'Stored coupon identity is inconsistent.')
        const used = await db.storeSetting.count({ where: { key: { startsWith: couponUsagePrefix(coupon.code) } } })
        return { ...coupon, used }
      }))
      return response
        .status(200)
        .json({ coupons, nextPage: rows.length > 50 ? Number(page) + 1 : null })
    }
    if (request.method !== 'PUT' && request.method !== 'DELETE')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET, PUT or DELETE.', id)
    const coupon = await saveCoupon(db, admin.id, bodyRecord(request), request.method === 'DELETE')
    return response.status(200).json({ coupon })
  } catch (error) {
    if (error instanceof CouponError)
      return sendError(response, error.status, 'COUPON_REJECTED', error.message, id)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['P2034', 'P2002'].includes(String(error.code))
    )
      return sendError(response, 409, 'CONFLICT', 'Coupon changed. Reload before trying again.', id)
    return sendError(
      response,
      503,
      'COUPONS_UNAVAILABLE',
      'Unable to confirm the coupon change. Reload before retrying.',
      id,
    )
  }
}
