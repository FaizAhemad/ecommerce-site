import type { MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { StorefrontApiResponse } from '../api/storefront'
import { getOrder, orderStatusLabel } from '../api/orders'
import { privateKey } from '../api/sessionScope'
import { OrderPayment } from '../components/OrderPayment'

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
    <section className="page-section order-detail-page" aria-labelledby="order-detail-title">
      <a className="back-link" href="/orders" onClick={onNavigate('/orders')}>
        Back to orders
      </a>
      <h1 id="order-detail-title">Order details</h1>
      {query.isPending && <p role="status">Loading order details?</p>}
      {query.isError && (
        <div className="state-message" role="alert">
          <p>{query.error.message}</p>
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
          <p>
            Order {order.orderNumber} ? {orderStatusLabel(order.status)}
          </p>
          <p>
            Placed{' '}
            {new Intl.DateTimeFormat(storefront.localization.locale, {
              dateStyle: 'medium',
            }).format(new Date(order.createdAt))}
          </p>
          <div className="order-detail-grid">
            <div className="order-detail-main">
              <h2>Items in this order</h2>
              {order.items.map((item) => (
                <div className="detail-item" key={item.id}>
                  <strong>{item.productName}</strong>
                  <span>Quantity: {item.quantity}</span>
                  <b>{money(item.unitPriceMinor * item.quantity)}</b>
                </div>
              ))}
              <h2>Delivery status</h2>
              <p>
                {order.shipment
                  ? order.shipment.status.replaceAll('_', ' ').toLowerCase()
                  : 'No shipment recorded yet.'}
              </p>
              {order.shipment?.carrier && <p>Carrier: {order.shipment.carrier}</p>}
              {order.shipment?.trackingCode && <p>Tracking code: {order.shipment.trackingCode}</p>}
              <a href={trackingPath} onClick={onNavigate(trackingPath)}>
                Track this order
              </a>
            </div>
            <aside className="order-detail-aside">
              <h2>Summary</h2>
              {(
                [
                  ['Subtotal', order.subtotalMinor],
                  ['Delivery', order.shippingMinor],
                  ['Tax', order.taxMinor],
                  ['Total', order.totalMinor],
                ] as const
              ).map(([label, value]) => (
                <div className="summary-line" key={label}>
                  <span>{label}</span>
                  <strong>{money(value)}</strong>
                </div>
              ))}
              <h2>Delivery address</h2>
              {address ? (
                <p>
                  {address.name}
                  <br />
                  {address.line1}
                  {address.line2 ? ', ' + address.line2 : ''}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                  {address.phone ? ' ? ' + address.phone : ''}
                </p>
              ) : (
                <p>No delivery address available.</p>
              )}
              <h2>Payment</h2>
              {order.status === 'PENDING' &&
                order.payment?.provider === 'RAZORPAY' &&
                ['PENDING', 'FAILED'].includes(order.payment.status) && (
                  <OrderPayment
                    orderId={order.id}
                    onRefresh={() => void query.refetch({ cancelRefetch: false })}
                  />
                )}
              <p>
                {order.payment
                  ? order.payment.provider + ' ? ' + orderStatusLabel(order.payment.status)
                  : 'No payment recorded.'}
              </p>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
