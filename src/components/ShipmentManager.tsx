import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, assertCurrentSession } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { CircularProgress } from './mui/CircularProgress'
import { FormControl } from './mui/FormControl'
import { InputLabel } from './mui/InputLabel'
import { MenuItem } from './mui/MenuItem'
import { Paper } from './mui/Paper'
import { Select } from './mui/Select'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
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
  return <Stack spacing={2.5}>
    <Alert severity="info">Record updates from your delivery process. These are manual records, not live carrier confirmation. Do not include private customer information in tracking notes.</Alert>
    <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} onSubmit={(event) => { event.preventDefault(); if (!busy) setLookup(draftLookup.trim()) }}>
      <TextField label="Order number or ID" required slotProps={{ htmlInput: { maxLength: 128 } }} value={draftLookup} disabled={busy} onChange={(event) => setDraftLookup(event.target.value)} fullWidth />
      <Button type="submit" variant="outlined" disabled={busy || query.isFetching}>Find order</Button>
    </Stack>
    {lookup && query.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 2 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading shipment…</Typography></Stack>}
    {query.isError && <Alert severity="error" role="alert">{query.error.message}</Alert>}
    {lookup && <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Reload shipment</Button>}
    {query.data && <Paper component="form" variant="outlined" key={query.data.id + (query.data.shipment?.updatedAt ?? query.data.status)} onSubmit={(event) => void save(event, query.data!)} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">{query.data.orderNumber} · {query.data.status}</Typography>
        <TextField name="carrier" label="Carrier or delivery service" required slotProps={{ htmlInput: { maxLength: 100 } }} defaultValue={query.data.shipment?.carrier ?? ''} disabled={busy} />
        <TextField name="trackingCode" label="Tracking reference" slotProps={{ htmlInput: { maxLength: 150 } }} defaultValue={query.data.shipment?.trackingCode ?? ''} disabled={busy} />
        <FormControl fullWidth disabled={busy}><InputLabel id="shipment-status-label">Shipment status</InputLabel><Select name="status" labelId="shipment-status-label" label="Shipment status" defaultValue={query.data.shipment?.status ?? 'PENDING'}>{['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'].map(status => <MenuItem key={status} value={status}>{status.replaceAll('_', ' ')}</MenuItem>)}</Select></FormControl>
        <TextField name="description" label="Customer-visible tracking update" required multiline minRows={3} slotProps={{ htmlInput: { maxLength: 1000 } }} disabled={busy} />
        <Typography variant="body2" color="text.secondary">Dispatch requires a tracking reference. Status cannot move backwards after delivery. A failed or interrupted save must be checked using Reload shipment before retrying.</Typography>
        <Button type="submit" variant="contained" disabled={busy || query.isFetching}>{busy ? 'Saving shipment…' : 'Save shipment update'}</Button>
      </Stack>
    </Paper>}
  </Stack>
}
