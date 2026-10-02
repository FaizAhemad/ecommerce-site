import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { Checkbox } from './mui/Checkbox'
import { Chip } from './mui/Chip'
import { CircularProgress } from './mui/CircularProgress'
import { FormControlLabel } from './mui/FormControlLabel'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

type Payment = { id: string; orderId: string; provider: string; providerPaymentId: string | null; amountMinor: number; status: string; refundStatus: string | null; order: { orderNumber: string; currency: string } }
export function PaymentRefunds() {
  const notify = useNotification()
  const lock = useRef(false), controller = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false)
  const [outcome, setOutcome] = useState('')
  const query = useQuery({ queryKey: privateKey('admin', 'refund-payments'), retry: false,
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/admin/payments', { signal })
      if (!response.ok) throw new Error('Unable to load payments.')
      return await response.json() as { payments: Payment[] }
    },
  })
  useEffect(() => () => controller.current?.abort(), [])
  async function act(payment: Payment, action: 'initiate-refund' | 'reconcile-refund') {
    if (lock.current) return
    lock.current = true
    const generation = sessionGeneration(), abort = new AbortController()
    controller.current = abort
    setBusy(true)
    setOutcome('')
    try {
      const response = await apiFetch('/api/admin/payments', { method: 'PATCH', signal: AbortSignal.any([abort.signal, sessionSignal()]),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: payment.orderId, action, reason, confirmed, expectedAmount: payment.amountMinor }),
      })
      const body = await response.json() as { error?: { message?: string }; payment?: { status: string }; refund?: { status: string; existing: boolean } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to confirm refund status.')
      if (abort.signal.aborted || generation !== sessionGeneration()) return
      const verified = body.payment?.status === 'REFUNDED'
      const message = verified ? 'Provider full refund verified. Bank settlement timing is provider-controlled.' :
        body.refund?.status === 'PENDING' ? 'Refund is pending confirmation. Verify provider status before treating it as refunded.' :
        body.refund?.status === 'FAILED' ? 'Provider reported failure. Investigate in Razorpay; no automatic resubmission.' :
        'An attempt is recorded but its outcome is uncertain. Verify provider status; do not submit another refund.'
      setOutcome(message)
      notify(message, verified ? 'success' : 'info')
      setSelected(null)
      setReason('')
      setConfirmed(false)
      await query.refetch({ cancelRefetch: false })
    } catch (error) {
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        notify(error instanceof Error ? error : new Error('Refund outcome is uncertain. Verify status.'))
        setOutcome('No success is assumed. Your draft is preserved. Refresh and verify provider status before further action.')
        void query.refetch({ cancelRefetch: false })
      }
    } finally {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setBusy(false)
    }
  }
  return <Stack component="section" aria-label="Payments and refunds" spacing={2}>
    <Alert severity="info">Latest 100 payments. Full INR refunds only. Confirm eligibility and the amount before submitting. Verification never issues another refund. Refunds do not restock products or approve returns.</Alert>
    <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh payments</Button>
    {query.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading payments…</Typography></Stack>}
    {query.isError && <Alert severity="error" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Payments are unavailable.</Alert>}
    {outcome && <Alert severity={outcome.includes('verified') ? 'success' : 'info'} role="status">{outcome}</Alert>}
    {query.data?.payments.length === 0 && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No payment records</Typography></Paper>}
    <Stack spacing={1.5}>{query.data?.payments.map(payment => <Card variant="outlined" component="article" key={payment.id} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <Typography component="h2" variant="h6">{payment.order.orderNumber}</Typography>
          <Chip size="small" label={payment.status.replaceAll('_', ' ')} color={payment.status === 'CAPTURED' || payment.status === 'REFUNDED' ? 'success' : payment.status === 'FAILED' ? 'error' : 'default'} />
        </Stack>
        <Typography>{payment.order.currency} {(payment.amountMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
        {payment.refundStatus && <Typography variant="body2" color="text.secondary">Refund: {payment.refundStatus.replaceAll('_', ' ')}</Typography>}
        {payment.provider === 'RAZORPAY' && payment.providerPaymentId && payment.status !== 'REFUNDED' && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" disabled={busy} onClick={() => void act(payment, 'reconcile-refund')}>Verify refund status</Button>
          {payment.status === 'CAPTURED' && !payment.refundStatus && <Button variant="outlined" disabled={busy} onClick={() => { setSelected(payment.id); setReason(''); setConfirmed(false) }}>Prepare full refund</Button>}
        </Stack>}
      </Stack>
      {selected === payment.id && <FormDialog open title={`Refund ${payment.order.orderNumber}`} busy={busy} onClose={() => setSelected(null)}><Stack component="form" spacing={2} onSubmit={(event: FormEvent) => { event.preventDefault(); if (confirmed && reason.trim().length >= 3) void act(payment, 'initiate-refund') }}>
        <TextField label="Refund reason" required slotProps={{ htmlInput: { minLength: 3, maxLength: 1000 } }} multiline minRows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} />
        <FormControlLabel control={<Checkbox checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />} label={`I approve refunding the full ${payment.order.currency} ${(payment.amountMinor / 100).toFixed(2)} for this order.`} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="contained" type="submit" disabled={busy || !confirmed || reason.trim().length < 3}>{busy ? 'Processing…' : 'Issue full refund'}</Button><Button type="button" variant="outlined" disabled={busy} onClick={() => setSelected(null)}>Cancel</Button></Stack>
      </Stack></FormDialog>}
    </Card>)}</Stack>
  </Stack>
}
