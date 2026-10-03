import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { FormDialog } from '../components/FormDialog'
import { useNotification } from '../components/NotificationProvider'
import { SellerNavigation } from '../components/SellerNavigation'
import { ShopInspection, type InspectionView } from '../components/ShopInspection'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Checkbox } from '../components/mui/Checkbox'
import { Chip } from '../components/mui/Chip'
import { CircularProgress } from '../components/mui/CircularProgress'
import { FormControl } from '../components/mui/FormControl'
import { FormControlLabel } from '../components/mui/FormControlLabel'
import { InputLabel } from '../components/mui/InputLabel'
import { MenuItem } from '../components/mui/MenuItem'
import { Paper } from '../components/mui/Paper'
import { Select } from '../components/mui/Select'
import { Stack } from '../components/mui/Stack'
import { TextField } from '../components/mui/TextField'
import { Typography } from '../components/mui/Typography'
type Order = { id: string; orderNumber: string; shopName: string; status: string; version: number; carrier: string | null; trackingCode: string | null; currency: string; isPlatform: boolean; usesScopedFulfillment: boolean; canFulfill?: boolean; supportStatus?: string | null; inspectionStatus?: string | null }
type Return = { id: string; status: string; reason: string; resolution: string; version: number }
type Dispute = { status: string; version: number; messages: { id: string; audience: string; body: string; createdAt: string }[] }
type Detail = { inspection: InspectionView | null; order: Order; items: { id: string; productName: string; quantity: number; unitPriceMinor: number; discountMinor?: number; feeType?: string | null; feeValue?: number | null; feeAmountMinor?: number; feeStatus?: string }[]; events: { id: string; status: string; reason: string; createdAt: string }[]; returnRequest: Return | null; dispute: Dispute | null; address: { name: string; line1: string; line2: string | null; city: string; state: string; postalCode: string; country: string; phone: string | null } | null }
async function read<T>(path: string, init?: Parameters<typeof apiFetch>[1]): Promise<T> {
  const response = await apiFetch(path, init), body = await response.json()
  if (!response.ok) throw new Error(body.error?.message ?? 'Unable to load fulfillment.')
  return body as T
}
const nextStatus: Record<string, string> = { PENDING: 'PACKING', PACKING: 'SHIPPED', SHIPPED: 'DELIVERED' }
export function FulfillmentPage({ audience, onNavigate }: { audience: 'seller' | 'admin' | 'customer'; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }) {
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
  return <Stack component="main" spacing={2.5} sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}><Stack spacing={1}><Typography variant="overline" color="text.secondary">Shop fulfillment</Typography><Typography component="h1" variant="h3">{customer ? 'My shop shipments and returns' : audience === 'admin' ? 'Marketplace fulfillment oversight' : 'My shop orders'}</Typography></Stack>
    {customer ? <Button component="a" variant="outlined" href="/orders" onClick={onNavigate('/orders')} sx={{ alignSelf: 'flex-start' }}>Back to orders</Button> : <SellerNavigation admin={audience === 'admin'} onNavigate={onNavigate} />}
    <Typography color="text.secondary">Each shop handles its own items, shipment and returns. A shop update does not change another shop or confirm any payment/refund.</Typography>
    <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={busy || list.isFetching} onClick={() => void list.refetch()}>Refresh orders</Button>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><FormControlLabel control={<Checkbox checked={inspectionOnly} disabled={busy} onChange={event => { setInspectionOnly(event.target.checked); setPage(0) }} />} label="Show inspections only" /><FormControlLabel control={<Checkbox checked={supportOnly} disabled={busy} onChange={event => { setSupportOnly(event.target.checked); setPage(0) }} />} label="Show support conversations only" /></Stack>
    {list.isPending && <Paper variant="outlined" role="status" sx={{ p: 3 }}><Typography color="text.secondary">Loading shop orders…</Typography></Paper>}{list.isError && <Alert severity="error" role="alert" action={<Button color="inherit" size="small" onClick={() => void list.refetch()}>Retry</Button>}>Shop orders are unavailable.</Alert>}
    {list.isSuccess && !list.data.orders.length && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No shop orders on this page</Typography><Typography color="text.secondary">Try another filter or check back later.</Typography></Paper>}
    <Stack spacing={1.5}>
    {!list.isError && list.data?.orders.map(order => <Paper variant="outlined" component="article" key={order.id} sx={{ p: { xs: 2, sm: 2.5 } }}><Stack spacing={1.25}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}><Typography component="h2" variant="h6">{order.orderNumber}</Typography><Chip size="small" label={order.status.replaceAll('_', ' ')} /></Stack><Typography variant="body2" color="text.secondary">{order.shopName}</Typography>{order.inspectionStatus && <Typography variant="body2">Inspection: {order.inspectionStatus.replaceAll('_', ' ')}</Typography>}{order.supportStatus && <Typography variant="body2">Support: {order.supportStatus}</Typography>}<Typography variant="body2">{order.carrier ?? 'Not dispatched'}{order.trackingCode ? ` · ${order.trackingCode}` : ''}</Typography><Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => open(order)}>View shop order</Button></Stack></Paper>)}
    </Stack>
    <Stack direction="row" spacing={1}><Button variant="outlined" disabled={busy || list.isFetching || page === 0} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outlined" disabled={busy || list.isFetching || list.data?.nextPage == null} onClick={() => setPage(list.data?.nextPage ?? page)}>Next</Button></Stack>
    <FormDialog open={!!selected} title={data ? `${data.order.shopName} — ${data.order.orderNumber}` : 'Shop order'} busy={busy} onClose={() => setSelected(null)}>
      {detail.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 2 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading details…</Typography></Stack>}{detail.isError && <Alert severity="error" role="alert">Order details unavailable.</Alert>}
      <Button variant="outlined" disabled={busy || detail.isFetching} onClick={() => void detail.refetch()}>Refresh details</Button>
      {data && <>
        <Alert severity="info">Shop status: {data.order.status.replaceAll('_', ' ')}</Alert>{customer && !data.order.usesScopedFulfillment && <Alert severity="info">For Gadgify returns, open the original order in <a href="/orders" onClick={onNavigate('/orders')}>Your orders</a>.</Alert>}
        <Stack spacing={1}>{data.items.map(item => <Paper variant="outlined" component="article" key={item.id} sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography component="h3" variant="subtitle1">{item.productName}</Typography><Typography variant="body2" color="text.secondary">Quantity {item.quantity} · Unit price {data.order.currency} {(item.unitPriceMinor / 100).toFixed(2)}</Typography>{!customer && (item.feeAmountMinor ?? 0) > 0 && <Typography variant="body2">Gadgify fee: {data.order.currency} {((item.feeAmountMinor ?? 0) / 100).toFixed(2)} · {item.feeStatus === 'DUE' ? 'due after successful sale' : item.feeStatus === 'REVERSED' ? 'reversed after full refund' : item.feeStatus === 'VOID' ? 'voided' : 'pending payment or delivery'}</Typography>}</Stack></Paper>)}</Stack>
        {data.address && <Paper component="section" variant="outlined" sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography component="h3" variant="subtitle1">Delivery address</Typography><Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{data.address.name}<br />{data.address.line1} {data.address.line2}<br />{data.address.city}, {data.address.state} {data.address.postalCode}<br />{data.address.country}{data.address.phone && <><br />{data.address.phone}</>}</Typography></Stack></Paper>}
        {!customer && !data.order.usesScopedFulfillment && <Alert severity="info">Gadgify shipments are managed in <a href="/admin" onClick={onNavigate('/admin')}>Admin → Shipments</a>. Their status is reflected here.</Alert>}
        {data.returnRequest && <Alert severity="info"><Stack spacing={0.5}><Typography component="span" sx={{ fontWeight: 650 }}>Return: {data.returnRequest.status.replaceAll('_', ' ')}</Typography><Typography variant="body2">{data.returnRequest.reason}</Typography><Typography variant="body2">{data.returnRequest.resolution}</Typography><Typography variant="caption">Return acceptance or receipt does not mean a refund has been issued.</Typography></Stack></Alert>}
        <Stack component="form" spacing={1.5} onSubmit={(event: FormEvent) => event.preventDefault()}>
          {((!customer && data.order.canFulfill && nextStatus[data.order.status]) || (customer && data.order.usesScopedFulfillment && data.order.status === 'DELIVERED' && !data.returnRequest) || (data.returnRequest && ['REQUESTED','APPROVED'].includes(data.returnRequest.status))) && <TextField label={customer && !data.returnRequest ? 'Return reason' : 'Reason or update visible to the customer'} slotProps={{ htmlInput: { minLength: 3, maxLength: 1000 } }} multiline minRows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} />}
          {!customer && data.order.canFulfill && nextStatus[data.order.status] && <>
            {data.order.status === 'PACKING' && <><TextField label="Carrier" slotProps={{ htmlInput: { maxLength: 100 } }} value={carrier} disabled={busy} onChange={event => setCarrier(event.target.value)} /><TextField label="Tracking reference" slotProps={{ htmlInput: { maxLength: 150 } }} value={tracking} disabled={busy} onChange={event => setTracking(event.target.value)} /></>}
            <Button variant="contained" type="button" disabled={busy || reason.trim().length < 3 || (nextStatus[data.order.status] === 'SHIPPED' && data.inspection?.holdsDispatch === true)} onClick={() => void save('fulfill', nextStatus[data.order.status])}>Mark {nextStatus[data.order.status].toLowerCase()}</Button>
          </>}
          {customer && data.order.usesScopedFulfillment && data.order.status === 'DELIVERED' && !data.returnRequest && <Button variant="contained" type="button" disabled={busy || reason.trim().length < 3} onClick={() => void save('request-return')}>Request return for these shop items</Button>}
          {customer && data.returnRequest?.status === 'REQUESTED' && <Button variant="outlined" type="button" disabled={busy || reason.trim().length < 3} onClick={() => void save('review-return', 'CANCELLED')}>Cancel return request</Button>}
          {!customer && data.returnRequest?.status === 'REQUESTED' && <><FormControl fullWidth disabled={busy}><InputLabel id="fulfillment-return-decision">Return decision</InputLabel><Select labelId="fulfillment-return-decision" label="Return decision" value={returnDecision} onChange={event => setReturnDecision(String(event.target.value))}><MenuItem value="APPROVED">Approve return</MenuItem><MenuItem value="REJECTED">Reject return</MenuItem></Select></FormControl><Button variant="contained" type="button" disabled={busy || reason.trim().length < 3} onClick={() => void save('review-return', returnDecision)}>Save return decision</Button></>}
          {!customer && data.returnRequest?.status === 'APPROVED' && <Button variant="contained" type="button" disabled={busy || reason.trim().length < 3} onClick={() => void save('review-return', 'RECEIVED')}>Confirm returned items received</Button>}
          {busy && <Typography role="status" color="text.secondary">Saving update…</Typography>}{error && <Alert severity="error" role="alert">{error}</Alert>}
        </Stack>
        <ShopInspection key={data.order.id} orderId={data.order.id} endpoint={endpoint} audience={audience} inspection={data.inspection} eligible={!data.order.isPlatform && ['PENDING', 'PACKING'].includes(data.order.status)} busy={busy} lock={lock} onBusy={setBusy} onSaved={() => Promise.all([detail.refetch(), list.refetch()])} />
        <Paper component="section" aria-label="Shop order support" variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}><Typography component="h3" variant="h6">Support and disputes</Typography>
          <Typography variant="body2" color="text.secondary">Messages are shared with this shop, the customer and Gadgify administrators. Do not include passwords or payment details. Resolving a dispute does not issue a refund.</Typography>
          {data.dispute && <Chip size="small" label={`Status: ${data.dispute.status.replaceAll('_', ' ')}`} sx={{ alignSelf: 'flex-start' }} />}
          {data.dispute?.messages.map(message => <Paper variant="outlined" key={message.id} sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography variant="subtitle2">{message.audience === 'admin' ? 'Gadgify support' : message.audience === 'seller' ? 'Shop' : 'Customer'}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</Typography><Typography variant="caption" color="text.secondary">{new Date(message.createdAt).toLocaleString()}</Typography></Stack></Paper>)}
          {data.dispute?.status !== 'RESOLVED' ? <Stack spacing={1.5}>
            <TextField label="Support message" slotProps={{ htmlInput: { minLength: 3, maxLength: 1000 } }} multiline minRows={3} disabled={busy} value={supportMessage} onChange={event => setSupportMessage(event.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" type="button" disabled={busy || supportMessage.trim().length < 3} onClick={() => void save(data.dispute ? 'support-reply' : 'support-open')}>{data.dispute ? 'Send message' : 'Start support conversation'}</Button>
              {data.dispute?.status === 'OPEN' && <Button variant="outlined" type="button" disabled={busy || supportMessage.trim().length < 3} onClick={() => void save('support-escalate')}>Escalate to Gadgify</Button>}
              {audience === 'admin' && data.dispute && <Button variant="outlined" type="button" disabled={busy || supportMessage.trim().length < 3} onClick={() => void save('support-resolve')}>Resolve with this explanation</Button>}
            </Stack>
          </Stack> : <Alert severity="success">This dispute is resolved. <a href="/support" onClick={onNavigate('/support')}>Contact Gadgify</a> if you need further help.</Alert>}
          </Stack>
        </Paper>
        <Typography component="h3" variant="h6">Recent updates</Typography>{!data.events.length && <Typography color="text.secondary">No shop-specific updates recorded.</Typography>}
        {data.events.map(event => <Paper variant="outlined" key={event.id} sx={{ p: 1.5 }}><Stack spacing={0.5}><Typography variant="subtitle2">{event.status}</Typography><Typography variant="body2">{event.reason}</Typography><Typography variant="caption" color="text.secondary">{new Date(event.createdAt).toLocaleString()}</Typography></Stack></Paper>)}
      </>}
    </FormDialog>
  </Stack>
}
