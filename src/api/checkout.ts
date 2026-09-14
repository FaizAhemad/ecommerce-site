import { apiFetch } from './http'
export type Quote = {
  enabled: boolean
  subtotalMinor?: number
  shippingMinor?: number
  taxMinor?: number
  totalMinor?: number
  currency?: string
}
export async function checkoutRequest(
  method: 'GET' | 'POST',
  signal: AbortSignal,
  body?: { requestId: string; addressId: string; expectedTotalMinor: number },
) {
  const response = await apiFetch('/api/checkout', {
    method,
    signal,
    ...(body
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })
  const result = (await response.json()) as Quote & {
    orderId?: string
    error?: { message?: string }
  }
  if (!response.ok)
    throw new Error(
      result.error?.message ?? 'Unable to confirm checkout. Check your orders before trying again.',
    )
  return result
}
