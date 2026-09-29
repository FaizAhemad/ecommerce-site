import { Check, Circle, PackageCheck, Truck } from 'lucide-react'
import { orderStatusLabel } from '../api/orders'

type DeliveryEvent = {
  id: string
  status: string
  description?: string | null
  location?: string | null
  occurredAt: string
}

const steps = [
  { label: 'Order received', Icon: PackageCheck },
  { label: 'Confirmed', Icon: Check },
  { label: 'Being prepared', Icon: PackageCheck },
  { label: 'Shipped', Icon: Truck },
  { label: 'Delivered', Icon: Check },
] as const

const progressByStatus: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
}

function formatDate(value: string, locale: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function OrderTimeline({
  status,
  createdAt,
  events = [],
  locale = 'en-IN',
}: {
  status: string
  createdAt: string
  events?: DeliveryEvent[]
  locale?: string
}) {
  const progress = progressByStatus[status]
  const terminal = status === 'CANCELLED' || status === 'REFUNDED'
  const orderedEvents = [...events].sort(
    (first, second) => new Date(first.occurredAt).getTime() - new Date(second.occurredAt).getTime(),
  )

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="order-progress-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Order updates</p>
          <h2 id="order-progress-title" className="!m-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!text-2xl">Order progress</h2>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-full bg-[rgba(215,225,208,0.55)] px-3 text-xs font-semibold text-[var(--ink)]">
          {orderStatusLabel(status)}
        </span>
      </div>

      {terminal ? (
        <ol className="m-0 list-none p-0" aria-label="Order timeline">
          <li className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgba(215,225,208,0.7)] text-[var(--ink)]"><Check aria-hidden="true" className="size-4" /></span>
            <span className="min-w-0 pb-5">
              <strong className="block text-sm font-semibold text-[var(--ink)]">Order received</strong>
              <time className="mt-1 block text-sm text-[var(--muted)]" dateTime={createdAt}>{formatDate(createdAt, locale)}</time>
            </span>
          </li>
          <li className="flex gap-3" aria-current="step">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-800"><Circle aria-hidden="true" className="size-3 fill-current" /></span>
            <span className="min-w-0">
              <strong className="block text-sm font-semibold text-[var(--ink)]">{status === 'CANCELLED' ? 'Order cancelled' : 'Order refunded'}</strong>
              <span className="mt-1 block text-sm text-[var(--muted)]">Current status</span>
            </span>
          </li>
        </ol>
      ) : Number.isInteger(progress) ? (
        <ol className="m-0 list-none p-0" aria-label="Order timeline">
          {steps.map(({ label, Icon }, index) => {
            const complete = index < progress
            const current = index === progress
            return (
              <li className="flex gap-3" key={label} aria-current={current ? 'step' : undefined}>
                <span className="flex flex-col items-center">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full ${complete || current ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]'}`}>
                    {complete ? <Check aria-hidden="true" className="size-4" /> : <Icon aria-hidden="true" className="size-4" />}
                  </span>
                  {index < steps.length - 1 && <span className={`my-1 min-h-5 w-px grow ${complete ? 'bg-[var(--ink)]' : 'bg-[var(--line)]'}`} aria-hidden="true" />}
                </span>
                <span className={`min-w-0 ${index < steps.length - 1 ? 'pb-4' : ''}`}>
                  <strong className={`block text-sm ${current ? 'font-semibold text-[var(--ink)]' : complete ? 'font-medium text-[var(--ink)]' : 'font-medium text-[var(--muted)]'}`}>{label}</strong>
                  {index === 0 ? (
                    <time className="mt-1 block text-sm text-[var(--muted)]" dateTime={createdAt}>{formatDate(createdAt, locale)}</time>
                  ) : current ? (
                    <span className="mt-1 block text-sm text-[var(--muted)]">Current status</span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="m-0 text-sm leading-6 text-[var(--muted)]">Order progress is not available for this status.</p>
      )}

      <div className="mt-5 border-t border-[var(--line)] pt-4">
        <h3 className="!mb-2 !text-sm !font-semibold !tracking-normal text-[var(--ink)]">Recorded delivery updates</h3>
        {orderedEvents.length ? (
          <ol className="m-0 list-none space-y-0 p-0" aria-label="Recorded delivery updates">
            {orderedEvents.map((event, index) => (
              <li className="flex gap-3" key={event.id}>
                <span className="flex flex-col items-center">
                  <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[var(--green)]" aria-hidden="true" />
                  {index < orderedEvents.length - 1 && <span className="my-1 min-h-5 w-px grow bg-[var(--line)]" aria-hidden="true" />}
                </span>
                <span className={`min-w-0 ${index < orderedEvents.length - 1 ? 'pb-4' : ''}`}>
                  <strong className="block text-sm font-medium text-[var(--ink)]">{event.status.replaceAll('_', ' ').toLowerCase()}</strong>
                  {(event.description || event.location) && <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">{[event.description, event.location].filter(Boolean).join(' · ')}</span>}
                  <time className="mt-1 block text-xs text-[var(--muted)]" dateTime={event.occurredAt}>{formatDate(event.occurredAt, locale)}</time>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 text-sm leading-6 text-[var(--muted)]">No delivery scans have been recorded yet. New updates will appear here.</p>
        )}
      </div>
    </section>
  )
}
