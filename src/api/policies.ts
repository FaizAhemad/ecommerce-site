import { apiFetch } from './http'
export type PolicyKind = 'privacy' | 'returns' | 'refund' | 'terms' | 'shipping' | 'cancellation' | 'cookies'
export type PolicyText = { title: string; text: string }
export type PublishedPolicy = PolicyText & { version: number; publishedAt: string }
export type PolicyState = { version: number; draft: PolicyText | null; published: PublishedPolicy | null }
export async function getPublishedPolicy(kind: PolicyKind, locale: string, signal: AbortSignal) {
  const response = await apiFetch(`/api/policies?kind=${kind}&locale=${locale}`, { signal })
  if (!response.ok) throw new Error('Unable to load the published policy.')
  const body = await response.json() as { policy?: PublishedPolicy | null }
  if (body.policy === undefined) throw new Error('Unable to confirm policy content.')
  return body.policy
}
export async function adminPolicy(kind: PolicyKind, locale: string, signal: AbortSignal, update?: Record<string, unknown>) {
  const response = await apiFetch(`/api/admin/policies?kind=${kind}&locale=${locale}`, { signal, ...(update ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...update, kind, locale }) } : {}) })
  const body = await response.json() as { state?: PolicyState; error?: { message?: string } }
  if (!response.ok || !body.state) throw new Error(body.error?.message ?? 'Unable to confirm the policy. Reload before retrying.')
  return body.state
}
