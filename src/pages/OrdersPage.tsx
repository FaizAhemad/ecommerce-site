import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, PackageSearch, Truck } from 'lucide-react'
import { getOrders, orderStatusLabel } from '../api/orders'
import { privateKey } from '../api/sessionScope'
import { PurchaseFeedback } from '../components/PurchaseFeedback'

type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-900 ring-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  PROCESSING: 'bg-blue-50 text-blue-900 ring-blue-200',
  SHIPPED: 'bg-blue-50 text-blue-900 ring-blue-200',
  DELIVERED: 'bg-stone-100 text-stone-700 ring-stone-200',
  CANCELLED: 'bg-rose-50 text-rose-900 ring-rose-200',
  REFUNDED: 'bg-stone-100 text-stone-700 ring-stone-200',
}

const actionClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] no-underline transition-colors hover:border-[var(--ink)] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]'

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
  const trackPath = '/track-order'

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 py-8 sm:py-10 lg:py-14" aria-labelledby="orders-title">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
            Your account
          </p>
          <h1 className="m-0 font-[var(--font-display)] text-4xl font-normal leading-tight tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
            Your orders
          </h1>
          <p className="mb-0 mt-3 text-base leading-7 text-[var(--muted)]">
            View order details, payment status, and the latest recorded delivery updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {history.data && (
            <span className="mr-1 text-sm text-[var(--muted)]" aria-live="polite">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          )}
          <a className={actionClass} href={trackPath} onClick={onNavigate(trackPath)}>
            <Truck aria-hidden="true" className="size-4" />
            Track an order
          </a>
        </div>
      </header>

      <PurchaseFeedback />

      {history.isPending && (
        <div className="grid gap-4" aria-label="Loading your orders" aria-busy="true" role="status">
          {[0, 1].map((item) => (
            <div className="animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6" key={item}>
              <div className="h-4 w-36 rounded bg-[var(--skeleton-shape)]" />
              <div className="mt-4 h-3 w-52 rounded bg-[var(--skeleton-base)]" />
              <div className="mt-6 h-px bg-[var(--line)]" />
              <div className="mt-5 h-4 w-3/4 rounded bg-[var(--skeleton-base)]" />
              <div className="mt-3 h-4 w-1/2 rounded bg-[var(--skeleton-base)]" />
            </div>
          ))}
        </div>
      )}

      {history.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6" role="alert">
          <h2 className="m-0 text-lg font-semibold text-rose-950">
            Unable to load {orders.length ? 'more order history' : 'your orders'}
          </h2>
          <p className="mb-4 mt-2 text-sm leading-6 text-rose-900">
            Your order history could not be refreshed. Please try again.
          </p>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={history.isFetching}
            onClick={() =>
              void (history.isFetchNextPageError
                ? history.fetchNextPage({ cancelRefetch: false })
                : history.refetch({ cancelRefetch: false }))
            }
          >
            {history.isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      )}

      {history.isSuccess && orders.length === 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-12 text-center sm:px-8 sm:py-16">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e9efdf] text-[var(--green)]">
            <PackageSearch aria-hidden="true" className="size-7" />
          </span>
          <h2 className="mb-0 mt-5 font-[var(--font-display)] text-2xl font-normal text-[var(--ink)] sm:text-3xl">
            No orders yet
          </h2>
          <p className="mx-auto mb-0 mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
            When you place an order, its items and recorded status will appear here.
          </p>
          <a
            className="primary-button mt-6 no-underline"
            href="/products"
            onClick={onNavigate('/products')}
          >
            {storefront.content.cart.continueShoppingLabel || 'Browse products'}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      )}

      {orders.length > 0 && (
        <div className="grid gap-4 sm:gap-5">
          {orders.map((order) => {
            const detailPath = `/orders/${encodeURIComponent(order.id)}`
            const orderTrackPath = `${trackPath}?order=${encodeURIComponent(order.id)}`
            const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
              new Date(order.createdAt),
            )
            const amount = new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: order.currency,
            }).format(order.totalMinor / 100)
            const statusStyle =
              statusStyles[order.status] ?? 'bg-stone-100 text-stone-700 ring-stone-200'

            return (
              <article
                className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_4px_16px_rgba(36,42,35,0.04)]"
                key={order.id}
              >
                <header className="flex flex-col gap-3 bg-[var(--surface-raised)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                      Order number
                    </p>
                    <h2 className="m-0 break-all text-base font-semibold text-[var(--ink)] sm:text-lg">
                      {order.orderNumber}
                    </h2>
                  </div>
                  <span className={`inline-flex min-h-8 w-fit items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${statusStyle}`}>
                    {orderStatusLabel(order.status)}
                  </span>
                </header>

                <div className="px-4 py-5 sm:px-6 sm:py-6">
                  <div className="mb-4 flex items-center gap-2 text-sm text-[var(--muted)]">
                    <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                    <span>Placed {date}</span>
                  </div>
                  <ul className="m-0 list-none divide-y divide-[var(--line)] border-y border-[var(--line)] p-0">
                    {order.items.map((item) => (
                      <li className="flex items-start justify-between gap-4 py-3 text-sm" key={item.id}>
                        <span className="min-w-0 font-medium leading-6 text-[var(--ink)]">
                          {item.productName}
                        </span>
                        <span className="shrink-0 text-[var(--muted)]">Qty {item.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="grid gap-1.5 text-sm">
                      <span className="text-[var(--muted)]">
                        Payment: {order.payment ? orderStatusLabel(order.payment.status) : 'No payment recorded'}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-4 sm:items-end sm:border-0 sm:pt-0">
                      <span className="text-xs text-[var(--muted)]">Order total</span>
                      <strong className="text-xl font-bold text-[var(--ink)]">{amount}</strong>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
                    <a className={actionClass} href={detailPath} onClick={onNavigate(detailPath)}>
                      View order details <ArrowRight aria-hidden="true" className="size-4" />
                    </a>
                    <a className={actionClass} href={orderTrackPath} onClick={onNavigate(orderTrackPath)}>
                      <Truck aria-hidden="true" className="size-4" />
                      Track an order
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {history.hasNextPage && (
        <div className="flex justify-center">
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={history.isFetching}
            onClick={() => void history.fetchNextPage({ cancelRefetch: false })}
          >
            {history.isFetchingNextPage ? 'Loading orders…' : 'Load older orders'}
          </button>
        </div>
      )}

      <aside className="flex flex-col gap-2 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
            Need help?
          </p>
          <p className="mb-0 text-sm text-[var(--muted)]">Questions about an order or delivery?</p>
        </div>
        <a
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
          href="/support"
          onClick={onNavigate('/support')}
        >
          Contact customer care <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </aside>
    </section>
  )
}
