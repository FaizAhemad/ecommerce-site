import type { MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Truck } from 'lucide-react'
import type { StorefrontApiResponse } from '../api/storefront'
import { getOrder, orderStatusLabel } from '../api/orders'
import { privateKey } from '../api/sessionScope'
import { OrderPayment } from '../components/OrderPayment'
import { OrderTimeline } from '../components/OrderTimeline'
import { OrderTotals } from '../components/OrderTotals'
import { PurchaseFeedback } from '../components/PurchaseFeedback'
import { CustomerReturns } from '../components/CustomerReturns'

type Props = {
  storefront: StorefrontApiResponse
  orderId: string
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
export function OrderDetailPage({ storefront, orderId, onNavigate }: Props) {
  const query = useQuery({
    queryKey: privateKey('order', orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    retry: false,
  })
  const order = query.data
  const money = (minor: number) =>
    new Intl.NumberFormat(storefront.localization.locale, {
      style: 'currency',
      currency: order?.currency ?? storefront.localization.currency,
    }).format(minor / 100)
  const address = order?.shippingAddress
  const trackingPath = '/track-order?order=' + encodeURIComponent(orderId)
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 py-6 sm:space-y-8 sm:py-10 lg:py-12" aria-labelledby="order-detail-title">
      <a className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]" href="/orders" onClick={onNavigate('/orders')}>
        Back to orders
      </a>
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">Order details</p>
          <h1 id="order-detail-title" className="!m-0 !max-w-none !text-3xl !font-normal !leading-tight !tracking-tight text-[var(--ink)] sm:!text-4xl">Your order</h1>
          {order && <p className="mb-0 mt-2 break-all font-mono text-xs text-[var(--muted)] sm:text-sm">{order.orderNumber}</p>}
        </div>
        {order && <span className="inline-flex min-h-9 w-fit items-center rounded-full bg-[rgba(215,225,208,0.6)] px-3 text-sm font-semibold text-[var(--ink)]">{orderStatusLabel(order.status)}</span>}
      </header>
      {query.isPending && <div className="grid min-h-48 place-content-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center" role="status"><p className="m-0 text-sm text-[var(--muted)]">Loading your order details…</p></div>}
      {query.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950 sm:p-6" role="alert">
          <p className="mb-4 text-sm leading-6">{query.error.message}</p>
          <button
            className="secondary-button"
            disabled={query.isFetching}
            onClick={() => void query.refetch({ cancelRefetch: false })}
          >
            Retry
          </button>
        </div>
      )}
      {order && (
        <>
          <p className="-mt-3 text-sm text-[var(--muted)]">Placed {new Intl.DateTimeFormat(storefront.localization.locale, { dateStyle: 'medium' }).format(new Date(order.createdAt))}</p>
          <OrderTimeline status={order.status} createdAt={order.createdAt} locale={storefront.localization.locale} events={order.shipment?.events ?? []} />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)] lg:gap-6">
            <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="order-items-title">
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--line)] pb-4">
                <h2 id="order-items-title" className="!m-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!text-2xl">Items in this order</h2>
                <span className="shrink-0 text-xs text-[var(--muted)]">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              </div>
              <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">
                {order.items.map((item) => (
                  <li className="flex min-w-0 flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5" key={item.id}>
                    <div className="min-w-0">
                      <h3 className="!m-0 !text-base !font-medium !leading-6 !tracking-normal text-[var(--ink)]">{item.productName}</h3>
                      <p className="mb-0 mt-1 text-sm text-[var(--muted)]">Quantity: {item.quantity} <span aria-hidden="true">·</span> {money(item.unitPriceMinor)} each</p>
                    </div>
                    <strong className="shrink-0 text-sm font-semibold tabular-nums text-[var(--ink)]">{money(item.unitPriceMinor * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
              {order.shipment?.carrier && <p className="mb-0 mt-4 border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">Carrier: <span className="font-medium text-[var(--ink)]">{order.shipment.carrier}</span>{order.shipment.trackingCode && <> <span aria-hidden="true">·</span> Reference: <span className="font-medium text-[var(--ink)]">{order.shipment.trackingCode}</span></>}</p>}
              <a className="primary-button mt-5 inline-flex min-h-11 items-center justify-center gap-2 !normal-case !tracking-normal no-underline" href={trackingPath} onClick={onNavigate(trackingPath)}><Truck aria-hidden="true" className="size-4" /> Track this order <ArrowRight aria-hidden="true" className="size-4" /></a>
            </section>
            <aside className="grid gap-5">
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="order-summary-title">
                <h2 id="order-summary-title" className="!mb-2 !mt-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)]">Order summary</h2>
                <OrderTotals subtotalMinor={order.subtotalMinor} shippingMinor={order.shippingMinor} taxMinor={order.taxMinor} discountMinor={Math.max(0, order.subtotalMinor + order.shippingMinor + order.taxMinor - order.totalMinor)} totalMinor={order.totalMinor} />
              </section>
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="delivery-address-title">
                <h2 id="delivery-address-title" className="!mb-3 !mt-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)]">Delivery address</h2>
                {address ? <address className="not-italic text-sm leading-6 text-[var(--muted)]"><span className="font-semibold text-[var(--ink)]">{address.name}</span><br />{address.line1}{address.line2 ? ', ' + address.line2 : ''}<br />{address.city}, {address.state} {address.postalCode}<br />{address.country}{address.phone ? <><br />{address.phone}</> : null}</address> : <p className="mb-0 text-sm text-[var(--muted)]">No delivery address available.</p>}
              </section>
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="payment-status-title">
                <h2 id="payment-status-title" className="!mb-3 !mt-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)]">Payment</h2>
                <p className="mb-3 text-sm text-[var(--muted)]">{order.payment ? `${order.payment.provider} · ${orderStatusLabel(order.payment.status)}` : 'No payment recorded.'}</p>
                {order.status === 'PENDING' && order.payment?.provider === 'RAZORPAY' && ['PENDING', 'FAILED'].includes(order.payment.status) && <OrderPayment orderId={order.id} onRefresh={() => void query.refetch({ cancelRefetch: false })} />}
              </section>
            </aside>
          </div>
          {order.payment && ['CAPTURED','REFUNDED'].includes(order.payment.status) && <PurchaseFeedback />}
          <CustomerReturns key={order.id} orderId={order.id} />
        </>
      )}
    </section>
  )
}
