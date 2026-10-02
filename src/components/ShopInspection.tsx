import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

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
  if (query.isPending) return <Stack role="status" direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography variant="body2">Loading inspection photo…</Typography></Stack>
  if (query.isError) return <Button type="button" variant="outlined" onClick={() => void query.refetch()}>Retry photo</Button>
  return <Paper component="img" variant="outlined" src={query.data.data} alt="Recorded quality inspection evidence" sx={{ display: 'block', maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 2 }} />
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
  return <Paper component="section" aria-label="Quality inspection" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
    <Stack spacing={1.5}>
      <Typography component="h3" variant="h6">Gadgify quality inspection</Typography>
      {inspection ? <Alert severity={inspection.holdsDispatch ? 'warning' : 'success'}>Status: {inspection.status.replaceAll('_', ' ')}. {inspection.holdsDispatch ? 'Customer dispatch is on hold.' : 'Inspection passed.'}</Alert> : <Alert severity="info">Inspection is optional per shop order. Requesting it holds customer dispatch until Gadgify receives and passes these items.</Alert>}
      {audience !== 'customer' && <>
        <Stack spacing={1}>{inspection?.history.map(event => <Card variant="outlined" component="article" key={event.id} sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography variant="subtitle2">{event.action.replace('inspection-', '').replaceAll('-', ' ')}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{event.note}</Typography><Typography variant="caption" color="text.secondary">{new Date(event.createdAt).toLocaleString()}</Typography></Stack></Card>)}</Stack>
        {!!inspection?.photoIds.length && <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>{inspection.photoIds.map((id, index) => <Button type="button" variant="outlined" key={id} disabled={busy} onClick={() => setPhoto(photo === id ? null : id)}>Photo {index + 1}</Button>)}</Stack>}
        {photo && <Photo endpoint={endpoint} orderId={orderId} id={photo} />}
      </>}
      {audience === 'admin' && eligible && <Stack spacing={1.5}>
        <TextField label="Inspection note or return tracking reference" slotProps={{ htmlInput: { maxLength: 1000, minLength: 3 } }} multiline minRows={3} value={note} disabled={busy} onChange={event => setNote(event.target.value)} />
        <Typography variant="body2" color="text.secondary">Decision notes are shared with the shop. Call notes remain visible only to Gadgify staff. Record defects or return tracking clearly; no payment, refund or stock change is implied.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>{(inspection ? transitions[inspection.status] ?? [] : [['inspection-request', 'Request inspection and hold dispatch']]).map(([action, label]) => <Button type="button" variant="outlined" disabled={busy || note.trim().length < 3} key={action} onClick={() => void write(action)}>{label}</Button>)}
          {inspection && <Button type="button" variant="outlined" disabled={busy || note.trim().length < 3} onClick={() => void write('inspection-call')}>Save staff call note</Button>}
        </Stack>
        {inspection && ['RECEIVED','FAILED'].includes(inspection.status) && inspection.photoIds.length < 3 && <Stack spacing={1}><TextField label="Optional inspection photo" helperText="Up to 1 MB; three photos total." type="file" key={inputKey} slotProps={{ htmlInput: { accept: 'image/jpeg,image/png,image/webp,image/gif', onChange: (event: ChangeEvent<HTMLInputElement>) => { setFile(event.target.files?.[0] ?? null); photoId.current = '' } }, inputLabel: { shrink: true } }} disabled={busy} /><Button type="button" variant="outlined" disabled={busy || !file} onClick={() => void write('inspection-photo')}>Save inspection photo</Button></Stack>}
        {error && <Alert severity="error" role="alert">{error}</Alert>}
      </Stack>}
    </Stack>
  </Paper>
}
