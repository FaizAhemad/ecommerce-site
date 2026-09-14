import { apiFetch } from './http.ts'
export type OrderSummary = {
  id: string
  orderNumber: string
  status: string
  totalMinor: number
  currency: string
  createdAt: string
  items: { id: string; productName: string; quantity: number }[]
  payment: { status: string } | null
}
export type OrderHistory = { orders: OrderSummary[]; nextPage: number | null }
export type OrderDetail = Omit<OrderSummary, 'items' | 'payment'> & {
  items: (OrderSummary['items'][number] & { unitPriceMinor: number })[]
  subtotalMinor: number
  shippingMinor: number
  taxMinor: number
  payment: { status: string; provider: string } | null
  shipment: { status: string; carrier: string | null; trackingCode: string | null } | null
  shippingAddress: {
    name: string
    line1: string
    line2: string | null
    city: string
    state: string
    postalCode: string
    country: string
    phone: string | null
  } | null
}
export async function getOrder(id: string, signal: AbortSignal): Promise<OrderDetail> {
  const response = await apiFetch(`/api/orders/${encodeURIComponent(id)}`, {
    signal,
    cache: 'no-store',
  })
  if (response.status === 404)
    throw new Error('Order not found. Check the link or return to your orders.')
  if (!response.ok) throw new Error('Unable to load this order. Please try again.')
  const body = await response.json()
  if (!body?.order?.id || !Array.isArray(body.order.items))
    throw new Error('Unable to confirm order details.')
  return body.order
}
export async function getOrders(page: number, signal: AbortSignal): Promise<OrderHistory> {
  const response = await apiFetch(`/api/orders?page=${page}`, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load your orders. Please try again.')
  const body = await response.json()
  if (
    !Array.isArray(body?.orders) ||
    !(body.nextPage === null || (Number.isInteger(body.nextPage) && body.nextPage === page + 1))
  )
    throw new Error('Unable to confirm your order history.')
  return body
}
export function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
    CREATED: 'Created',
    AUTHORIZED: 'Authorized',
    CAPTURED: 'Captured',
    FAILED: 'Failed',
  }
  return Object.hasOwn(labels, status) ? labels[status] : 'Status unavailable'
}
