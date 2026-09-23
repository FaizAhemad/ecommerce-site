import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api/http'
import { sessionGeneration } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
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
  return <div>
    <button type="button" className="secondary-button" disabled={busy} onClick={() => void run()}>{busy ? 'Working…' : 'View / refresh attachments'}</button>
    {canUpload && <label>Attach up to three JPEG/PNG images, 250 KB each. Do not upload sensitive records.
      <input type="file" accept="image/jpeg,image/png" multiple disabled={busy} onChange={(event) => void run(event.target.files)} />
    </label>}
    {loaded && !items.length && <p>No attachments recorded.</p>}
    {items.map((item, index) => <p key={item.id}><a download={`support-image-${index + 1}.${item.contentType === 'image/png' ? 'png' : 'jpg'}`} href={item.data}>Download image {index + 1}</a></p>)}
  </div>
}
