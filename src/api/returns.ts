import { apiFetch } from './http'
export type CustomerReturn = {
  id: string; reason: string; status: string; resolution: string | null; createdAt: string; updatedAt: string
}
export type ReturnHistory = { returns: CustomerReturn[]; canRequest: boolean }
export async function getReturns(orderId: string, signal: AbortSignal): Promise<ReturnHistory> {
  const response = await apiFetch('/api/returns?orderId=' + encodeURIComponent(orderId), { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load return status.')
  const body = await response.json() as ReturnHistory
  if (!Array.isArray(body.returns) || typeof body.canRequest !== 'boolean') throw new Error('Unable to confirm return status.')
  return body
}
export async function submitReturn(input: { requestId: string; orderId: string; reason: string }, signal: AbortSignal) {
  const response = await apiFetch('/api/returns', {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  })
  const body = await response.json() as { return?: CustomerReturn; error?: { message?: string } }
  if (!response.ok || !body.return?.id) throw new Error(body.error?.message ?? 'Unable to confirm your request. Refresh return status before retrying.')
  return body.return
}
