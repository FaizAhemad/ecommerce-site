import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getOrders, orderStatusLabel } from '../api/orders'
import { privateKey } from '../api/sessionScope'
import { PurchaseFeedback } from '../components/PurchaseFeedback'

type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

export function OrdersPage({ storefront, onNavigate }: Props) {
  const history = useInfiniteQuery({
    queryKey: privateKey('orders'),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getOrders(pageParam, signal),
    getNextPageParam: (last) => last.nextPage ?? undefined,
    retry: false,
  })
  const orders = [
    ...new Map(
      (history.data?.pages.flatMap((page) => page.orders) ?? []).map((order) => [order.id, order]),
    ).values(),
  ]
  const locale = storefront.localization.locale
  return (
    <section className="page-section orders-page" aria-labelledby="orders-title">
      <div className="orders-heading">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1 id="orders-title">Your orders</h1>
          <p className="hero-text">Your purchases and their latest recorded status.</p>
        </div>
        {history.data && (
          <span className="orders-count">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} loaded
          </span>
        )}
      </div>
      <PurchaseFeedback />
      {history.isPending && (
        <p className="state-message" role="status">
          Loading your orders…
        </p>
      )}
      {history.isError && (
        <div className="state-message" role="alert">
          <p>
            Unable to load {orders.length ? 'more order history' : 'your orders'}. Please try again.
          </p>
          <button
            className="secondary-button"
            disabled={history.isFetching}
            onClick={() =>
              void (history.isFetchNextPageError
                ? history.fetchNextPage({ cancelRefetch: false })
                : history.refetch({ cancelRefetch: false }))
            }
          >
            Retry
          </button>
        </div>
      )}
      {history.isSuccess && orders.length === 0 && (
        <div className="wishlist-empty">
          <p>No orders yet.</p>
          <a className="primary-button" href="/products" onClick={onNavigate('/products')}>
            {storefront.content.cart.continueShoppingLabel} <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
      {orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header className="order-card-header">
                <h2>Order {order.orderNumber}</h2>
                <span>{orderStatusLabel(order.status)}</span>
              </header>
              <p>
                Placed{' '}
                {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                  new Date(order.createdAt),
                )}
              </p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} × {item.quantity}
                  </li>
                ))}
              </ul>
              <footer className="order-card-footer">
                <a
                  className="secondary-button"
                  href={`/orders/${encodeURIComponent(order.id)}`}
                  onClick={onNavigate(`/orders/${encodeURIComponent(order.id)}`)}
                >
                  View order
                </a>
                <strong>
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: order.currency,
                  }).format(order.totalMinor / 100)}
                </strong>
                <span>
                  Payment:{' '}
                  {order.payment ? orderStatusLabel(order.payment.status) : 'No payment recorded'}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}
      {history.hasNextPage && (
        <button
          className="secondary-button"
          disabled={history.isFetching}
          onClick={() => void history.fetchNextPage({ cancelRefetch: false })}
        >
          {history.isFetchingNextPage ? 'Loading…' : 'Load more orders'}
        </button>
      )}
      <div className="orders-help">
        <p className="eyebrow">NEED HELP?</p>
        <p>Questions about an order or delivery?</p>
        <a href="/support" onClick={onNavigate('/support')}>
          Contact customer care →
        </a>
      </div>
    </section>
  )
}
