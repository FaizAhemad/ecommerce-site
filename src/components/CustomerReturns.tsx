import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReturns, submitReturn, type ReturnHistory } from '../api/returns'
import { privateKey, sessionGeneration, assertCurrentSession } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'

export function CustomerReturns({ orderId }: { orderId: string }) {
  const notify = useNotification()
  const queryKey = privateKey('returns', orderId)
  const query = useQuery({ queryKey, queryFn: ({ signal }) => getReturns(orderId, signal), retry: false })
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const lock = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const draft = useRef<{ requestId: string; orderId: string; reason: string } | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current || !query.data?.canRequest || !reason.trim()) return
    lock.current = true
    setBusy(true)
    setAttempted(true)
    draft.current ??= { requestId: crypto.randomUUID(), orderId, reason: reason.trim() }
    const abort = new AbortController()
    controller.current = abort
    const generation = sessionGeneration()
    try {
      const item = await submitReturn(draft.current, abort.signal)
      assertCurrentSession(generation)
      if (abort.signal.aborted) return
      await queryClient.cancelQueries({ queryKey })
      assertCurrentSession(generation)
      if (abort.signal.aborted) return
      queryClient.setQueryData<ReturnHistory>(queryKey, { returns: [item], canRequest: false })
      void queryClient.invalidateQueries({ queryKey: privateKey('admin', 'returns') })
      notify('Return request recorded for review. No refund has been issued.', 'success')
    } catch (error) {
      if (!abort.signal.aborted && generation === sessionGeneration())
        notify(error instanceof Error ? error : new Error('Check return status before retrying.'))
    } finally {
      lock.current = false
      if (!abort.signal.aborted) setBusy(false)
    }
  }
  const labels: Record<string, string> = { REQUESTED: 'Awaiting review', APPROVED: 'Approved', REJECTED: 'Rejected', REFUNDED: 'Refund recorded' }
  return <section aria-label="Return requests">
    <h2>Return request</h2>
    <p>Requests are reviewed under the <a href="/returns">returns policy</a>. Submitting a request does not guarantee eligibility, collection or a refund.</p>
    {query.isPending && <p role="status">Loading return status…</p>}
    {query.isError && <p role="alert">Unable to load return status. Your order is still available above.</p>}
    <button type="button" className="secondary-button" disabled={busy || query.isFetching}
      onClick={() => void query.refetch({ cancelRefetch: false })}>{query.isFetching ? 'Checking…' : 'Refresh return status'}</button>
    {query.data?.returns.map((item) => <article className="record-card" key={item.id}>
      <h3>{Object.hasOwn(labels, item.status) ? labels[item.status] : 'Status unavailable'}</h3>
      <p>Request {item.id}</p>
      <p>{item.reason}</p>
      {item.resolution && <p>Decision: {item.resolution}</p>}
      <p>Submitted {new Date(item.createdAt).toLocaleDateString()}</p>
      {item.status === 'APPROVED' && <p>Approval does not confirm a refund or collection. Contact support for next steps.</p>}
    </article>)}
    {query.data?.canRequest && <form className="admin-form" onSubmit={(event) => void submit(event)}>
      <label>Reason for requesting a return
        <textarea required maxLength={2000} rows={4} value={reason} disabled={busy || attempted}
          onChange={(event) => setReason(event.target.value)} />
      </label>
      <button className="primary-button" disabled={busy || query.isFetching || !reason.trim()}>
        {busy ? 'Recording request…' : attempted ? 'Retry same request' : 'Submit return request'}
      </button>
      {attempted && <p>A retry uses the original reason and request ID. Refresh status before retrying; if you need to change the request, contact support.</p>}
    </form>}
    {query.data && !query.data.canRequest && !query.data.returns.length && <p>Return requests are available after delivery. For other issues, <a href="/support">contact support</a>.</p>}
    {!!query.data?.returns.length && <p>For additional details or help with this request, <a href="/support">contact support</a>.</p>}
  </section>
}
