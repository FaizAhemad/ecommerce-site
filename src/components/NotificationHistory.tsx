import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
type Item = { id: string; orderId: string; kind: string; status: string; updatedAt: string; attempts?: number; availableAt?: string; legacy: boolean }
const labels: Record<string, string> = { ACCEPTED: 'Provider accepted', PENDING: 'Queued', PROCESSING: 'Processing', RETRY: 'Waiting to retry', FAILED: 'Provider rejected', UNCONFIRMED: 'Unconfirmed — investigate before taking action', SKIPPED: 'Skipped — verified recipient unavailable', BLOCKED: 'Blocked — configuration requires investigation' }
export function NotificationHistory() {
  const lock = useRef(false)
  const active = useRef<AbortController | null>(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => () => active.current?.abort(), [])
  const query = useInfiniteQuery({ queryKey: privateKey('admin', 'notifications'), initialPageParam: 0, retry: false,
    queryFn: async ({ signal, pageParam }) => {
      const response = await apiFetch('/api/admin/notifications?page=' + pageParam, { signal })
      const body = await response.json() as { notifications: Item[]; nextPage: number | null; configured: boolean; supportConfigured?: boolean }
      if (!response.ok || !Array.isArray(body.notifications)) throw new Error('Unable to load notification history.')
      return body
    }, getNextPageParam: (page) => page.nextPage ?? undefined,
  })
  const items = [...new Map((query.data?.pages.flatMap((page) => page.notifications) ?? []).map((item) => [item.id, item])).values()]
  async function processDue() {
    if (lock.current) return
    lock.current = true
    const generation = sessionGeneration()
    const controller = new AbortController()
    active.current = controller
    setProcessing(true)
    setMessage('')
    try {
      const response = await apiFetch('/api/admin/notifications', { method: 'POST', signal: AbortSignal.any([controller.signal, sessionSignal()]) })
      if (!response.ok) throw new Error('Processing outcome is uncertain. Refresh history before taking further action.')
      if (generation !== sessionGeneration() || controller.signal.aborted) return
      setMessage('Due batch processed. Check individual statuses; acceptance does not confirm delivery.')
      await query.refetch({ cancelRefetch: false })
    } catch {
      if (generation === sessionGeneration() && !controller.signal.aborted) setMessage('Unable to confirm processing. Refresh notification history.')
    } finally {
      lock.current = false
      if (generation === sessionGeneration() && !controller.signal.aborted) setProcessing(false)
    }
  }
  return <>
    <p>Order, delivery and dispute emails. Accepted does not confirm inbox delivery. Queued messages support bounded retries; legacy and unconfirmed attempts are never replayed automatically.</p>
    {query.data?.pages[0]?.supportConfigured === false && <p role="status">The private support inbox is not configured. Staff dispute notifications will wait; saved conversations remain available.</p>}
    {query.data?.pages[0]?.configured === false && <p role="status">Email provider configuration is missing. Queued messages wait for configuration.</p>}
    <button className="secondary-button" disabled={processing || !query.data?.pages[0]?.configured} onClick={() => void processDue()}>{processing ? 'Processing…' : 'Process due notifications'}</button>
    {message && <p role="status">{message}</p>}
    <button className="secondary-button" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh notification history</button>
    {query.isPending && <p role="status">Loading notifications…</p>}
    {query.isError && <p role="alert">Notification history is unavailable.</p>}
    {!query.isPending && !query.isError && !items.length && <p>No notification records.</p>}
    {items.map((item) => <article className="record-card" key={item.id}><h3>{item.kind.replaceAll('_', ' ')}</h3><p>Order ID: {item.orderId}</p><p>{labels[item.status] ?? 'Unknown status'}{item.legacy ? ' (legacy attempt)' : ''}</p>{item.attempts !== undefined && <p>Attempts: {item.attempts} / 5</p>}{item.status === 'RETRY' && item.availableAt && <p>Eligible after: {new Date(item.availableAt).toLocaleString()}</p>}<small>{new Date(item.updatedAt).toLocaleString()}</small></article>)}
    {query.hasNextPage && <button className="secondary-button" disabled={query.isFetching} onClick={() => void query.fetchNextPage({ cancelRefetch: false })}>Load more notifications</button>}
  </>
}
