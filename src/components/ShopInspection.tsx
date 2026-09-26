import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import './ShopInspection.css'

export type InspectionView = { status: string; version: number; holdsDispatch: boolean; photoIds: string[]; history: { id: string; action: string; note: string; createdAt: string }[] }
async function request<T>(url: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(url, init), data = await response.json()
  if (!response.ok) throw new Error(data.error?.message ?? 'Inspection update could not be confirmed.')
  return data as T
}
function Photo({ endpoint, orderId, id }: { endpoint: string; orderId: string; id: string }) {
  const query = useQuery({ queryKey: privateKey('inspection-photo', endpoint, orderId, id), retry: false, gcTime: 0,
    queryFn: ({ signal }) => request<{ data: string }>(`${endpoint}?id=${encodeURIComponent(orderId)}&inspectionPhoto=${encodeURIComponent(id)}`, { signal }),
  })
  if (query.isPending) return <p role="status">Loading inspection photo…</p>
  if (query.isError) return <button type="button" className="secondary-button" onClick={() => void query.refetch()}>Retry photo</button>
  return <img className="inspection-photo" src={query.data.data} alt="Recorded quality inspection evidence" />
}
const transitions: Record<string, [string, string][]> = {
  REQUESTED: [['inspection-receive', 'Record items received']],
  RECEIVED: [['inspection-pass', 'Pass inspection'], ['inspection-fail', 'Fail inspection']],
  FAILED: [['inspection-return', 'Record return to shop dispatch'], ['inspection-replace', 'Request replacement']],
  RETURNING_TO_SHOP: [['inspection-returned', 'Record shop receipt']],
  RETURNED_TO_SHOP: [['inspection-replace', 'Request replacement']],
  REPLACEMENT_REQUESTED: [['inspection-receive', 'Record replacement received']],
  PASSED: [],
}
export function ShopInspection({ orderId, endpoint, audience, inspection, eligible, busy, lock, onBusy, onSaved }: {
  orderId: string; endpoint: string; audience: 'admin' | 'seller' | 'customer'; inspection: InspectionView | null;
  eligible: boolean; busy: boolean; lock: { current: boolean }; onBusy: (value: boolean) => void; onSaved: () => Promise<unknown>;
}) {
  const [note, setNote] = useState(''), [error, setError] = useState(''), [photo, setPhoto] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null), [inputKey, setInputKey] = useState(0)
  const active = useRef<AbortController | null>(null), actionId = useRef(''), photoId = useRef('')
  const notify = useNotification()
  useEffect(() => () => active.current?.abort(), [])
  async function write(action: string) {
    if (lock.current || busy) return
    lock.current = true; onBusy(true); setError('')
    const abort = new AbortController(), generation = sessionGeneration()
    active.current = abort
    const signal = AbortSignal.any([abort.signal, sessionSignal()])
    try {
      actionId.current ||= crypto.randomUUID()
      const body: Record<string, unknown> = { id: orderId, action, reason: note, requestId: actionId.current, expectedVersion: inspection?.version ?? 0 }
      if (action === 'inspection-photo') {
        if (!file || file.size > 1000000) throw new Error('Choose an image up to 1 MB.')
        photoId.current ||= crypto.randomUUID()
        body.requestId = photoId.current; body.contentType = file.type
        body.data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Unable to read photo.')); reader.readAsDataURL(file) })
      }
      signal.throwIfAborted()
      const result = await request<{ saved: boolean }>(endpoint, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (signal.aborted || generation !== sessionGeneration()) return
      if (!result.saved) throw new Error('Inspection outcome is unconfirmed. Refresh first.')
      if (action === 'inspection-photo') { setFile(null); photoId.current = ''; setInputKey(value => value + 1) }
      else { setNote(''); actionId.current = '' }
      notify(action === 'inspection-call' ? 'Call note recorded. No call was placed.' : 'Inspection record saved.', 'success')
      await onSaved()
    } catch (failure) {
      if (!signal.aborted && generation === sessionGeneration()) setError(failure instanceof Error ? failure.message : 'Inspection update is unconfirmed. Refresh first.')
    } finally { lock.current = false; if (generation === sessionGeneration()) onBusy(false) }
  }
  if (!inspection && !(audience === 'admin' && eligible)) return null
  return <section className="shop-inspection" aria-label="Quality inspection">
    <h3>Gadgify quality inspection</h3>
    {inspection ? <p>Status: {inspection.status.replaceAll('_', ' ')}. {inspection.holdsDispatch ? 'Customer dispatch is on hold.' : 'Inspection passed.'}</p> : <p>Inspection is optional per shop order. Requesting it holds customer dispatch until Gadgify receives and passes these items.</p>}
    {audience !== 'customer' && <>
      {inspection?.history.map(event => <article className="record-card" key={event.id}><strong>{event.action.replace('inspection-', '').replaceAll('-', ' ')}</strong><p className="inspection-note">{event.note}</p><small>{new Date(event.createdAt).toLocaleString()}</small></article>)}
      {!!inspection?.photoIds.length && <div className="profile-actions">{inspection.photoIds.map((id, index) => <button type="button" className="secondary-button" key={id} disabled={busy} onClick={() => setPhoto(photo === id ? null : id)}>Photo {index + 1}</button>)}</div>}
      {photo && <Photo endpoint={endpoint} orderId={orderId} id={photo} />}
    </>}
    {audience === 'admin' && eligible && <div className="auth-form">
      <label>Inspection note / return tracking reference<textarea maxLength={1000} minLength={3} value={note} disabled={busy} onChange={event => setNote(event.target.value)} /></label>
      <p>Decision notes are shared with the shop. Call notes remain visible only to Gadgify staff. Record defects or return tracking clearly; no payment, refund or stock change is implied.</p>
      <div className="profile-actions">{(inspection ? transitions[inspection.status] ?? [] : [['inspection-request', 'Request inspection and hold dispatch']]).map(([action, label]) => <button type="button" className="secondary-button" disabled={busy || note.trim().length < 3} key={action} onClick={() => void write(action)}>{label}</button>)}
        {inspection && <button type="button" className="secondary-button" disabled={busy || note.trim().length < 3} onClick={() => void write('inspection-call')}>Save staff call note</button>}
      </div>
      {inspection && ['RECEIVED','FAILED'].includes(inspection.status) && inspection.photoIds.length < 3 && <>
        <label>Optional inspection photo (up to 1 MB, three total)<input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={event => { setFile(event.target.files?.[0] ?? null); photoId.current = '' }} /></label>
        <button type="button" className="secondary-button" disabled={busy || !file} onClick={() => void write('inspection-photo')}>Save inspection photo</button>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>}
  </section>
}
