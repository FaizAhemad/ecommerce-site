import type { Prisma } from '@prisma/client'
import { notificationKey, type NotificationJob } from './notification-queue.js'
import type { Inspection } from './shop-inspection.js'

export async function enqueueInspectionNotifications(tx: Pick<Prisma.TransactionClient, 'user' | 'storeSetting'>, orderId: string, sellerOrderId: string, shopId: string, inspection: Inspection) {
  if (inspection.history.at(-1)?.action === 'inspection-call') return []
  const members = await tx.user.findMany({ where: {
    shopMemberships: { some: { shopId, status: 'ACTIVE', shop: { status: 'APPROVED', isPlatform: false } } },
  }, select: { id: true, email: true, emailVerifiedAt: true }, take: 51, orderBy: { id: 'asc' } })
  if (members.length > 50) throw new Error('Inspection recipient capacity exceeded')
  const keys: string[] = []
  for (const member of members) {
    const now = Date.now()
    const job: NotificationJob = { version: 2, orderId, userId: member.id, shopId, kind: 'INSPECTION_SELLER', eventId: `${sellerOrderId}-${inspection.version}-${member.id}`,
      status: member.email && member.emailVerifiedAt ? 'PENDING' : 'SKIPPED',
      payload: { from: '', to: [member.email ?? ''], subject: 'Gadgify quality inspection update',
        html: `<p>Gadgify has updated a quality inspection for your shop. Status: ${inspection.status.replaceAll('_', ' ')}.</p><p>Sign in and open Shop order records to read the inspection findings and any return or replacement request. Do not dispatch held items to the customer before inspection passes.</p><p>This notice does not confirm a refund or settlement. Reply through the order support conversation.</p>` },
      attempts: 0, firstAttemptAt: null, availableAt: now, leaseUntil: 0, credentialHash: null, updatedAt: new Date(now).toISOString(),
    }
    const key = notificationKey(job)
    if (!await tx.storeSetting.findUnique({ where: { key } })) await tx.storeSetting.create({ data: { key, value: JSON.stringify(job) } })
    keys.push(key)
  }
  return keys
}
