import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { FormDialog } from './FormDialog'
import { useNotification } from './NotificationProvider'
import './SellerMediaLibrary.css'

type Entry = { id: string; contentType: string; bytes: number; updatedAt: string; inUse: boolean }
type Library = { items: Entry[]; usedFiles: number; usedBytes: number; maxFiles: number; maxFileBytes: number }
const size = (bytes: number) => bytes < 1000000 ? `${(bytes / 1000).toFixed(1)} KB` : `${(bytes / 1000000).toFixed(1)} MB`
async function request<T>(url: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(url, init)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? 'Media storage is unavailable.')
  return body as T
}
function Preview({ shopId, id }: { shopId: string; id: string }) {
  const query = useQuery({ queryKey: privateKey('seller-media', shopId, id), retry: false, gcTime: 0,
    queryFn: ({ signal }) => request<{ data: string; contentType: string }>(`/api/seller/media?shopId=${encodeURIComponent(shopId)}&id=${encodeURIComponent(id)}`, { signal }),
  })
  if (query.isPending) return <p role="status">Loading preview…</p>
  if (query.isError) return <button className="secondary-button" onClick={() => void query.refetch()}>Retry preview</button>
  return query.data.contentType.startsWith('video/') ? <video controls preload="metadata" src={query.data.data} /> : <img src={query.data.data} alt="Selected shop upload" />
}
export function SellerMediaLibrary({ shopId, onClose, onRemoved }: { shopId: string; onClose: () => void; onRemoved: () => void }) {
  const client = useQueryClient(), notify = useNotification(), lock = useRef(false), controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false), [error, setError] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null), [preview, setPreview] = useState<string | null>(null)
  const endpoint = `/api/seller/media?shopId=${encodeURIComponent(shopId)}`
  const query = useQuery({ queryKey: privateKey('seller-media-library', shopId), retry: false,
    queryFn: ({ signal }) => request<Library>(endpoint, { signal }),
  })
  useEffect(() => () => controller.current?.abort(), [])
  async function remove(item: Entry) {
    if (lock.current || item.inUse) return
    lock.current = true; setPending(true); setError('')
    const generation = sessionGeneration(), abort = new AbortController()
    controller.current = abort
    const signal = AbortSignal.any([abort.signal, sessionSignal()])
    try {
      const result = await request<{ deleted: boolean }>('/api/seller/media', { method: 'DELETE', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopId, id: item.id, expectedUpdatedAt: item.updatedAt }) })
      if (generation !== sessionGeneration() || signal.aborted) return
      if (!result.deleted) throw new Error('Removal is unconfirmed. Refresh storage before retrying.')
      setConfirm(null); setPreview(null); onRemoved()
      await client.cancelQueries({ queryKey: privateKey('seller-media', shopId, item.id) })
      client.removeQueries({ queryKey: privateKey('seller-media', shopId, item.id) })
      notify('Unused upload removed.', 'success')
      await query.refetch()
    } catch (failure) {
      if (generation === sessionGeneration() && !signal.aborted) setError(failure instanceof Error ? failure.message : 'Removal is unconfirmed. Refresh storage.')
    } finally { lock.current = false; if (generation === sessionGeneration() && !signal.aborted) setPending(false) }
  }
  return <FormDialog open title="Shop media storage" busy={pending} onClose={onClose}>
    <p>Saved drafts and published product attachments are protected. Removing an attachment from an unsaved form does not remove its saved references.</p>
    <button className="secondary-button" disabled={pending || query.isFetching} onClick={() => { setConfirm(null); void query.refetch() }}>Refresh storage</button>
    {query.isPending && <p role="status">Loading storage…</p>}
    {query.isError && <p role="alert">Storage could not be loaded. Refresh to retry.</p>}
    {error && <p role="alert">{error}</p>}
    {pending && <p role="status">Removing upload…</p>}
    {!query.isError && query.data && <>
      <p>{query.data.usedFiles} / {query.data.maxFiles} uploads · {size(query.data.usedBytes)} used · {size(query.data.maxFileBytes)} maximum per file</p>
      {!query.data.items.length && <p>No uploads stored for this shop yet.</p>}
      <div className="seller-media-library-grid">{query.data.items.map(item => <article className="record-card" key={item.id}>
        <h3>{item.contentType.startsWith('video/') ? 'Video' : 'Image'} · {item.id.slice(-8)}</h3>
        <p>{size(item.bytes)} · {item.inUse ? 'Attached — protected' : 'Unused'}</p>
        <small>{new Date(item.updatedAt).toLocaleString()}</small>
        <button className="secondary-button" disabled={pending} onClick={() => setPreview(preview === item.id ? null : item.id)}>{preview === item.id ? 'Hide preview' : 'Preview'}</button>
        {preview === item.id && <Preview shopId={shopId} id={item.id} />}
        {!item.inUse && (confirm === item.id ? <div><p>Permanently remove this unused upload?</p><button className="secondary-button" disabled={pending} onClick={() => void remove(item)}>Confirm removal</button><button className="secondary-button" disabled={pending} onClick={() => setConfirm(null)}>Keep upload</button></div> : <button className="secondary-button" disabled={pending} onClick={() => setConfirm(item.id)}>Remove unused upload</button>)}
      </article>)}</div>
    </>}
  </FormDialog>
}
