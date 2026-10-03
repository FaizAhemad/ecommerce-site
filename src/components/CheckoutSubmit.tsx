import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { checkoutRequest, type Quote } from '../api/checkout'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
import { OrderTotals } from './OrderTotals'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
type CheckoutProps = { addressId: string; cartRevision: string; disabled: boolean; itemsSubtotalMinor: number; onAttempt: () => void }
export function CheckoutSubmit(props: CheckoutProps) {
  const [draft, setDraft] = useState('')
  const [coupon, setCoupon] = useState('')
  const [locked, setLocked] = useState(false)
  return (
    <section className="mt-5 border-t border-[var(--line)] pt-5" aria-label="Order total and confirmation">
      <div className="grid gap-2">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Coupon code <Typography component="span" variant="body2" color="text.secondary">(optional)</Typography></Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            id="checkout-coupon"
            label="Coupon code"
            size="small"
            fullWidth
            value={draft}
            slotProps={{ htmlInput: { maxLength: 32, 'aria-label': 'Coupon code' } }}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Enter code"
            disabled={locked || props.disabled}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            type="button"
            variant="outlined"
            sx={{ flexShrink: 0, minWidth: { sm: 112 } }}
            disabled={locked || props.disabled || !draft.trim()}
            onClick={() => setCoupon(draft.trim().toUpperCase())}
          >
            Apply code
          </Button>
        </Stack>
        {coupon && <Button type="button" variant="text" sx={{ justifySelf: 'start' }} disabled={locked} onClick={() => { setCoupon(''); setDraft('') }}>Remove applied code</Button>}
      </div>
      <CheckoutOrder {...props} couponCode={coupon} onAttempt={() => { setLocked(true); props.onAttempt() }} />
    </section>
  )
}
function CheckoutOrder({
  addressId,
  cartRevision,
  disabled,
  itemsSubtotalMinor,
  couponCode,
  onAttempt,
}: CheckoutProps & { couponCode: string; onAttempt: () => void }) {
  const notify = useNotification()
  const [attempted, setAttempted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const quote = useQuery({
    queryKey: privateKey('checkout', cartRevision, couponCode),
    queryFn: ({ signal }) => checkoutRequest('GET', signal, undefined, couponCode),
    retry: false,
    enabled: !attempted,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const frozenQuote = useRef<Quote | null>(null)
  const displayedQuote = frozenQuote.current ?? quote.data
  const lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    request = useRef<{ requestId: string; addressId: string; expectedTotalMinor: number; couponCode?: string } | null>(
      null,
    )
  const [pending, setPending] = useState(false),
    [orderId, setOrderId] = useState('')
  useEffect(() => () => controller.current?.abort(), [])
  async function submit() {
    if (lock.current || orderId || (!request.current && (disabled || quote.isFetching || !quote.data?.enabled || !addressId || !Number.isSafeInteger(quote.data?.totalMinor))))
      return
    lock.current = true
    frozenQuote.current ??= quote.data ?? null
    onAttempt()
    setAttempted(true)
    setPending(true)
    setErrorMessage('')
    const abort = new AbortController(), generation = sessionGeneration()
    controller.current = abort
    request.current ??= {
      requestId: crypto.randomUUID(),
      addressId,
      expectedTotalMinor: quote.data!.totalMinor!,
      ...(couponCode ? { couponCode } : {}),
    }
    try {
      const result = await checkoutRequest('POST', AbortSignal.any([abort.signal, sessionSignal()]), request.current)
      if (!result.orderId)
        throw new Error('Unable to confirm the order. Check your orders before trying again.')
      if (abort.signal.aborted || generation !== sessionGeneration()) return
      setOrderId(result.orderId)
      notify(result.emailStatus === 'UNCONFIRMED'
        ? 'Order recorded; payment is pending. The confirmation email could not be confirmed. Check Orders for details.'
        : 'Order recorded. Payment is still pending.', 'info')
      void queryClient.invalidateQueries({ queryKey: privateKey('cart') })
      void queryClient.invalidateQueries({ queryKey: privateKey('orders') })
      window.history.pushState({}, '', '/orders/' + encodeURIComponent(result.orderId))
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (error) {
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        const message = error instanceof Error ? error.message : 'Check your orders before trying again.'
        setErrorMessage(message)
        notify(message, 'error')
      }
    } finally {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setPending(false)
    }
  }
  if (orderId)
    return (
      <p role="status">
        Order recorded; payment pending.{' '}
        <a href={'/orders/' + encodeURIComponent(orderId)}>View order and payment</a>
      </p>
    )
  if (!attempted && quote.isPending) return <Alert severity="info" role="status">Checking delivery charges and total…</Alert>
  if (!attempted && quote.isError)
    return (
      <Alert className="mt-4" severity="error" role="alert">
        <p className="mb-3">{quote.error instanceof Error ? quote.error.message : 'Unable to load charges.'}</p>
        <Button
          variant="outlined"
          disabled={quote.isFetching}
          onClick={() => void quote.refetch({ cancelRefetch: false })}
        >
          Retry
        </Button>
      </Alert>
    )
  if (!attempted && !quote.data?.enabled)
    return (
      <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4" role="status">
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div><p className="mb-1 text-xs font-medium text-[var(--muted)]">Items subtotal</p><p className="m-0 text-xs text-[var(--muted)]">Before delivery, tax, or discounts</p></div>
          <strong className="shrink-0 text-xl font-semibold tabular-nums text-[var(--ink)]">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(itemsSubtotalMinor / 100)}</strong>
        </div>
        <p className="mb-1 text-sm font-semibold text-[var(--ink)]">Checkout is not available yet</p>
        <p className="mb-3 text-xs leading-5 text-[var(--muted)]">{quote.data?.reason ?? 'Your cart and selected address have not been submitted, and no payment has been started. Please try again later.'}</p>
        <a href="/cart" className="text-sm font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4">Return to cart</a>
      </div>
    )
  const money = (value: number | undefined) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
      (value ?? 0) / 100,
    )
  return (
    <div className="mt-4">
      {!!displayedQuote?.discountMinor && <p className="mb-3 rounded-lg bg-[rgba(215,225,208,0.4)] p-3 text-xs leading-5 text-[var(--ink)]" role="status">Coupon {displayedQuote?.couponCode}: −{money(displayedQuote?.discountMinor)}. Usage is confirmed when the order is recorded.</p>}
      <OrderTotals subtotalMinor={displayedQuote?.subtotalMinor} shippingMinor={displayedQuote?.shippingMinor} taxMinor={displayedQuote?.taxMinor} discountMinor={displayedQuote?.discountMinor} totalMinor={request.current?.expectedTotalMinor ?? displayedQuote?.totalMinor} />
      {!addressId && <Alert className="my-3" severity="info" role="status">Add or select an India delivery address to continue.</Alert>}
      {errorMessage && <Alert className="my-3" severity="error" role="alert"><strong>We couldn’t confirm your order.</strong><br />The result may be unknown. Check <a href="/orders">your orders</a> first. Retrying below uses the same order request and total.</Alert>}
      <Button
        variant="contained"
        fullWidth
        disabled={pending || (!attempted && (disabled || !addressId || quote.isFetching))}
        onClick={() => void submit()}
      >
        {pending ? 'Recording your order…' : (attempted ? 'Retry same order · ' : 'Place order · ') + money(request.current?.expectedTotalMinor ?? displayedQuote?.totalMinor)}
      </Button>
      <p className="mb-0 mt-3 text-xs leading-5 text-[var(--muted)]">
        After the order is recorded, continue to payment from the order page. If a request is interrupted, check{' '}
        <a className="font-medium text-[var(--ink)] underline underline-offset-2" href="/orders">your orders</a> before starting another checkout.
      </p>
      {attempted && <p className="mb-0 mt-2 text-xs leading-5 text-[var(--muted)]">Retry uses the original address, coupon and total to avoid creating a duplicate order.</p>}
    </div>
  )
}
