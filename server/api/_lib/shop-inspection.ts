export type InspectionStatus = 'REQUESTED' | 'RECEIVED' | 'PASSED' | 'FAILED' | 'RETURNING_TO_SHOP' | 'RETURNED_TO_SHOP' | 'REPLACEMENT_REQUESTED'
export type Inspection = {
  status: InspectionStatus; version: number; photoIds: string[];
  history: { id: string; action: string; note: string; actorId: string; createdAt: string }[];
}
export class InspectionError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export function inspectionUpdate(previous: Inspection | null, input: Record<string, unknown>, actorId: string, now: string): Inspection {
  const action = typeof input.action === 'string' ? input.action : ''
  const note = typeof input.reason === 'string' ? input.reason.trim() : ''
  const id = typeof input.requestId === 'string' ? input.requestId : ''
  if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || note.length < 3 || note.length > 1000)
    throw new InspectionError(400, 'Provide a note of 3–1000 characters.')
  const duplicate = previous?.history.find(event => event.id === id)
  if (duplicate) {
    if (duplicate.action !== action || duplicate.note !== note || duplicate.actorId !== actorId)
      throw new InspectionError(409, 'This inspection action was already recorded with different details.')
    return previous!
  }
  if (input.expectedVersion !== (previous?.version ?? 0)) throw new InspectionError(409, 'Inspection changed. Refresh first; your note is preserved.')
  if ((previous?.history.length ?? 0) >= 100) throw new InspectionError(409, 'Inspection history capacity reached. Contact support.')
  let status: InspectionStatus
  if (!previous) {
    if (action !== 'inspection-request') throw new InspectionError(409, 'Request inspection first.')
    status = 'REQUESTED'
  } else if (action === 'inspection-call') status = previous.status
  else if (action === 'inspection-receive' && ['REQUESTED','REPLACEMENT_REQUESTED'].includes(previous.status)) status = 'RECEIVED'
  else if (action === 'inspection-pass' && previous.status === 'RECEIVED') status = 'PASSED'
  else if (action === 'inspection-fail' && previous.status === 'RECEIVED') status = 'FAILED'
  else if (action === 'inspection-return' && previous.status === 'FAILED') status = 'RETURNING_TO_SHOP'
  else if (action === 'inspection-returned' && previous.status === 'RETURNING_TO_SHOP') status = 'RETURNED_TO_SHOP'
  else if (action === 'inspection-replace' && ['FAILED','RETURNED_TO_SHOP'].includes(previous.status)) status = 'REPLACEMENT_REQUESTED'
  else throw new InspectionError(409, 'This inspection transition is unavailable.')
  return { status, version: (previous?.version ?? 0) + 1, photoIds: previous?.photoIds ?? [], history: [...(previous?.history ?? []), { id, action, note, actorId, createdAt: now }] }
}
export const inspectionHoldsDispatch = (inspection: Inspection | null) => !!inspection && inspection.status !== 'PASSED'
export function inspectionDto(inspection: Inspection | null, audience: 'admin' | 'seller' | 'customer') {
  if (!inspection) return null
  return { status: inspection.status, version: inspection.version, holdsDispatch: inspectionHoldsDispatch(inspection),
    photoIds: audience === 'customer' ? [] : inspection.photoIds,
    history: audience === 'customer' ? [] : inspection.history.filter(event => audience === 'admin' || event.action !== 'inspection-call').map(({ id, action, note, createdAt }) => ({ id, action, note, createdAt })),
  }
}
