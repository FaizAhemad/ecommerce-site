import type { PrismaClient } from '@prisma/client'
import { GST_ENROLMENT_ID_PATTERN, GSTIN_FORMAT_PATTERN, PHONE_PATTERN, UUID_V4_PATTERN } from './validation-patterns.js'

export type SellerApplication = {
  id: string; userId: string; name: string; city: string; address: string; phone: string; description: string;
  gstRegistered: boolean; gstin: string; gstNotRegisteredReason: string; gstOtherReason: string; gstEnrolmentId: string;
  gstReviewStatus?: 'PENDING' | 'APPROVED' | 'NEEDS_INFO' | 'REJECTED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  version: number; reason: string; updatedAt: string;
}
export class SellerApplicationError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export const applicationKey = (userId: string) => `seller-application.${userId}`
export function gstProfileInput(body: Record<string, unknown>) {
  const text = (key: string) => typeof body[key] === 'string' ? body[key].trim() : ''
  const gstRegistered = body.gstRegistered
  const gstin = text('gstin').replace(/\s/g, '').toUpperCase()
  const gstNotRegisteredReason = text('gstNotRegisteredReason')
  const gstOtherReason = text('gstOtherReason')
  const gstEnrolmentId = text('gstEnrolmentId').replace(/\s/g, '').toUpperCase()
  if (typeof gstRegistered !== 'boolean') throw new SellerApplicationError(400, 'Select whether your shop is registered for GST.')
  if (gstRegistered && (!GSTIN_FORMAT_PATTERN.test(gstin) || gstNotRegisteredReason || gstOtherReason || gstEnrolmentId))
    throw new SellerApplicationError(400, 'Enter a validly formatted GSTIN and remove the not-registered details.')
  if (!gstRegistered && (!['BELOW_THRESHOLD','EXEMPT_SUPPLIES','REGISTRATION_IN_PROGRESS','OTHER'].includes(gstNotRegisteredReason) || (gstNotRegisteredReason === 'OTHER' ? gstOtherReason.length < 5 || gstOtherReason.length > 500 : gstOtherReason.length > 0) || gstin || (gstEnrolmentId && !GST_ENROLMENT_ID_PATTERN.test(gstEnrolmentId))))
    throw new SellerApplicationError(400, 'Select a valid reason for not being GST-registered and enter a valid enrolment ID if available.')
  return { gstRegistered, gstin, gstNotRegisteredReason, gstOtherReason, gstEnrolmentId }
}
export function applicationInput(body: Record<string, unknown>) {
  const text = (key: string) => typeof body[key] === 'string' ? body[key].trim() : ''
  const id = text('id'), name = text('name'), city = text('city'), address = text('address'), phone = text('phone'), description = text('description')
  const gst = gstProfileInput(body)
  if (!UUID_V4_PATTERN.test(id) ||
    name.length < 2 || name.length > 120 || city.length < 2 || city.length > 100 || address.length < 5 || address.length > 500 || !PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15 || description.length < 10 || description.length > 2000)
    throw new SellerApplicationError(400, 'Enter a shop name, full address, contact phone and description (10–2000 characters).')
  return { id, name, city, address, phone: phone.replace(/[ ()-]/g, ''), description, ...gst }
}
type Store = Pick<PrismaClient, '$transaction'>
const transaction = { isolationLevel: 'Serializable' as const, maxWait: 5000, timeout: 10000 }
export async function submitApplication(store: Store, userId: string, body: Record<string, unknown>) {
  const input = applicationInput(body)
  return store.$transaction(async tx => {
    const key = applicationKey(userId)
    const row = await tx.storeSetting.findUnique({ where: { key } })
    const previous = row ? JSON.parse(row.value) as SellerApplication : null
    if (previous?.id === input.id && previous.name === input.name && previous.city === input.city && previous.address === input.address && previous.phone === input.phone && previous.description === input.description && previous.gstRegistered === input.gstRegistered && previous.gstin === input.gstin && previous.gstNotRegisteredReason === input.gstNotRegisteredReason && previous.gstOtherReason === input.gstOtherReason && previous.gstEnrolmentId === input.gstEnrolmentId && previous.status !== 'REJECTED') return previous
    if (previous && (previous.status !== 'REJECTED' || body.expectedVersion !== previous.version))
      throw new SellerApplicationError(409, 'Refresh your application before making changes.')
    const application: SellerApplication = { ...input, userId, status: 'PENDING', gstReviewStatus: 'PENDING', version: (previous?.version ?? 0) + 1, reason: '', updatedAt: new Date().toISOString() }
    if (row) {
      const saved = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(application) } })
      if (saved.count !== 1) throw new SellerApplicationError(409, 'Application changed. Refresh and try again.')
    } else await tx.storeSetting.create({ data: { key, value: JSON.stringify(application) } })
    return application
  }, transaction)
}
export async function updateGstProfile(store: Store, userId: string, body: Record<string, unknown>) {
  const gst = gstProfileInput(body)
  return store.$transaction(async tx => {
    const key = applicationKey(userId)
    const row = await tx.storeSetting.findUnique({ where: { key } })
    if (!row) throw new SellerApplicationError(404, 'Shop application not found.')
    const previous = JSON.parse(row.value) as SellerApplication
    if (previous.status !== 'APPROVED' && previous.status !== 'SUSPENDED') throw new SellerApplicationError(409, 'GST details can be updated after the shop application is approved.')
    if (body.expectedVersion !== previous.version) throw new SellerApplicationError(409, 'Application changed. Refresh before updating GST details.')
    if (previous.gstRegistered === gst.gstRegistered && previous.gstin === gst.gstin && previous.gstNotRegisteredReason === gst.gstNotRegisteredReason && previous.gstOtherReason === gst.gstOtherReason && previous.gstEnrolmentId === gst.gstEnrolmentId) return previous
    const application = { ...previous, ...gst, gstReviewStatus: 'PENDING' as const, version: previous.version + 1, updatedAt: new Date().toISOString() }
    const saved = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(application) } })
    if (saved.count !== 1) throw new SellerApplicationError(409, 'Application changed. Refresh before updating GST details.')
    const shopChanged = await tx.$executeRaw`UPDATE "Shop" SET "gstReviewStatus"='PENDING', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "isPlatform"=FALSE`
    if (shopChanged !== 1) throw new SellerApplicationError(409, 'Shop details changed. Refresh before updating GST details.')
    await tx.storeSetting.create({ data: { key: `audit.seller.gst.${previous.id}.${application.version}`, value: JSON.stringify({ actorId: userId, applicationId: previous.id, action: 'GST_PROFILE_UPDATED', version: application.version, at: application.updatedAt }) } })
    return application
  }, transaction)
}
export async function reviewApplication(store: Store, actorId: string, body: Record<string, unknown>) {
  const userId = typeof body.userId === 'string' ? body.userId : ''
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  const status = body.status
  const gstDecision = typeof body.gstDecision === 'string' ? body.gstDecision : ''
  if (!userId || userId.length > 100 || !['APPROVED','REJECTED','SUSPENDED'].includes(String(status)) || reason.length < 3 || reason.length > 1000)
    throw new SellerApplicationError(400, 'Select a decision and give a reason (3–1000 characters).')
  if (!['APPROVED','NEEDS_INFO','REJECTED'].includes(gstDecision) || (status === 'APPROVED' && gstDecision !== 'APPROVED'))
    throw new SellerApplicationError(400, 'Review the seller GST declaration before approving shop access.')
  return store.$transaction(async tx => {
    const key = applicationKey(userId), row = await tx.storeSetting.findUnique({ where: { key } })
    if (!row) throw new SellerApplicationError(404, 'Application not found.')
    const previous = JSON.parse(row.value) as SellerApplication
    if (previous.version !== body.expectedVersion) throw new SellerApplicationError(409, 'Application changed. Refresh before reviewing.')
    if (status === 'APPROVED' && typeof previous.gstRegistered !== 'boolean') throw new SellerApplicationError(409, 'Ask the seller to submit a GST declaration before approving the shop.')
    const allowed: Record<SellerApplication['status'], SellerApplication['status'][]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['APPROVED', 'REJECTED', 'SUSPENDED'],
      REJECTED: ['REJECTED', 'APPROVED'],
      SUSPENDED: ['SUSPENDED', 'APPROVED', 'REJECTED'],
    }
    const nextStatus = String(status) as SellerApplication['status']
    if (!allowed[previous.status].includes(nextStatus)) throw new SellerApplicationError(409, 'This decision is not available for the current status.')
    if (status === 'APPROVED' && previous.status === 'SUSPENDED') {
      const changed = await tx.$executeRaw`UPDATE "Shop" SET "status"='APPROVED', "gstReviewStatus"='APPROVED', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "status"='SUSPENDED' AND "isPlatform"=FALSE`
      if (changed !== 1) throw new SellerApplicationError(409, 'Shop status changed. Refresh before reviewing.')
      await tx.$executeRaw`UPDATE "ShopMembership" SET "status"='ACTIVE' WHERE "shopId"=${previous.id} AND "userId"=${userId}`
    } else if (status === 'APPROVED' && ['PENDING', 'REJECTED'].includes(previous.status)) {
      const priorShop = previous.status === 'REJECTED'
        ? await tx.shop.findUnique({ where: { id: previous.id }, select: { id: true, isPlatform: true, memberships: { where: { userId }, select: { userId: true } } } })
        : null
      if (priorShop && (priorShop.isPlatform || priorShop.memberships.length === 0))
        throw new SellerApplicationError(409, 'This shop identifier is already in use. Refresh before reviewing.')
      if (priorShop) {
        const changed = await tx.$executeRaw`UPDATE "Shop" SET "slug"=${'shop-' + previous.id}, "name"=${previous.name}, "city"=${previous.city}, "address"=${previous.address}, "phone"=${previous.phone}, "status"='APPROVED', "gstReviewStatus"='APPROVED', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "status"='REJECTED' AND "isPlatform"=FALSE`
        if (changed !== 1) throw new SellerApplicationError(409, 'Shop status changed. Refresh before reviewing.')
        await tx.$executeRaw`UPDATE "ShopMembership" SET "status"='ACTIVE' WHERE "shopId"=${previous.id} AND "userId"=${userId}`
      } else {
        const collision = previous.status === 'REJECTED' ? await tx.shop.findUnique({ where: { id: previous.id }, select: { id: true } }) : null
        if (collision) throw new SellerApplicationError(409, 'This shop identifier is already in use. Refresh before reviewing.')
        await tx.$executeRaw`INSERT INTO "Shop" ("id","slug","name","city","address","phone","status","gstReviewStatus") VALUES (${previous.id},${'shop-' + previous.id},${previous.name},${previous.city},${previous.address},${previous.phone},'APPROVED','APPROVED')`
        await tx.$executeRaw`INSERT INTO "ShopMembership" ("shopId","userId","status") VALUES (${previous.id},${userId},'ACTIVE')`
      }
    } else if (status === 'SUSPENDED' && previous.status === 'APPROVED') {
      const changed = await tx.$executeRaw`UPDATE "Shop" SET "status"='SUSPENDED', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "status"='APPROVED' AND "isPlatform"=FALSE`
      if (changed !== 1) throw new SellerApplicationError(409, 'Shop status changed. Refresh before reviewing.')
      await tx.$executeRaw`UPDATE "ShopMembership" SET "status"='REVOKED' WHERE "shopId"=${previous.id}`
    } else if (status === 'REJECTED' && ['APPROVED', 'SUSPENDED'].includes(previous.status)) {
      const changed = await tx.$executeRaw`UPDATE "Shop" SET "status"='REJECTED', "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "status"=${previous.status} AND "isPlatform"=FALSE`
      if (changed !== 1) throw new SellerApplicationError(409, 'Shop status changed. Refresh before reviewing.')
      await tx.$executeRaw`UPDATE "ShopMembership" SET "status"='REVOKED' WHERE "shopId"=${previous.id}`
    }
    const shopGstChanged = await tx.$executeRaw`UPDATE "Shop" SET "gstReviewStatus"=${gstDecision}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "isPlatform"=FALSE`
    if (status === 'APPROVED' && shopGstChanged !== 1) throw new SellerApplicationError(409, 'Shop tax review could not be saved. Refresh before approving.')
    const application = { ...previous, status: status as SellerApplication['status'], gstReviewStatus: gstDecision as NonNullable<SellerApplication['gstReviewStatus']>, reason, version: previous.version + 1, updatedAt: new Date().toISOString() }
    const changed = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(application) } })
    if (changed.count !== 1) throw new SellerApplicationError(409, 'Application changed. Refresh before reviewing.')
    await tx.storeSetting.create({ data: { key: `audit.seller.${previous.id}.${application.version}`, value: JSON.stringify({ actorId, applicationId: previous.id, status, gstReviewStatus: gstDecision, reason, version: application.version, at: application.updatedAt }) } })
    return application
  }, transaction)
}
