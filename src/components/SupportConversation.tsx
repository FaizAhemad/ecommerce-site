import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
type Reply = { id: string; body: string; fromAdmin: boolean; createdAt: string }
export function SupportConversation({ ticketId, open }: { ticketId: string; open: boolean }) {
  const [visible, setVisible] = useState(false), [text, setText] = useState(''), [busy, setBusy] = useState(false)
  const operation = useRef<AbortController | null>(null), draft = useRef<{ id: string; body: string } | null>(null)
  const notify = useNotification()
  useEffect(() => () => operation.current?.abort(), [])
  const query = useInfiniteQuery({ queryKey: privateKey('support-conversation', ticketId), enabled: visible, retry: false, initialPageParam: 0,
    queryFn: async ({ signal, pageParam }) => {
      const response = await apiFetch(`/api/support-replies?ticketId=${encodeURIComponent(ticketId)}&page=${pageParam}`, { signal })
      const body = await response.json() as { replies: Reply[]; nextPage: number | null }
      if (!response.ok || !Array.isArray(body.replies)) throw new Error('Unable to load replies.')
      return body
    }, getNextPageParam: (page) => page.nextPage ?? undefined,
  })
  async function send() {
    if (operation.current || !text.trim()) return
    const controller = new AbortController(), generation = sessionGeneration()
    operation.current = controller
    setBusy(true)
    draft.current ??= { id: crypto.randomUUID(), body: text.trim() }
    try {
      const response = await apiFetch('/api/support-replies', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId, ...draft.current }) })
      const result = await response.json()
      if (!response.ok || !result.saved) throw new Error(result.error?.message ?? 'Unable to confirm reply. Refresh before retrying.')
      if (controller.signal.aborted || generation !== sessionGeneration()) return
      setText(''); draft.current = null
      notify('Reply recorded in the conversation.', 'success')
      void query.refetch({ cancelRefetch: false })
    } catch (error) { if (!controller.signal.aborted && generation === sessionGeneration()) notify(error instanceof Error ? error : new Error('Unable to send reply.')) }
    finally { operation.current = null; if (!controller.signal.aborted) setBusy(false) }
  }
  return <Stack spacing={1.5}>
    <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => setVisible(!visible)}>{visible ? 'Hide conversation' : 'View conversation'}</Button>
    {visible && <>
      {query.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography variant="body2" color="text.secondary">Loading replies…</Typography></Stack>}
      {query.isError && <Alert severity="error" role="alert">Replies are unavailable. The support ticket remains saved.</Alert>}
      <Button variant="text" disabled={query.isFetching || busy} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh replies</Button>
      {!query.isPending && !query.isError && !query.data?.pages[0].replies.length && <Typography variant="body2" color="text.secondary">No replies yet.</Typography>}
      {[...new Map((query.data?.pages.flatMap((page) => page.replies) ?? []).map((reply) => [reply.id, reply])).values()].map((reply) => <Card variant="outlined" component="article" key={reply.id} sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography variant="subtitle2">{reply.fromAdmin ? 'Support team' : 'Customer'}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{reply.body}</Typography><Typography variant="caption" color="text.secondary">{new Date(reply.createdAt).toLocaleString()}</Typography></Stack></Card>)}
      {query.hasNextPage && <Button variant="text" disabled={query.isFetching} onClick={() => void query.fetchNextPage({ cancelRefetch: false })}>Older replies</Button>}
      {open && <Stack component="form" spacing={1.5} onSubmit={(event) => { event.preventDefault(); void send() }}>
        <TextField label="Reply" required slotProps={{ htmlInput: { maxLength: 4000 } }} multiline minRows={3} disabled={busy || !!draft.current} value={text} onChange={(event) => setText(event.target.value)} />
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }} disabled={busy || !text.trim()}>{busy ? 'Saving…' : draft.current ? 'Retry same reply' : 'Send reply'}</Button>
        <Typography variant="caption" color="text.secondary">Replies are recorded here. Email delivery is not implied. If interrupted, refresh before retrying.</Typography>
      </Stack>}
    </>}
  </Stack>
}
