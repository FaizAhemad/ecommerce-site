import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { apiFetch } from '../api/http'
import { sessionGeneration } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
type Attachment = { id: string; contentType: string; data: string }
export function SupportAttachments({ ticketId, canUpload }: { ticketId: string; canUpload: boolean }) {
  const [items, setItems] = useState<Attachment[]>([]), [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const attempts = useRef(new WeakMap<File, string>())
  const notify = useNotification()
  useEffect(() => () => controller.current?.abort(), [])
  async function run(files?: FileList | null) {
    if (controller.current) return
    const abort = new AbortController(), generation = sessionGeneration()
    controller.current = abort
    setBusy(true)
    try {
      if (files) {
        if (files.length > 3) throw new Error('Choose up to three images.')
        for (const file of Array.from(files)) {
          if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 256000) throw new Error('Choose JPEG or PNG images up to 250 KB each.')
          const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Unable to read image.')); reader.readAsDataURL(file) })
          if (abort.signal.aborted || generation !== sessionGeneration()) return
          const id = attempts.current.get(file) ?? crypto.randomUUID()
          attempts.current.set(file, id)
          const response = await apiFetch('/api/support-attachments', { method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId, id, data, contentType: file.type }) })
          const body = await response.json()
          if (!response.ok) throw new Error(body.error?.message ?? 'Unable to save attachment. Refresh attachments before retrying.')
        }
      }
      const response = await apiFetch('/api/support-attachments?ticketId=' + encodeURIComponent(ticketId), { signal: abort.signal, cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !Array.isArray(body.attachments)) throw new Error('Unable to load attachments. Your support ticket is saved separately.')
      if (abort.signal.aborted || generation !== sessionGeneration()) return
      setItems(body.attachments)
      setLoaded(true)
      if (files) notify('Attachments saved.', 'success')
    } catch (error) { if (!abort.signal.aborted && generation === sessionGeneration()) notify(error instanceof Error ? error : new Error('Attachment request failed.')) }
    finally { controller.current = null; if (!abort.signal.aborted) setBusy(false) }
  }
  return <Stack spacing={1.25}>
    <Button type="button" variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => void run()}>{busy ? <><CircularProgress size={16} sx={{ mr: 1 }} />Working…</> : loaded ? 'Refresh attachments' : 'View attachments'}</Button>
    {canUpload && <TextField type="file" label="Add attachments" helperText="Up to three JPEG or PNG images, 250 KB each. Do not upload sensitive records." slotProps={{ htmlInput: { accept: 'image/jpeg,image/png', multiple: true, onChange: (event: ChangeEvent<HTMLInputElement>) => void run(event.target.files) }, inputLabel: { shrink: true } }} disabled={busy} />}
    {loaded && !items.length && <Typography variant="body2" color="text.secondary">No attachments recorded.</Typography>}
    {items.map((item, index) => <Card variant="outlined" key={item.id} sx={{ p: 1.5, alignSelf: 'flex-start' }}><a download={`support-image-${index + 1}.${item.contentType === 'image/png' ? 'png' : 'jpg'}`} href={item.data}>Download image {index + 1}</a></Card>)}
  </Stack>
}
