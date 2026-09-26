import type { Prisma } from '@prisma/client'
import { validateMediaUpload } from './media.ts'
import { InspectionError, inspectionUpdate, type Inspection } from './shop-inspection.ts'
import { enqueueInspectionNotifications } from './inspection-notifications.ts'

export async function changeInspection(tx: Prisma.TransactionClient, order: { id: string; orderId: string; shopId: string; isPlatform: boolean; status: string; orderStatus: string }, body: Record<string, unknown>, actorId: string) {
  if (order.isPlatform || !['PENDING','PACKING'].includes(order.status) || ['CANCELLED','REFUNDED'].includes(order.orderStatus))
    throw new InspectionError(409, 'Inspection is available only for external-shop items before customer dispatch.')
  const key = `shop-inspection.${order.id}`
  const row = await tx.storeSetting.findUnique({ where: { key } })
  const previous = row ? JSON.parse(row.value) as Inspection : null
  let next: Inspection
  let photoOnly = false
  if (body.action === 'inspection-photo') {
    photoOnly = true
    if (!previous || !['RECEIVED','FAILED'].includes(previous.status) || typeof body.requestId !== 'string' || !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(body.requestId))
      throw new InspectionError(409, 'Receive the items before adding inspection photos.')
    if (typeof body.data !== 'string' || typeof body.contentType !== 'string' || !body.contentType.startsWith('image/') || !validateMediaUpload(body.data, body.contentType, 1000000))
      throw new InspectionError(400, 'Choose a supported inspection image up to 1 MB.')
    const photoKey = `inspection-media.${order.id}.${body.requestId}`, value = JSON.stringify({ data: body.data, contentType: body.contentType })
    const existing = await tx.storeSetting.findUnique({ where: { key: photoKey } })
    if (existing) {
      if (existing.value !== value || !previous.photoIds.includes(body.requestId)) throw new InspectionError(409, 'Photo identifier already used.')
      return []
    }
    if (body.expectedVersion !== previous.version || previous.photoIds.length >= 3) throw new InspectionError(409, 'Refresh inspection; up to three photos are supported.')
    await tx.storeSetting.create({ data: { key: photoKey, value } })
    next = { ...previous, version: previous.version + 1, photoIds: [...previous.photoIds, body.requestId] }
  } else next = inspectionUpdate(previous, body, actorId, new Date().toISOString())
  if (next === previous) return []
  if (row) {
    const changed = await tx.storeSetting.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(next) } })
    if (changed.count !== 1) throw new InspectionError(409, 'Inspection changed. Refresh before retrying.')
  } else await tx.storeSetting.create({ data: { key, value: JSON.stringify(next) } })
  await tx.storeSetting.create({ data: { key: `audit.inspection.${order.id}.${next.version}`, value: JSON.stringify({ action: 'inspection.updated', actorId, resource: order.id, version: next.version, createdAt: new Date().toISOString() }) } })
  return photoOnly ? [] : enqueueInspectionNotifications(tx, order.orderId, order.id, order.shopId, next)
}
