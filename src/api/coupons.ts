import { apiFetch } from './http'

export type Coupon = {
  code: string
  type: 'FIXED' | 'PERCENT'
  value: number
  minSubtotalMinor: number
  maxDiscountMinor: number
  startsAt: string
  endsAt: string
  usageLimit: number
  perCustomerLimit: number
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  taxTreatment?: 'BEFORE_TAX' | 'AFTER_TAX'
  version: number
  updatedAt: string
  used?: number
}
export type CouponInput = Omit<Coupon, 'status' | 'version' | 'updatedAt'> & {
  expectedVersion: number
  status?: 'DRAFT' | 'ACTIVE'
  approved?: boolean
}
export async function getCoupons(page: number, signal: AbortSignal) {
  const response = await apiFetch(`/api/admin/coupons?page=${page}`, { signal })
  if (!response.ok) throw new Error('Unable to load coupons.')
  const body = (await response.json()) as { coupons?: Coupon[]; nextPage: number | null }
  if (!Array.isArray(body.coupons)) throw new Error('Unable to confirm coupon data.')
  return { coupons: body.coupons, nextPage: body.nextPage }
}
export async function changeCoupon(
  input: CouponInput | { code: string; expectedVersion: number },
  archive: boolean,
  signal: AbortSignal,
) {
  const response = await apiFetch('/api/admin/coupons', {
    method: archive ? 'DELETE' : 'PUT',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = (await response.json()) as { coupon?: Coupon; error?: { message?: string } }
  if (!response.ok || !body.coupon)
    throw new Error(
      body.error?.message ?? 'Unable to confirm the coupon change. Reload before retrying.',
    )
  return body.coupon
}
