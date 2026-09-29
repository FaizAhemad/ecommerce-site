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
  return <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-label="Return requests">
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">After delivery</p>
      <h2 className="!mb-2 !mt-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!text-2xl">Returns</h2>
      <p className="mb-0 text-sm leading-6 text-[var(--muted)]">Requests are reviewed under the <a className="font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4" href="/returns">returns policy</a>. A request does not guarantee eligibility, collection or a refund.</p>
    </div>
    {query.isPending && <p className="m-0 text-sm text-[var(--muted)]" role="status">Loading return status…</p>}
    {query.isError && <p className="m-0 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-950" role="alert">Unable to load return status. Your order is still available above.</p>}
    <button type="button" className="secondary-button w-fit" disabled={busy || query.isFetching}
      onClick={() => void query.refetch({ cancelRefetch: false })}>{query.isFetching ? 'Checking…' : 'Refresh return status'}</button>
    {query.data?.returns.map((item) => <article className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4" key={item.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="!m-0 !text-base !font-semibold !tracking-normal text-[var(--ink)]">{Object.hasOwn(labels, item.status) ? labels[item.status] : 'Status unavailable'}</h3>
        <time className="text-xs text-[var(--muted)]" dateTime={item.createdAt}>Submitted {new Date(item.createdAt).toLocaleDateString()}</time>
      </div>
      <p className="mb-1 mt-3 text-sm leading-6 text-[var(--ink)]">{item.reason}</p>
      {item.resolution && <p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">Decision: {item.resolution}</p>}
      {item.status === 'APPROVED' && <p className="mb-0 mt-2 text-sm leading-6 text-[var(--muted)]">Approval does not confirm a refund or collection. Contact support for next steps.</p>}
    </article>)}
    {query.data?.canRequest && <form className="grid gap-4 border-t border-[var(--line)] pt-4" onSubmit={(event) => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Reason for requesting a return
        <textarea className="min-h-28 w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-base leading-6 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-60" required maxLength={2000} rows={4} value={reason} disabled={busy || attempted}
          onChange={(event) => setReason(event.target.value)} />
      </label>
      <button className="primary-button w-fit" disabled={busy || query.isFetching || !reason.trim()}>
        {busy ? 'Recording request…' : attempted ? 'Retry same request' : 'Submit return request'}
      </button>
      {attempted && <p className="m-0 text-sm leading-6 text-[var(--muted)]">A retry uses the original reason and request ID. Refresh status before retrying; if you need to change the request, contact support.</p>}
    </form>}
    {query.data && !query.data.canRequest && !query.data.returns.length && <p className="m-0 text-sm leading-6 text-[var(--muted)]">Return requests are available after delivery. For other issues, <a className="font-medium text-[var(--ink)] underline" href="/support">contact support</a>.</p>}
    {!!query.data?.returns.length && <p className="m-0 text-sm leading-6 text-[var(--muted)]">For additional details or help with this request, <a className="font-medium text-[var(--ink)] underline" href="/support">contact support</a>.</p>}
  </section>
}
