import { randomUUID, createHash } from 'node:crypto'
import type { PrismaClient, Prisma } from '@prisma/client'

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
}
export class CouponError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
function integer(value: unknown, min: number, max: number): value is number {
  return Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= max
}
export function couponCode(value: unknown) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code))
    throw new CouponError(
      400,
      'Use a coupon code of 3–32 letters, numbers, hyphens or underscores.',
    )
  return code
}
function couponFields(
  input: Record<string, unknown>,
): Omit<Coupon, 'status' | 'version' | 'updatedAt'> {
  const code = couponCode(input.code)
  const type = input.type
  if (type !== 'FIXED' && type !== 'PERCENT')
    throw new CouponError(400, 'Choose a fixed amount or percentage discount.')
  if (
    !integer(input.value, 1, type === 'PERCENT' ? 10000 : 10000000) ||
    !integer(input.minSubtotalMinor, 0, 100000000) ||
    !integer(input.maxDiscountMinor, 1, 10000000) ||
    (type === 'FIXED' && input.maxDiscountMinor !== input.value) ||
    !integer(input.usageLimit, 1, 1000000) ||
    !integer(input.perCustomerLimit, 1, Number(input.usageLimit))
  )
    throw new CouponError(
      400,
      'Provide valid discount amounts, a discount cap and usage limits. Customer usage cannot exceed the total limit.',
    )
  const timestamp = (value: unknown) =>
    typeof value === 'string' &&
    /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  if (
    !timestamp(input.startsAt) ||
    !timestamp(input.endsAt) ||
    Date.parse(String(input.endsAt)) <= Date.parse(String(input.startsAt))
  )
    throw new CouponError(400, 'Provide valid start and end times, with the end after the start.')
  return {
    code,
    ...(input.taxTreatment === 'BEFORE_TAX' || input.taxTreatment === 'AFTER_TAX'
      ? { taxTreatment: input.taxTreatment } : {}),
    type,
    value: input.value,
    minSubtotalMinor: input.minSubtotalMinor,
    maxDiscountMinor: input.maxDiscountMinor,
    usageLimit: input.usageLimit,
    perCustomerLimit: input.perCustomerLimit,
    startsAt: new Date(String(input.startsAt)).toISOString(),
    endsAt: new Date(String(input.endsAt)).toISOString(),
  }
}
export function parseCoupon(value: string): Coupon {
  try {
    const input = JSON.parse(value) as Record<string, unknown>
    const fields = couponFields(input)
    if (
      !integer(input.version, 1, Number.MAX_SAFE_INTEGER - 1) ||
      !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(String(input.status)) ||
      (input.status === 'ACTIVE' && !fields.taxTreatment) ||
      typeof input.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(input.updatedAt))
    )
      throw new Error('Invalid coupon state')
    return { ...fields, status: input.status as Coupon['status'], version: input.version, updatedAt: input.updatedAt }
  } catch {
    throw new CouponError(
      503,
      'Stored coupon data is unavailable. Review the record before changing it.',
    )
  }
}
export async function saveCoupon(
  store: Pick<PrismaClient, '$transaction'>,
  actorId: string,
  input: Record<string, unknown>,
  archive = false,
) {
  const code = couponCode(input.code)
  if (!integer(input.expectedVersion, 0, Number.MAX_SAFE_INTEGER - 2))
    throw new CouponError(400, 'Reload coupons before saving.')
  const fields = archive ? null : couponFields(input)
  if (!archive && input.status !== undefined && input.status !== 'DRAFT' && input.status !== 'ACTIVE')
    throw new CouponError(400, 'Choose draft or active status.')
  if (!archive && input.status === 'ACTIVE' && (!fields?.taxTreatment || input.approved !== true))
    throw new CouponError(400, 'Approve the coupon terms and choose the tax treatment before activation.')
  if (!archive && input.status === 'ACTIVE' && Date.parse(fields!.endsAt) <= Date.now())
    throw new CouponError(400, 'The activation end time must be in the future.')
  return store.$transaction(
    async (tx) => {
      const key = `coupon.${code}`
      const record = await tx.storeSetting.findUnique({ where: { key } })
      const current = record ? parseCoupon(record.value) : null
      if (current && current.code !== code)
        throw new CouponError(503, 'Coupon identity is inconsistent.')
      if ((current?.version ?? 0) !== input.expectedVersion)
        throw new CouponError(
          409,
          'This coupon already exists or changed. Reload the list before trying again.',
        )
      if (archive && !current) throw new CouponError(404, 'Coupon not found.')
      if (current?.status === 'ARCHIVED')
        throw new CouponError(409, 'Archived coupon codes cannot be reused.')
      const next: Coupon = {
        ...(archive ? current! : fields!),
        status: archive ? 'ARCHIVED' : input.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
        version: (current?.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      }
      await tx.storeSetting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(next) },
        update: { value: JSON.stringify(next) },
      })
      await tx.storeSetting.create({
        data: {
          key: `coupon-history.${code}.${next.version}`,
          value: JSON.stringify({ ...next, actorId }),
        },
      })
      await tx.storeSetting.create({
        data: {
          key: `audit.${randomUUID()}`,
          value: JSON.stringify({
            action: archive ? 'coupon.archived' : 'coupon.saved',
            actorId,
            resource: key,
            version: next.version,
            createdAt: next.updatedAt,
          }),
        },
      })
      return next
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}

// These private immutable records share the order's serializable transaction.
// Usage is consumed on order creation, including unpaid/cancelled/refunded orders.
export function couponUsagePrefix(code: string, userId?: string) {
  return `coupon-use.${code}.` + (userId ? createHash('sha256').update(userId).digest('hex') + '.' : '')
}
export async function quoteCoupon(
  store: Pick<Prisma.TransactionClient, 'storeSetting'>,
  userId: string,
  input: unknown,
  subtotalMinor: number,
) {
  const code = couponCode(input)
  const record = await store.storeSetting.findUnique({ where: { key: `coupon.${code}` } })
  if (!record) throw new CouponError(409, 'This coupon is unavailable.')
  const coupon = parseCoupon(record.value)
  const now = Date.now()
  if (coupon.code !== code || coupon.status !== 'ACTIVE' || now < Date.parse(coupon.startsAt) || now >= Date.parse(coupon.endsAt))
    throw new CouponError(409, 'This coupon is not currently available.')
  if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor < coupon.minSubtotalMinor)
    throw new CouponError(409, 'Your items subtotal does not meet the coupon minimum.')
  const total = await store.storeSetting.count({ where: { key: { startsWith: couponUsagePrefix(code) } } })
  const customer = await store.storeSetting.count({ where: { key: { startsWith: couponUsagePrefix(code, userId) } } })
  if (total >= coupon.usageLimit || customer >= coupon.perCustomerLimit)
    throw new CouponError(409, 'This coupon usage limit has been reached.')
  const discountMinor = Math.min(subtotalMinor, coupon.maxDiscountMinor,
    coupon.type === 'FIXED' ? coupon.value : Math.floor(subtotalMinor * coupon.value / 10000))
  if (discountMinor < 1) throw new CouponError(409, 'This coupon does not discount the current cart.')
  return { code, version: coupon.version, discountMinor, taxTreatment: coupon.taxTreatment! }
}
