import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { checkoutRequest } from '../api/checkout'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
export function CheckoutSubmit({
  addressId,
  cartRevision,
  disabled,
}: {
  addressId: string
  cartRevision: string
  disabled: boolean
}) {
  const notify = useNotification()
  const quote = useQuery({
    queryKey: privateKey('checkout', cartRevision),
    queryFn: ({ signal }) => checkoutRequest('GET', signal),
    retry: false,
  })
  const lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    request = useRef<{ requestId: string; addressId: string; expectedTotalMinor: number } | null>(
      null,
    )
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false),
    [orderId, setOrderId] = useState('')
  useEffect(() => () => controller.current?.abort(), [])
  async function submit() {
    if (lock.current || disabled || !addressId || !Number.isSafeInteger(quote.data?.totalMinor))
      return
    lock.current = true
    setAttempted(true)
    setPending(true)
    const abort = new AbortController()
    controller.current = abort
    request.current ??= {
      requestId: crypto.randomUUID(),
      addressId,
      expectedTotalMinor: quote.data!.totalMinor!,
    }
    try {
      const result = await checkoutRequest('POST', abort.signal, request.current)
      if (!result.orderId)
        throw new Error('Unable to confirm the order. Check your orders before trying again.')
      if (abort.signal.aborted) return
      setOrderId(result.orderId)
      notify('Order recorded. Payment is still pending.', 'info')
      void queryClient.invalidateQueries({ queryKey: privateKey('cart') })
      void queryClient.invalidateQueries({ queryKey: privateKey('orders') })
      window.history.pushState({}, '', '/orders/' + encodeURIComponent(result.orderId))
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (error) {
      if (!abort.signal.aborted)
        notify(error instanceof Error ? error : new Error('Check your orders before trying again.'))
    } finally {
      lock.current = false
      if (!abort.signal.aborted) setPending(false)
    }
  }
  if (orderId)
    return (
      <p role="status">
        Order recorded; payment pending.{' '}
        <a href={'/orders/' + encodeURIComponent(orderId)}>View order and payment</a>
      </p>
    )
  if (quote.isPending) return <p role="status">Checking delivery charges and total…</p>
  if (quote.isError)
    return (
      <div role="alert">
        <p>Unable to load charges.</p>
        <button
          className="secondary-button"
          disabled={quote.isFetching}
          onClick={() => void quote.refetch({ cancelRefetch: false })}
        >
          Retry
        </button>
      </div>
    )
  if (!quote.data?.enabled)
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
    <div>
      <p>
        Delivery: {money(quote.data.shippingMinor)} · Tax: {money(quote.data.taxMinor)} · Total:{' '}
        {money(quote.data.totalMinor)}
      </p>
      <button
        className="primary-button"
        disabled={disabled || pending || !addressId || quote.isFetching}
        onClick={() => void submit()}
      >
        {pending ? 'Recording order…' : 'Place order — ' + money(quote.data.totalMinor)}
      </button>
      <p>
        Payment is confirmed separately. If a request times out, check{' '}
        <a href="/orders">your orders</a> before starting another checkout.
      </p>
      {attempted && <p>A retry uses the original address and total to avoid a duplicate order.</p>}
    </div>
  )
}
