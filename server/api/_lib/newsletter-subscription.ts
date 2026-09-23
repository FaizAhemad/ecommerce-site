import type { PrismaClient } from '@prisma/client'

// Unique email plus conditional activation elects one sender across concurrent requests.
export async function activateNewsletter(store: Pick<PrismaClient, 'newsletterSubscription'>, email: string) {
  const created = await store.newsletterSubscription.createMany({ data: [{ email }], skipDuplicates: true })
  if (created.count === 1) return true
  const reactivated = await store.newsletterSubscription.updateMany({
    where: { email, status: 'UNSUBSCRIBED' },
    data: { status: 'ACTIVE', unsubscribedAt: null, subscribedAt: new Date() },
  })
  return reactivated.count === 1
}
