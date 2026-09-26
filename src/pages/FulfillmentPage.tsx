import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { FormDialog } from '../components/FormDialog'
import { useNotification } from '../components/NotificationProvider'
import { SellerNavigation } from '../components/SellerNavigation'
import { ShopInspection, type InspectionView } from '../components/ShopInspection'
type Order = { id: string; orderNumber: string; shopName: string; status: string; version: number; carrier: string | null; trackingCode: string | null; currency: string; isPlatform: boolean; usesScopedFulfillment: boolean; canFulfill?: boolean; supportStatus?: string | null; inspectionStatus?: string | null }
type Return = { id: string; status: string; reason: string; resolution: string; version: number }
type Dispute = { status: string; version: number; messages: { id: string; audience: string; body: string; createdAt: string }[] }
type Detail = { inspection: InspectionView | null; order: Order; items: { id: string; productName: string; quantity: number; unitPriceMinor: number }[]; events: { id: string; status: string; reason: string; createdAt: string }[]; returnRequest: Return | null; dispute: Dispute | null; address: { name: string; line1: string; line2: string | null; city: string; state: string; postalCode: string; country: string; phone: string | null } | null }
async function read<T>(path: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(path, init), body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load fulfillment.')
  return body as T
}
const nextStatus: Record<string, string> = { PENDING: 'PACKING', PACKING: 'SHIPPED', SHIPPED: 'DELIVERED' }
export function FulfillmentPage({ audience }: { audience: 'seller' | 'admin' | 'customer' }) {
  const customer = audience === 'customer'
  const endpoint = audience === 'admin' ? '/api/admin/fulfillment' : customer ? '/api/orders/fulfillment' : '/api/seller/fulfillment'
  const notify = useNotification(), lock = useRef(false), controller = useRef<AbortController | null>(null), requestId = useRef('')
  const [page, setPage] = useState(0), [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [reason, setReason] = useState(''), [carrier, setCarrier] = useState(''), [tracking, setTracking] = useState('')
  const [returnDecision, setReturnDecision] = useState('APPROVED')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportOnly, setSupportOnly] = useState(false)
  const [inspectionOnly, setInspectionOnly] = useState(false)
  const list = useQuery({ queryKey: privateKey('fulfillment', audience, page, supportOnly, inspectionOnly), retry: false,
    queryFn: ({ signal }) => read<{ orders: Order[]; nextPage: number | null }>(`${endpoint}?page=${page}&supportOnly=${supportOnly ? '1' : '0'}&inspectionOnly=${inspectionOnly ? '1' : '0'}`, { signal }),
  })
  const detail = useQuery({ queryKey: privateKey('fulfillment-detail', audience, selected), retry: false, enabled: !!selected, refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: ({ signal }) => read<Detail>(`${endpoint}?id=${encodeURIComponent(selected!)}`, { signal }),
  })
  useEffect(() => () => controller.current?.abort(), [])
  function open(order: Order) {
    setSupportMessage('')
    setSelected(order.id); setReason(''); setCarrier(order.carrier ?? ''); setTracking(order.trackingCode ?? ''); setError(''); setReturnDecision('APPROVED'); requestId.current = crypto.randomUUID()
  }
  async function save(action: string, status?: string) {
    const data = detail.data
    if (!data || lock.current) return
    lock.current = true; setBusy(true); setError('')
    const abort = new AbortController(), generation = sessionGeneration()
    controller.current = abort
    try {
      await read(endpoint, { method: 'POST', signal: AbortSignal.any([abort.signal, sessionSignal()]), headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.order.id, action, status, reason: action.startsWith('support-') ? supportMessage : reason, carrier, trackingCode: tracking, requestId: requestId.current, expectedVersion: action.startsWith('support-') ? data.dispute?.version ?? 0 : action === 'review-return' ? data.returnRequest?.version : data.order.version }),
      })
      if (abort.signal.aborted || generation !== sessionGeneration()) return
      notify('Record updated. No refund or automatic restock was performed.', 'success')
      setReason('')
      if (action.startsWith('support-')) setSupportMessage('')
      requestId.current = crypto.randomUUID()
      await Promise.all([detail.refetch(), list.refetch()])
    } catch (failure) {
      if (!abort.signal.aborted && generation === sessionGeneration()) setError(failure instanceof Error ? failure.message : 'Unable to confirm update. Refresh first.')
    } finally { lock.current = false; if (!abort.signal.aborted && generation === sessionGeneration()) setBusy(false) }
  }
  const data = detail.isError ? undefined : detail.data
  return <section className="page-section"><p className="eyebrow">Shop fulfillment</p><h1>{customer ? 'My shop shipments and returns' : audience === 'admin' ? 'Marketplace fulfillment oversight' : 'My shop orders'}</h1>
    {customer ? <a className="secondary-button" href="/orders">Back to orders</a> : <SellerNavigation admin={audience === 'admin'} />}
    <p>Each shop handles its own items, shipment and returns. A shop update does not change another shop or confirm any payment/refund.</p>
    <button className="secondary-button" disabled={busy || list.isFetching} onClick={() => void list.refetch()}>Refresh orders</button>
    <label><input type="checkbox" checked={inspectionOnly} disabled={busy} onChange={event => { setInspectionOnly(event.target.checked); setPage(0) }} /> Show inspections only</label>
<label><input type="checkbox" checked={supportOnly} disabled={busy} onChange={event => { setSupportOnly(event.target.checked); setPage(0) }} /> Show support conversations only</label>
    {list.isPending && <p role="status">Loading shop orders…</p>}{list.isError && <p role="alert">Shop orders are unavailable. Refresh to retry.</p>}
    {list.isSuccess && !list.data.orders.length && <p>No shop orders on this page.</p>}
    {!list.isError && list.data?.orders.map(order => <article className="record-card" key={order.id}><h2>{order.orderNumber}</h2><p>{order.shopName} · {order.status}</p>{order.inspectionStatus && <p>Inspection: {order.inspectionStatus.replaceAll('_', ' ')}</p>}{order.supportStatus && <p>Support: {order.supportStatus}</p>}<p>{order.carrier ?? 'Not dispatched'}{order.trackingCode ? ` · ${order.trackingCode}` : ''}</p><button className="secondary-button" onClick={() => open(order)}>View shop order</button></article>)}
    <div className="profile-actions"><button className="secondary-button" disabled={busy || list.isFetching || page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary-button" disabled={busy || list.isFetching || list.data?.nextPage == null} onClick={() => setPage(list.data?.nextPage ?? page)}>Next</button></div>
    <FormDialog open={!!selected} title={data ? `${data.order.shopName} — ${data.order.orderNumber}` : 'Shop order'} busy={busy} onClose={() => setSelected(null)}>
      {detail.isPending && <p role="status">Loading details…</p>}{detail.isError && <p role="alert">Order details unavailable.</p>}
      <button className="secondary-button" disabled={busy || detail.isFetching} onClick={() => void detail.refetch()}>Refresh details</button>
      {data && <>
        <p>Shop status: {data.order.status}</p>{customer && !data.order.usesScopedFulfillment && <p>For Gadgify returns, open the original order in <a href="/orders">Your orders</a>.</p>}
        {data.items.map(item => <article className="record-card" key={item.id}><h3>{item.productName}</h3><p>Quantity {item.quantity} · Unit price {data.order.currency} {(item.unitPriceMinor / 100).toFixed(2)}</p></article>)}
        {data.address && <section><h3>Delivery address</h3><p>{data.address.name}<br />{data.address.line1} {data.address.line2}<br />{data.address.city}, {data.address.state} {data.address.postalCode}<br />{data.address.country}{data.address.phone && <><br />{data.address.phone}</>}</p></section>}
        {!customer && !data.order.usesScopedFulfillment && <p>Gadgify shipments are managed in <a href="/admin">Admin → Shipments</a>. Their status is reflected here.</p>}
        {data.returnRequest && <article className="record-card"><h3>Return: {data.returnRequest.status}</h3><p>{data.returnRequest.reason}</p><p>{data.returnRequest.resolution}</p><p>Return acceptance or receipt does not mean a refund has been issued.</p></article>}
        <form className="auth-form" onSubmit={(event: FormEvent) => event.preventDefault()}>
          {((!customer && data.order.canFulfill && nextStatus[data.order.status]) || (customer && data.order.usesScopedFulfillment && data.order.status === 'DELIVERED' && !data.returnRequest) || (data.returnRequest && ['REQUESTED','APPROVED'].includes(data.returnRequest.status))) && <label>{customer && !data.returnRequest ? 'Return reason' : 'Reason / update visible to the customer'}<textarea minLength={3} maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>}
          {!customer && data.order.canFulfill && nextStatus[data.order.status] && <>
            {data.order.status === 'PACKING' && <><label>Carrier<input maxLength={100} value={carrier} disabled={busy} onChange={event => setCarrier(event.target.value)} /></label><label>Tracking reference<input maxLength={150} value={tracking} disabled={busy} onChange={event => setTracking(event.target.value)} /></label></>}
            <button type="button" className="primary-button" disabled={busy || reason.trim().length < 3 || (nextStatus[data.order.status] === 'SHIPPED' && data.inspection?.holdsDispatch === true)} onClick={() => void save('fulfill', nextStatus[data.order.status])}>Mark {nextStatus[data.order.status].toLowerCase()}</button>
          </>}
          {customer && data.order.usesScopedFulfillment && data.order.status === 'DELIVERED' && !data.returnRequest && <button type="button" className="primary-button" disabled={busy || reason.trim().length < 3} onClick={() => void save('request-return')}>Request return for these shop items</button>}
          {customer && data.returnRequest?.status === 'REQUESTED' && <button type="button" className="secondary-button" disabled={busy || reason.trim().length < 3} onClick={() => void save('review-return', 'CANCELLED')}>Cancel return request</button>}
          {!customer && data.returnRequest?.status === 'REQUESTED' && <><label>Return decision<select value={returnDecision} disabled={busy} onChange={event => setReturnDecision(event.target.value)}><option value="APPROVED">Approve return</option><option value="REJECTED">Reject return</option></select></label><button type="button" className="primary-button" disabled={busy || reason.trim().length < 3} onClick={() => void save('review-return', returnDecision)}>Save return decision</button></>}
          {!customer && data.returnRequest?.status === 'APPROVED' && <button type="button" className="primary-button" disabled={busy || reason.trim().length < 3} onClick={() => void save('review-return', 'RECEIVED')}>Confirm returned items received</button>}
          {busy && <p role="status">Saving update…</p>}{error && <p role="alert">{error}</p>}
        </form>
        <ShopInspection key={data.order.id} orderId={data.order.id} endpoint={endpoint} audience={audience} inspection={data.inspection} eligible={!data.order.isPlatform && ['PENDING', 'PACKING'].includes(data.order.status)} busy={busy} lock={lock} onBusy={setBusy} onSaved={() => Promise.all([detail.refetch(), list.refetch()])} />
<section aria-label="Shop order support">
          <h3>Support and disputes</h3>
          <p>Messages are shared with this shop, the customer and Gadgify administrators. Do not include passwords or payment details. Resolving a dispute does not issue a refund.</p>
          {data.dispute && <p>Status: {data.dispute.status}</p>}
          {data.dispute?.messages.map(message => <article className="record-card" key={message.id}><strong>{message.audience === 'admin' ? 'Gadgify support' : message.audience === 'seller' ? 'Shop' : 'Customer'}</strong><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</p><small>{new Date(message.createdAt).toLocaleString()}</small></article>)}
          {data.dispute?.status !== 'RESOLVED' ? <div className="auth-form">
            <label>Support message<textarea minLength={3} maxLength={1000} disabled={busy} value={supportMessage} onChange={event => setSupportMessage(event.target.value)} /></label>
            <div className="profile-actions">
              <button type="button" className="primary-button" disabled={busy || supportMessage.trim().length < 3} onClick={() => void save(data.dispute ? 'support-reply' : 'support-open')}>{data.dispute ? 'Send message' : 'Start support conversation'}</button>
              {data.dispute?.status === 'OPEN' && <button type="button" className="secondary-button" disabled={busy || supportMessage.trim().length < 3} onClick={() => void save('support-escalate')}>Escalate to Gadgify</button>}
              {audience === 'admin' && data.dispute && <button type="button" className="secondary-button" disabled={busy || supportMessage.trim().length < 3} onClick={() => void save('support-resolve')}>Resolve with this explanation</button>}
            </div>
          </div> : <p>This dispute is resolved. <a href="/support">Contact Gadgify</a> if you need further help.</p>}
        </section>
        <h3>Recent updates</h3>{!data.events.length && <p>No shop-specific updates recorded.</p>}
        {data.events.map(event => <article className="record-card" key={event.id}><strong>{event.status}</strong><p>{event.reason}</p><small>{new Date(event.createdAt).toLocaleString()}</small></article>)}
      </>}
    </FormDialog>
  </section>
}
