import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'

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
  return <section aria-label="Payments and refunds">
    <p>Latest 100 payments. Full INR refunds only. Confirm eligibility and the amount before submitting. Verification never issues another refund. Refunds do not restock products or approve returns.</p>
    <button className="secondary-button" disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh payments</button>
    {query.isPending && <p role="status">Loading payments…</p>}
    {query.isError && <p role="alert">Payments are unavailable. Refresh to try again.</p>}
    {outcome && <p role="status">{outcome}</p>}
    {query.data?.payments.length === 0 && <p>No payment records.</p>}
    {query.data?.payments.map(payment => <article className="record-card" key={payment.id}>
      <h3>{payment.order.orderNumber}</h3>
      <p>{payment.order.currency} {(payment.amountMinor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} · {payment.status}</p>
      {payment.refundStatus && <p>Refund: {payment.refundStatus}</p>}
      {payment.provider === 'RAZORPAY' && payment.providerPaymentId && payment.status !== 'REFUNDED' && <div className="profile-actions">
        <button className="secondary-button" disabled={busy} onClick={() => void act(payment, 'reconcile-refund')}>Verify refund status</button>
        {payment.status === 'CAPTURED' && !payment.refundStatus && <button className="secondary-button" disabled={busy} onClick={() => { setSelected(payment.id); setReason(''); setConfirmed(false) }}>Prepare full refund</button>}
      </div>}
      {selected === payment.id && <FormDialog open title={`Refund ${payment.order.orderNumber}`} busy={busy} onClose={() => setSelected(null)}><form className="auth-form" onSubmit={(event: FormEvent) => { event.preventDefault(); if (confirmed && reason.trim().length >= 3) void act(payment, 'initiate-refund') }}>
        <label>Refund reason<textarea required minLength={3} maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>
        <label className="profile-default"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />I approve refunding the full {payment.order.currency} {(payment.amountMinor / 100).toFixed(2)} for this order.</label>
        <div className="profile-actions"><button className="primary-button" disabled={busy || !confirmed || reason.trim().length < 3}>{busy ? 'Processing…' : 'Issue full refund'}</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setSelected(null)}>Cancel</button></div>
      </form></FormDialog>}
    </article>)}
  </section>
}
