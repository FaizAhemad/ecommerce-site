import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
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
  const query = useQuery({
    queryKey: privateKey('admin', 'messages'),
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/admin/messages', { signal })
      if (!response.ok) throw new Error('Unable to load message history.')
      return (await response.json()) as { messages: Message[] }
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
    const abort = new AbortController()
    controller.current = abort
    try {
      const response = await apiFetch('/api/admin/messages', {
        method: 'POST',
        signal: abort.signal,
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
      if (!abort.signal.aborted) {
        setSaved(true)
        notify(
          body.message.status === 'ACCEPTED'
            ? 'Email accepted by the provider.'
            : 'Message saved; email acceptance is unconfirmed.',
          body.message.status === 'ACCEPTED' ? 'success' : 'info',
        )
        void query.refetch({ cancelRefetch: false })
      }
    } catch (error) {
      if (!abort.signal.aborted)
        notify(error instanceof Error ? error : new Error('Unable to confirm message acceptance.'))
    } finally {
      lock.current = false
      if (!abort.signal.aborted) setPending(false)
    }
  }
  return (
    <>
      <form className="admin-form" onSubmit={(event) => void submit(event)}>
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
            }}
          >
            Write another message
          </button>
        )}
        <p>
          Provider acceptance does not confirm inbox delivery. After an interrupted request, check
          history before sending again.
        </p>
      </form>
      <h3>Latest messages (up to 100)</h3>
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
          <article className="state-message" key={message.id}>
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
