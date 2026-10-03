import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'
import { Alert } from './mui/Alert'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'

type Entry = { id: string; contentType: string; bytes: number; updatedAt: string; inUse: boolean }
type Library = { items: Entry[]; usedFiles: number; usedBytes: number; maxFiles: number; maxFileBytes: number }
const size = (bytes: number) => bytes < 1_000_000 ? `${(bytes / 1_000).toFixed(1)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`
async function request<T>(url: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(url, init)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? 'Media storage is unavailable.')
  return body as T
}
function Preview({ shopId, id }: { shopId: string; id: string }) {
  const query = useQuery({
    queryKey: privateKey('seller-media', shopId, id), retry: false, gcTime: 0,
    queryFn: ({ signal }) => request<{ data: string; contentType: string }>(`/api/seller/media?shopId=${encodeURIComponent(shopId)}&id=${encodeURIComponent(id)}`, { signal }),
  })
  if (query.isPending) return <Stack role="status" direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography variant="body2">Loading preview…</Typography></Stack>
  if (query.isError) return <Button variant="outlined" onClick={() => void query.refetch()}>Retry preview</Button>
  return query.data.contentType.startsWith('video/')
    ? <Box component="video" controls preload="metadata" src={query.data.data} sx={{ display: 'block', width: '100%', maxHeight: 300, objectFit: 'contain', bgcolor: 'action.hover', borderRadius: 1.5 }} />
    : <Box component="img" src={query.data.data} alt="Selected shop upload" sx={{ display: 'block', width: '100%', maxHeight: 300, objectFit: 'contain', bgcolor: 'action.hover', borderRadius: 1.5 }} />
}
export function SellerMediaLibrary({ shopId, onClose, onRemoved }: { shopId: string; onClose: () => void; onRemoved: () => void }) {
  const client = useQueryClient(), notify = useNotification(), lock = useRef(false), controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false), [error, setError] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null), [preview, setPreview] = useState<string | null>(null)
  const endpoint = `/api/seller/media?shopId=${encodeURIComponent(shopId)}`
  const query = useQuery({ queryKey: privateKey('seller-media-library', shopId), retry: false, queryFn: ({ signal }) => request<Library>(endpoint, { signal }) })
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
    } finally {
      lock.current = false
      if (generation === sessionGeneration() && !signal.aborted) setPending(false)
    }
  }
  return <FormDialog open title="Shop media storage" busy={pending} onClose={onClose}>
    <Stack spacing={2}>
      <Typography color="text.secondary">Saved drafts and published product attachments are protected. Removing an attachment from an unsaved form does not remove its saved references.</Typography>
      <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={pending || query.isFetching} onClick={() => { setConfirm(null); void query.refetch() }}>Refresh storage</Button>
      {query.isPending && <Stack role="status" direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography>Loading storage…</Typography></Stack>}
      {query.isError && <Alert severity="warning" role="alert">Storage could not be loaded. Refresh to retry.</Alert>}
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      {pending && <Stack role="status" direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography>Removing upload…</Typography></Stack>}
      {!query.isError && query.data && <>
        <Typography variant="body2" color="text.secondary">{query.data.usedFiles} / {query.data.maxFiles} uploads · {size(query.data.usedBytes)} used · {size(query.data.maxFileBytes)} maximum per file</Typography>
        {!query.data.items.length && <Card variant="outlined" sx={{ p: 3 }}><Typography color="text.secondary">No uploads stored for this shop yet.</Typography></Card>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
          {query.data.items.map(item => <Card variant="outlined" component="article" key={item.id} sx={{ p: 2, minWidth: 0, overflowWrap: 'anywhere' }}>
            <Stack spacing={1.25}>
              <Typography component="h3" variant="h6">{item.contentType.startsWith('video/') ? 'Video' : 'Image'} · {item.id.slice(-8)}</Typography>
              <Typography variant="body2" color="text.secondary">{size(item.bytes)} · {item.inUse ? 'Attached — protected' : 'Unused'}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(item.updatedAt).toLocaleString()}</Typography>
              <Button variant="outlined" disabled={pending} onClick={() => setPreview(preview === item.id ? null : item.id)} sx={{ alignSelf: 'flex-start' }}>{preview === item.id ? 'Hide preview' : 'Preview'}</Button>
              {preview === item.id && <Preview shopId={shopId} id={item.id} />}
              {!item.inUse && (confirm === item.id
                ? <Stack spacing={1}><Typography variant="body2">Permanently remove this unused upload?</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button color="error" variant="contained" disabled={pending} onClick={() => void remove(item)}>Confirm removal</Button><Button variant="outlined" disabled={pending} onClick={() => setConfirm(null)}>Keep upload</Button></Stack></Stack>
                : <Button color="error" variant="outlined" disabled={pending} onClick={() => setConfirm(item.id)} sx={{ alignSelf: 'flex-start' }}>Remove unused upload</Button>)}
            </Stack>
          </Card>)}
        </Box>
      </>}
    </Stack>
  </FormDialog>
}