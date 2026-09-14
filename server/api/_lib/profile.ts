import type { PrismaClient } from '@prisma/client'

export class ProfileError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
export const addressSelect = {
  id: true,
  label: true,
  name: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  phone: true,
  isDefault: true,
} as const
export const profileSelect = {
  name: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
} as const
function text(body: Record<string, unknown>, key: string, max: number, required = true) {
  const value = body[key]
  if (value !== undefined && value !== null && typeof value !== 'string')
    throw new ProfileError(400, 'VALIDATION_ERROR', `Enter a valid ${key}.`)
  const result = typeof value === 'string' ? value.trim() : ''
  if (
    (required && !result) ||
    result.length > max ||
    Array.from(result).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  )
    throw new ProfileError(
      400,
      'VALIDATION_ERROR',
      `Enter a valid ${key} (up to ${max} characters).`,
    )
  return result
}
export function profileInput(body: Record<string, unknown>) {
  const name = text(body, 'name', 100)
  const phone = text(body, 'phone', 16, false)
  if (phone && !/^\+?[1-9]\d{9,14}$/.test(phone))
    throw new ProfileError(400, 'VALIDATION_ERROR', 'Enter a valid phone number with country code.')
  return { name, phone: phone || null }
}
export function addressInput(body: Record<string, unknown>) {
  const country = text(body, 'country', 2).toUpperCase()
  const phone = text(body, 'phone', 16, false)
  if (!/^[A-Z]{2}$/.test(country) || (phone && !/^\+?[1-9]\d{9,14}$/.test(phone)))
    throw new ProfileError(
      400,
      'VALIDATION_ERROR',
      'Use a two-letter country code and a valid phone number.',
    )
  if (body.isDefault !== undefined && typeof body.isDefault !== 'boolean')
    throw new ProfileError(400, 'VALIDATION_ERROR', 'Default address must be true or false.')
  return {
    label: text(body, 'label', 50, false) || null,
    name: text(body, 'name', 100),
    line1: text(body, 'line1', 200),
    line2: text(body, 'line2', 200, false) || null,
    city: text(body, 'city', 100),
    state: text(body, 'state', 100),
    postalCode: text(body, 'postalCode', 20),
    country,
    phone: phone || null,
    isDefault: body.isDefault === true,
  }
}

export async function mutateAddress(
  store: Pick<PrismaClient, '$transaction'>,
  userId: string,
  method: string,
  body: Record<string, unknown>,
) {
  const id = method === 'POST' ? undefined : text(body, 'id', 100)
  const onlyDefault = method === 'PATCH' && body.makeDefault === true
  const data = method === 'DELETE' || onlyDefault ? null : addressInput(body)
  return store.$transaction(
    async (tx) => {
      const existing = id
        ? await tx.address.findFirst({
            where: { id, userId },
            select: { id: true, isDefault: true, _count: { select: { orders: true } } },
          })
        : null
      if (id && !existing) throw new ProfileError(404, 'NOT_FOUND', 'Address not found.')
      if (existing?._count.orders && !onlyDefault)
        throw new ProfileError(
          409,
          'ADDRESS_IN_USE',
          'This address is used by an order. Add a new address instead.',
        )
      if (method === 'DELETE') {
        await tx.address.deleteMany({ where: { id, userId } })
        if (existing?.isDefault) {
          const next = await tx.address.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          })
          if (next)
            await tx.address.updateMany({
              where: { id: next.id, userId },
              data: { isDefault: true },
            })
        }
      } else {
        const first = !(await tx.address.count({ where: { userId } }))
        const isDefault =
          onlyDefault || first || Boolean(existing?.isDefault) || Boolean(data?.isDefault)
        if (isDefault)
          await tx.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          })
        if (id)
          await tx.address.updateMany({
            where: { id, userId },
            data: onlyDefault ? { isDefault: true } : { ...data!, isDefault },
          })
        else await tx.address.create({ data: { ...data!, userId, isDefault } })
      }
      return tx.address.findMany({
        where: { userId },
        select: addressSelect,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      })
    },
    { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
  )
}
