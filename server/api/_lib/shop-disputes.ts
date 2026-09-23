export type DisputeAudience = 'customer' | 'seller' | 'admin'
export type ShopDispute = {
  status: 'OPEN' | 'ESCALATED' | 'RESOLVED'; version: number;
  messages: { id: string; audience: DisputeAudience; actorId: string; action: string; body: string; createdAt: string }[];
}
export class DisputeError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export function disputeUpdate(previous: ShopDispute | null, input: Record<string, unknown>, audience: DisputeAudience, actorId: string, now: string): ShopDispute {
  const id = typeof input.requestId === 'string' ? input.requestId : ''
  const body = typeof input.reason === 'string' ? input.reason.trim() : ''
  const action = input.action
  if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || body.length < 3 || body.length > 1000)
    throw new DisputeError(400, 'Provide a message of 3–1000 characters.')
  const duplicate = previous?.messages.find(message => message.id === id)
  if (duplicate) {
    if (duplicate.actorId !== actorId || duplicate.body !== body || duplicate.action !== action || duplicate.audience !== audience)
      throw new DisputeError(409, 'This message identifier was already used. Refresh the conversation.')
    return previous!
  }
  if (input.expectedVersion !== (previous?.version ?? 0)) throw new DisputeError(409, 'Conversation changed. Refresh before sending; your draft is preserved.')
  if (previous?.status === 'RESOLVED') throw new DisputeError(409, 'This dispute is resolved. Contact support for further help.')
  let status: ShopDispute['status'] = previous?.status ?? 'OPEN'
  if (action === 'support-open') {
    if (previous) throw new DisputeError(409, 'A conversation already exists for this shop order.')
  } else {
    if (!previous) throw new DisputeError(409, 'Start a support conversation first.')
    if (action === 'support-escalate') {
      if (previous.status !== 'OPEN') throw new DisputeError(409, 'This dispute was already escalated.')
      status = 'ESCALATED'
    } else if (action === 'support-resolve') {
      if (audience !== 'admin') throw new DisputeError(403, 'Only Gadgify administrators can resolve disputes.')
      status = 'RESOLVED'
    } else if (action !== 'support-reply') throw new DisputeError(400, 'Unsupported support action.')
    // Reserve space for escalation and the final administrator decision.
    if (action === 'support-reply' && previous.messages.length >= 98)
      throw new DisputeError(409, 'Conversation capacity reached. Escalate to Gadgify for review.')
  }
  return { status, version: (previous?.version ?? 0) + 1, messages: [...(previous?.messages ?? []), { id, audience, actorId, action: String(action), body, createdAt: now }] }
}
export function publicDispute(value: ShopDispute | null) {
  return value ? { status: value.status, version: value.version, messages: value.messages.map(({ id, audience, body, createdAt }) => ({ id, audience, body, createdAt })) } : null
}
