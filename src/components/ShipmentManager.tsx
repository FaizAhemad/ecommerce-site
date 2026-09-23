import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, assertCurrentSession } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
type ShipmentOrder = { id: string; orderNumber: string; status: string; shipment: null | {
  carrier: string | null; trackingCode: string | null; status: string; updatedAt: string
} }
export function ShipmentManager() {
  const [lookup, setLookup] = useState(''), [draftLookup, setDraftLookup] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false), controller = useRef<AbortController | null>(null)
  const notify = useNotification()
  useEffect(() => () => controller.current?.abort(), [])
  const query = useQuery({ queryKey: privateKey('admin', 'shipment', lookup), enabled: !!lookup, retry: false,
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/admin/shipments?order=' + encodeURIComponent(lookup), { signal })
      const body = await response.json() as { order?: ShipmentOrder; error?: { message?: string } }
      if (!response.ok || !body.order) throw new Error(body.error?.message ?? 'Unable to load shipment.')
      return body.order
    },
  })
  async function save(event: FormEvent<HTMLFormElement>, order: ShipmentOrder) {
    event.preventDefault()
    if (lock.current) return
    const fields = new FormData(event.currentTarget)
    lock.current = true
    setBusy(true)
    const abort = new AbortController(), generation = sessionGeneration()
    controller.current = abort
    try {
      const response = await apiFetch('/api/admin/shipments', { method: 'PATCH', signal: abort.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id,
          expectedOrderStatus: order.status, expectedUpdatedAt: order.shipment?.updatedAt ?? null,
          carrier: fields.get('carrier'), trackingCode: fields.get('trackingCode'), status: fields.get('status'), description: fields.get('description'),
        }),
      })
      const body = await response.json() as { shipment?: unknown; emailStatus?: string; error?: { message?: string } }
      if (!response.ok || !body.shipment) throw new Error(body.error?.message ?? 'Unable to confirm shipment. Reload before retrying.')
      assertCurrentSession(generation)
      if (abort.signal.aborted) return
      notify(body.emailStatus === 'UNCONFIRMED'
        ? 'Shipment saved. Customer email is unconfirmed; do not repeat the shipment update to resend it.'
        : body.emailStatus === 'ACCEPTED' ? 'Shipment saved. Email accepted by the provider; delivery is not yet confirmed.'
        : 'Shipment update recorded. Payment status is unchanged.', body.emailStatus === 'UNCONFIRMED' ? 'info' : 'success')
      void queryClient.invalidateQueries({ queryKey: privateKey('order', order.id) })
      void queryClient.invalidateQueries({ queryKey: privateKey('orders') })
      void query.refetch({ cancelRefetch: false })
    } catch (error) {
      if (!abort.signal.aborted && generation === sessionGeneration()) notify(error instanceof Error ? error : new Error('Unable to update shipment.'))
    } finally { lock.current = false; if (!abort.signal.aborted) setBusy(false) }
  }
  return <>
    <p>Record updates from your delivery process. These are manual records, not live carrier confirmation. Do not include private customer information in tracking notes.</p>
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); if (!busy) setLookup(draftLookup.trim()) }}>
      <label>Order number or ID<input required maxLength={128} value={draftLookup} disabled={busy} onChange={(event) => setDraftLookup(event.target.value)} /></label>
      <button className="secondary-button" disabled={busy || query.isFetching}>Find order</button>
    </form>
    {lookup && query.isPending && <p role="status">Loading shipment…</p>}
    {query.isError && <p role="alert">{query.error.message}</p>}
    {lookup && <button className="secondary-button" disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Reload shipment</button>}
    {query.data && <form key={query.data.id + (query.data.shipment?.updatedAt ?? query.data.status)} className="admin-form" onSubmit={(event) => void save(event, query.data!)}>
      <h3>{query.data.orderNumber} · {query.data.status}</h3>
      <label>Carrier or delivery service<input name="carrier" required maxLength={100} defaultValue={query.data.shipment?.carrier ?? ''} disabled={busy} /></label>
      <label>Tracking reference<input name="trackingCode" maxLength={150} defaultValue={query.data.shipment?.trackingCode ?? ''} disabled={busy} /></label>
      <label>Shipment status<select name="status" defaultValue={query.data.shipment?.status ?? 'PENDING'} disabled={busy}>
        {['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
      </select></label>
      <label>Customer-visible tracking update<textarea name="description" required rows={3} maxLength={1000} disabled={busy} /></label>
      <p>Dispatch requires a tracking reference. Status cannot move backwards after delivery. A failed or interrupted save must be checked using Reload shipment before retrying.</p>
      <button className="primary-button" disabled={busy || query.isFetching}>{busy ? 'Saving shipment…' : 'Save shipment update'}</button>
    </form>}
  </>
}
