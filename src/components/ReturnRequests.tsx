import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
type ReturnItem = {
  id: string
  reason: string
  status: string
  resolution: string | null
  createdAt: string
  order: { orderNumber: string }
  user: { name: string | null; email: string | null }
}
export function ReturnRequests() {
  const notify = useNotification(),
    lock = useRef(false),
    controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  const query = useQuery({
    queryKey: privateKey('admin', 'returns'),
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/admin/returns', { signal })
      if (!response.ok) throw new Error('Unable to load return requests.')
      return (await response.json()) as { returns: ReturnItem[] }
    },
    retry: false,
  })
  useEffect(() => () => controller.current?.abort(), [])
  async function review(item: ReturnItem, form: HTMLFormElement) {
    if (lock.current) return false
    lock.current = true
    setPending(true)
    const data = new FormData(form),
      abort = new AbortController()
    controller.current = abort
    try {
      const response = await apiFetch('/api/admin/returns', {
        method: 'PATCH',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: item.id,
          expectedStatus: item.status,
          status: data.get('status'),
          resolution: data.get('resolution'),
        }),
      })
      const body = (await response.json()) as { error?: { message?: string } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to save the decision.')
      if (!abort.signal.aborted) {
        notify('Return decision recorded. No refund or stock change was made.', 'success')
        void query.refetch({ cancelRefetch: false })
        return true
      }
    } catch (error) {
      if (!abort.signal.aborted)
        notify(error instanceof Error ? error : new Error('Unable to save the decision.'))
    } finally {
      lock.current = false
      if (!abort.signal.aborted) setPending(false)
    }
    return false
  }
  if (query.isPending) return <p role="status">Loading return requests…</p>
  if (query.isError)
    return (
      <div role="alert">
        <p>Unable to load return requests.</p>
        <button
          className="secondary-button"
          disabled={query.isFetching}
          onClick={() => void query.refetch({ cancelRefetch: false })}
        >
          Retry
        </button>
      </div>
    )
  if (!query.data?.returns.length) return <p>No return requests recorded.</p>
  return (
    <>
      <p>
        Latest 100 requests. Review each request against the approved policy. Approval does not
        refund money or restock items.
      </p>
      {query.data.returns.map((item) => (
        <ReturnReview key={item.id + item.status} item={item} disabled={pending} review={review} />
      ))}
    </>
  )
}
function ReturnReview({
  item,
  disabled,
  review,
}: {
  item: ReturnItem
  disabled: boolean
  review: (item: ReturnItem, form: HTMLFormElement) => Promise<boolean>
}) {
  const [saved, setSaved] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (await review(item, event.currentTarget)) setSaved(true)
  }
  return (
    <article className="state-message">
      <h3>Order {item.order.orderNumber}</h3>
      <p>
        {item.user.name ?? 'Customer'} {item.user.email}
      </p>
      <p>{item.reason}</p>
      <p>Status: {item.status}</p>
      {item.resolution && <p>Decision: {item.resolution}</p>}
      {item.status === 'REQUESTED' && !saved && (
        <form className="admin-form" onSubmit={(event) => void submit(event)}>
          <label>
            Decision
            <select name="status" required disabled={disabled} defaultValue="">
              <option value="" disabled>
                Choose a decision
              </option>
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
          </label>
          <label>
            Reason
            <textarea name="resolution" maxLength={2000} required disabled={disabled} />
          </label>
          <button className="primary-button" disabled={disabled}>
            {disabled ? 'Saving…' : 'Record decision'}
          </button>
        </form>
      )}
      {saved && <p role="status">Decision saved.</p>}
    </article>
  )
}
