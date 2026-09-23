import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
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
  return <div>
    <button className="secondary-button" onClick={() => setVisible(!visible)}>{visible ? 'Hide conversation' : 'View conversation'}</button>
    {visible && <>
      {query.isPending && <p role="status">Loading replies…</p>}
      {query.isError && <p role="alert">Replies are unavailable. The support ticket remains saved.</p>}
      <button className="secondary-button" disabled={query.isFetching || busy} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh replies</button>
      {!query.isPending && !query.isError && !query.data?.pages[0].replies.length && <p>No replies yet.</p>}
      {[...new Map((query.data?.pages.flatMap((page) => page.replies) ?? []).map((reply) => [reply.id, reply])).values()].map((reply) => <article key={reply.id}><strong>{reply.fromAdmin ? 'Support team' : 'Customer'}</strong><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{reply.body}</p><small>{new Date(reply.createdAt).toLocaleString()}</small></article>)}
      {query.hasNextPage && <button className="secondary-button" disabled={query.isFetching} onClick={() => void query.fetchNextPage({ cancelRefetch: false })}>Older replies</button>}
      {open && <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void send() }}>
        <label>Reply<textarea required maxLength={4000} rows={3} disabled={busy || !!draft.current} value={text} onChange={(event) => setText(event.target.value)} /></label>
        <button className="primary-button" disabled={busy || !text.trim()}>{busy ? 'Saving…' : draft.current ? 'Retry same reply' : 'Send reply'}</button>
        <p>Replies are recorded here. Email delivery is not implied. If interrupted, refresh before retrying.</p>
      </form>}
    </>}
  </div>
}
