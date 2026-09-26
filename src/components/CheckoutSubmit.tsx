import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { checkoutRequest, type Quote } from '../api/checkout'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
import { OrderTotals } from './OrderTotals'
type CheckoutProps = { addressId: string; cartRevision: string; disabled: boolean; onAttempt: () => void }
export function CheckoutSubmit(props: CheckoutProps) {
  const [draft, setDraft] = useState('')
  const [coupon, setCoupon] = useState('')
  const [locked, setLocked] = useState(false)
  return <section className="checkout-confirmation" aria-label="Order total and confirmation">
    <div className="checkout-coupon"><label>Coupon code (optional)
      <input value={draft} maxLength={32} autoCapitalize="characters" autoComplete="off"
        disabled={locked || props.disabled} onChange={(event) => setDraft(event.target.value)} />
    </label>
    <button type="button" className="secondary-button" disabled={locked || props.disabled || !draft.trim()}
      onClick={() => setCoupon(draft.trim().toUpperCase())}>Apply coupon</button>
    {coupon && <button type="button" className="secondary-button" disabled={locked}
      onClick={() => { setCoupon(''); setDraft('') }}>Remove coupon</button>}
    </div>
    <CheckoutOrder {...props} couponCode={coupon} onAttempt={() => { setLocked(true); props.onAttempt() }} />
  </section>
}
function CheckoutOrder({
  addressId,
  cartRevision,
  disabled,
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
  if (!attempted && quote.isPending) return <p role="status">Checking delivery charges and total…</p>
  if (!attempted && quote.isError)
    return (
      <div role="alert">
        <p>{quote.error instanceof Error ? quote.error.message : 'Unable to load charges.'}</p>
        <button
          className="secondary-button"
          disabled={quote.isFetching}
          onClick={() => void quote.refetch({ cancelRefetch: false })}
        >
          Retry
        </button>
      </div>
    )
  if (!attempted && !quote.data?.enabled)
    return (
      <p className="state-message">
        Online ordering is not available yet. Your cart and selected address have not been
        submitted.
      </p>
    )
  const money = (value: number | undefined) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
      (value ?? 0) / 100,
    )
  return (
    <div className="checkout-submit">
      {!!displayedQuote?.discountMinor && <p role="status">Coupon {displayedQuote?.couponCode}: −{money(displayedQuote?.discountMinor)}. Usage is confirmed when the order is recorded.</p>}
      <OrderTotals subtotalMinor={displayedQuote?.subtotalMinor} shippingMinor={displayedQuote?.shippingMinor} taxMinor={displayedQuote?.taxMinor} discountMinor={displayedQuote?.discountMinor} totalMinor={request.current?.expectedTotalMinor ?? displayedQuote?.totalMinor} />
      {!addressId && <p role="status">Add or select an India delivery address to continue.</p>}
      {errorMessage && <div role="alert"><p>{errorMessage}</p><p>The outcome may be unknown. Check <a href="/orders">your orders</a> first. Retrying below uses the same order request.</p></div>}
      <button
        className="primary-button"
        disabled={pending || (!attempted && (disabled || !addressId || quote.isFetching))}
        onClick={() => void submit()}
      >
        {pending ? 'Recording order...' : (attempted ? 'Retry same order - ' : 'Place order - ') + money(request.current?.expectedTotalMinor ?? displayedQuote?.totalMinor)}
      </button>
      <p>
        Payment is confirmed separately. If a request times out, check{' '}
        <a href="/orders">your orders</a> before starting another checkout.
      </p>
      {attempted && <p>A retry uses the original address and total to avoid a duplicate order.</p>}
    </div>
  )
}
