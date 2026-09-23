import type { PrismaClient } from '@prisma/client'

export type SellerApplication = {
  id: string; userId: string; name: string; city: string; description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  version: number; reason: string; updatedAt: string;
}
export class SellerApplicationError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export const applicationKey = (userId: string) => `seller-application.${userId}`
export function applicationInput(body: Record<string, unknown>) {
  const text = (key: string) => typeof body[key] === 'string' ? body[key].trim() : ''
  const id = text('id'), name = text('name'), city = text('city'), description = text('description')
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id) ||
    name.length < 2 || name.length > 120 || city.length < 2 || city.length > 100 || description.length < 10 || description.length > 2000)
    throw new SellerApplicationError(400, 'Enter a shop name, city and description (10–2000 characters).')
  return { id, name, city, description }
}
type Store = Pick<PrismaClient, '$transaction'>
const transaction = { isolationLevel: 'Serializable' as const, maxWait: 5000, timeout: 10000 }
export async function submitApplication(store: Store, userId: string, body: Record<string, unknown>) {
  const input = applicationInput(body)
  return store.$transaction(async tx => {
    const owner = await tx.user.findUnique({ where: { id: userId }, select: { email: true, emailVerifiedAt: true } })
    if (!owner?.email || !owner.emailVerifiedAt) throw new SellerApplicationError(403, 'Verify your account email before applying.')
    const key = applicationKey(userId)
    const row = await tx.storeSetting.findUnique({ where: { key } })
    const previous = row ? JSON.parse(row.value) as SellerApplication : null
    if (previous?.id === input.id && previous.name === input.name && previous.city === input.city && previous.description === input.description && previous.status !== 'REJECTED') return previous
    if (previous && (previous.status !== 'REJECTED' || body.expectedVersion !== previous.version))
      throw new SellerApplicationError(409, 'Refresh your application before making changes.')
    const application: SellerApplication = { ...input, userId, status: 'PENDING', version: (previous?.version ?? 0) + 1, reason: '', updatedAt: new Date().toISOString() }
    if (row) {
      const saved = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(application) } })
      if (saved.count !== 1) throw new SellerApplicationError(409, 'Application changed. Refresh and try again.')
    } else await tx.storeSetting.create({ data: { key, value: JSON.stringify(application) } })
    return application
  }, transaction)
}
export async function reviewApplication(store: Store, actorId: string, body: Record<string, unknown>) {
  const userId = typeof body.userId === 'string' ? body.userId : ''
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  const status = body.status
  if (!userId || userId.length > 100 || !['APPROVED','REJECTED','SUSPENDED'].includes(String(status)) || reason.length < 3 || reason.length > 1000)
    throw new SellerApplicationError(400, 'Select a decision and give a reason (3–1000 characters).')
  return store.$transaction(async tx => {
    const key = applicationKey(userId), row = await tx.storeSetting.findUnique({ where: { key } })
    if (!row) throw new SellerApplicationError(404, 'Application not found.')
    const previous = JSON.parse(row.value) as SellerApplication
    if (previous.version !== body.expectedVersion) throw new SellerApplicationError(409, 'Application changed. Refresh before reviewing.')
    const allowed = previous.status === 'PENDING' ? ['APPROVED','REJECTED'] : previous.status === 'APPROVED' ? ['SUSPENDED'] : previous.status === 'SUSPENDED' ? ['APPROVED'] : []
    if (!allowed.includes(String(status))) throw new SellerApplicationError(409, 'This decision is not available for the current status.')
    if (status === 'APPROVED') {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } })
      if (!user?.emailVerifiedAt) throw new SellerApplicationError(409, 'Applicant must have a verified email.')
      if (previous.status === 'PENDING') {
        await tx.$executeRaw`INSERT INTO "Shop" ("id","slug","name","status") VALUES (${previous.id},${'shop-' + previous.id},${previous.name},'APPROVED')`
        await tx.$executeRaw`INSERT INTO "ShopMembership" ("shopId","userId","status") VALUES (${previous.id},${userId},'ACTIVE')`
      } else {
        const changed = await tx.$executeRaw`UPDATE "Shop" SET "status"='APPROVED', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "status"='SUSPENDED' AND "isPlatform"=FALSE`
        if (changed !== 1) throw new SellerApplicationError(409, 'Shop status changed. Refresh before reviewing.')
        await tx.$executeRaw`UPDATE "ShopMembership" SET "status"='ACTIVE' WHERE "shopId"=${previous.id} AND "userId"=${userId}`
      }
    } else if (status === 'SUSPENDED') {
      const changed = await tx.$executeRaw`UPDATE "Shop" SET "status"='SUSPENDED', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "status"='APPROVED' AND "isPlatform"=FALSE`
      if (changed !== 1) throw new SellerApplicationError(409, 'Shop status changed. Refresh before reviewing.')
      await tx.$executeRaw`UPDATE "ShopMembership" SET "status"='REVOKED' WHERE "shopId"=${previous.id}`
    }
    const application = { ...previous, status: status as SellerApplication['status'], reason, version: previous.version + 1, updatedAt: new Date().toISOString() }
    const changed = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(application) } })
    if (changed.count !== 1) throw new SellerApplicationError(409, 'Application changed. Refresh before reviewing.')
    await tx.storeSetting.create({ data: { key: `audit.seller.${previous.id}.${application.version}`, value: JSON.stringify({ actorId, applicationId: previous.id, status, reason, version: application.version, at: application.updatedAt }) } })
    return application
  }, transaction)
}
