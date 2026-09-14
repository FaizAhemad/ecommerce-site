import type { PrismaClient } from '@prisma/client'
export const historySelect = {
  id: true,
  orderNumber: true,
  status: true,
  totalMinor: true,
  currency: true,
  createdAt: true,
  items: { select: { id: true, productName: true, quantity: true } },
  payment: { select: { status: true } },
} as const
export async function orderHistory(
  store: Pick<PrismaClient, 'order'>,
  userId: string,
  page: number,
) {
  const rows = await store.order.findMany({
    where: { userId },
    select: historySelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: page * 20,
    take: 21,
  })
  return { orders: rows.slice(0, 20), nextPage: rows.length > 20 ? page + 1 : null }
}
