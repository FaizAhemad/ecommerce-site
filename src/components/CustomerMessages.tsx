import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'
type Message = {
  id: string
  recipientEmail: string
  subject: string
  body: string
  status: string
  createdAt: string
}
export function CustomerMessages() {
  const notify = useNotification(),
    lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    attempt = useRef<string | null>(null)
  const [pending, setPending] = useState(false),
    [saved, setSaved] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [sendError, setSendError] = useState('')
  const [outcome, setOutcome] = useState('')
  const [cursors, setCursors] = useState<string[]>([])
  const cursor = cursors.at(-1)
  const query = useQuery({
    queryKey: privateKey('admin', 'messages', cursor ?? ''),
    queryFn: async ({ signal }) => {
      const response = await apiFetch(`/api/admin/messages${cursor ? `?before=${encodeURIComponent(cursor)}` : ''}`, { signal })
      if (!response.ok) throw new Error('Unable to load message history.')
      return (await response.json()) as { messages: Message[]; nextCursor: string | null }
    },
    retry: false,
  })
  useEffect(() => () => controller.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || saved) return
    const data = new FormData(event.currentTarget)
    attempt.current ??= crypto.randomUUID()
    lock.current = true
    setPending(true)
    setSendError('')
    const abort = new AbortController(), generation = sessionGeneration()
    controller.current = abort
    try {
      const response = await apiFetch('/api/admin/messages', {
        method: 'POST',
        signal: AbortSignal.any([abort.signal, sessionSignal()]),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: attempt.current,
          recipientEmail: data.get('email'),
          subject: data.get('subject'),
          body: data.get('body'),
        }),
      })
      const body = (await response.json()) as {
        message?: { status: string }
        error?: { message?: string }
      }
      if (!response.ok || !body.message)
        throw new Error(
          body.error?.message ?? 'Unable to confirm the message. Check history before retrying.',
        )
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        setSaved(true)
        setOutcome(body.message.status === 'ACCEPTED' ? 'Email accepted by the provider. Delivery is not confirmed.' : 'Message saved; email acceptance is unconfirmed. Check history before sending another message.')
        notify(
          body.message.status === 'ACCEPTED'
            ? 'Email accepted by the provider.'
            : 'Message saved; email acceptance is unconfirmed.',
          body.message.status === 'ACCEPTED' ? 'success' : 'info',
        )
        if (cursors.length) setCursors([])
        else void query.refetch({ cancelRefetch: false })
      }
    } catch (error) {
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        const failure = error instanceof Error ? error : new Error('Unable to confirm message acceptance.')
        setSendError(failure.message)
        notify(failure)
      }
    } finally {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setPending(false)
    }
  }
  return (
    <>
      <div className="profile-actions">
        <button type="button" className="primary-button" onClick={() => setComposerOpen(true)}>
          {saved ? 'View recorded message' : hasDraft ? 'Continue message draft' : 'Write a customer message'}
        </button>
      </div>
      <FormDialog open={composerOpen} title="Customer message" busy={pending} onClose={() => { if (!lock.current) setComposerOpen(false) }}>
      <form className="admin-form" onChange={() => setHasDraft(true)} onSubmit={(event) => void submit(event)}>
        <label>
          Verified customer email
          <input name="email" type="email" maxLength={254} required disabled={pending || saved} />
        </label>
        <label>
          Subject
          <input name="subject" maxLength={120} required disabled={pending || saved} />
        </label>
        <label className="full">
          Message
          <textarea name="body" rows={6} maxLength={4000} required disabled={pending || saved} />
        </label>
        <button className="primary-button" disabled={pending || saved}>
          {pending ? 'Sending…' : saved ? 'Message recorded' : 'Send message'}
        </button>
        {saved && (
          <button
            type="reset"
            className="secondary-button"
            onClick={() => {
              attempt.current = null
              setSaved(false)
              setHasDraft(false)
              setSendError('')
              setOutcome('')
            }}
          >
            Write another message
          </button>
        )}
        {sendError && <p className="full" role="alert">{sendError}</p>}
        {outcome && <p className="full" role="status">{outcome}</p>}
        <p className="full">
          Provider acceptance does not confirm inbox delivery. After an interrupted request, check
          history before sending again.
        </p>
        {!saved && <p className="full">Closing this drawer keeps the draft while this panel remains open.</p>}
      </form>
      </FormDialog>
      <h3>Message history</h3>
      <div className="profile-actions">
        <button className="secondary-button" disabled={pending || query.isFetching || cursors.length === 0} onClick={() => setCursors(values => values.slice(0, -1))}>Newer messages</button>
        <button className="secondary-button" disabled={pending || query.isFetching || query.isError || !query.data?.nextCursor} onClick={() => { if (query.data?.nextCursor) setCursors(values => [...values, query.data.nextCursor!]) }}>Older messages</button>
        <button className="secondary-button" disabled={pending || query.isFetching} onClick={() => { setCursors([]); if (!cursors.length) void query.refetch() }}>Refresh latest</button>
      </div>
      {query.isPending ? (
        <p role="status">Loading messages…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>Unable to load history.</p>
          <button
            className="secondary-button"
            disabled={query.isFetching}
            onClick={() => void query.refetch({ cancelRefetch: false })}
          >
            Retry
          </button>
        </div>
      ) : !query.data?.messages.length ? (
        <p>No messages recorded.</p>
      ) : (
        query.data.messages.map((message) => (
          <article className="record-card" key={message.id}>
            <strong>{message.subject}</strong>
            <p>{message.recipientEmail}</p>
            <p>{message.body}</p>
            <p>
              {['ACCEPTED', 'SENT'].includes(message.status)
                ? 'Provider accepted (delivery unverified)'
                : 'Email acceptance unconfirmed'}{' '}
              · {new Date(message.createdAt).toLocaleString()}
            </p>
          </article>
        ))
      )}
    </>
  )
}
