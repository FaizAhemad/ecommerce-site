import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'

export const policyKinds = ['privacy', 'returns', 'refund', 'terms', 'shipping', 'cancellation', 'cookies'] as const
export type PolicyText = { title: string; text: string }
export type PublishedPolicy = PolicyText & { version: number; publishedAt: string }
export type PolicyState = { version: number; draft: PolicyText | null; published: PublishedPolicy | null }
export class PolicyError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export function policyKey(kind: unknown, locale: unknown) {
  if (typeof kind !== 'string' || typeof locale !== 'string' || !policyKinds.includes(kind as typeof policyKinds[number]) || !['en', 'hi', 'mr'].includes(locale))
    throw new PolicyError(400, 'Select a supported policy and language.')
  return `policy.${kind}.${locale}`
}
function validText(value: unknown): value is PolicyText {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= 120 && typeof item.text === 'string' && item.text.trim().length > 0 && item.text.length <= 50000
}
export function parsePolicy(value?: string): PolicyState {
  if (value === undefined) return { version: 0, draft: null, published: null }
  try {
    const state = JSON.parse(value) as PolicyState
    if (!state || !Number.isSafeInteger(state.version) || state.version < 0 || (state.draft !== null && !validText(state.draft)) || (state.published !== null && (!validText(state.published) || !Number.isSafeInteger(state.published.version) || state.published.version < 1 || !Number.isFinite(Date.parse(state.published.publishedAt))))) throw new Error('Invalid state')
    return state
  } catch { throw new PolicyError(503, 'Stored policy content is unavailable. Review configuration before editing.') }
}
export async function updatePolicy(store: Pick<PrismaClient, '$transaction'>, actorId: string, input: Record<string, unknown>) {
  const key = policyKey(input.kind, input.locale)
  if (!Number.isSafeInteger(input.expectedVersion) || !['draft', 'publish'].includes(String(input.action))) throw new PolicyError(400, 'Reload the policy before editing.')
  const draft = { title: typeof input.title === 'string' ? input.title.trim() : '', text: typeof input.text === 'string' ? input.text.trim() : '' }
  if (input.action === 'draft' && !validText(draft)) throw new PolicyError(400, 'Provide a title up to 120 characters and approved source text up to 50000 characters.')
  if (input.action === 'publish' && input.approved !== true) throw new PolicyError(400, 'Confirm that the saved policy text is approved before publishing.')
  return store.$transaction(async tx => {
    const current = parsePolicy((await tx.storeSetting.findUnique({ where: { key } }))?.value)
    if (current.version !== input.expectedVersion) throw new PolicyError(409, 'This policy changed. Reload before saving or publishing.')
    if (current.version >= Number.MAX_SAFE_INTEGER) throw new PolicyError(503, 'Policy version is unavailable.')
    if (input.action === 'publish' && !current.draft) throw new PolicyError(400, 'Save a policy draft before publishing.')
    const version = current.version + 1
    const now = new Date().toISOString()
    const next: PolicyState = input.action === 'draft'
      ? { ...current, version, draft }
      : { ...current, version, published: { ...current.draft!, version, publishedAt: now } }
    await tx.storeSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(next) }, update: { value: JSON.stringify(next) } })
    if (input.action === 'publish') {
      await tx.storeSetting.create({ data: { key: `policy-history.${input.kind}.${input.locale}.${version}`, value: JSON.stringify({ ...next.published, actorId }) } })
      await tx.storeSetting.create({ data: { key: `audit.${randomUUID()}`, value: JSON.stringify({ action: 'policy.published', actorId, resource: key, version, createdAt: now }) } })
    }
    return next
  }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
}
