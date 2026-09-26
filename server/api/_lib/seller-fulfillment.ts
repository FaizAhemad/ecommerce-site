export class FulfillmentError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export function fulfillmentTransition(previous: string, next: unknown) {
  const allowed: Record<string, string[]> = { PENDING: ['PACKING'], PACKING: ['SHIPPED'], SHIPPED: ['DELIVERED'], DELIVERED: [], CANCELLED: [] }
  return typeof next === 'string' && !!allowed[previous]?.includes(next)
}
export function returnTransition(previous: string, next: unknown, customer: boolean) {
  return customer ? previous === 'REQUESTED' && next === 'CANCELLED' :
    (previous === 'REQUESTED' && (next === 'APPROVED' || next === 'REJECTED')) || (previous === 'APPROVED' && next === 'RECEIVED')
}

// Ownership is resolved by the caller in the same transaction as the mutation.
export function usesScopedFulfillment(order: { isPlatform: boolean; hasExternalShop: boolean }) {
  return !order.isPlatform || order.hasExternalShop
}
export function canManageScopedFulfillment(order: { isPlatform: boolean; hasExternalShop: boolean }, audience: 'admin' | 'seller' | 'customer') {
  return audience !== 'customer' && usesScopedFulfillment(order) && (!order.isPlatform || audience === 'admin')
}
