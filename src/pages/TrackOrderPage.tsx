import { useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { privateKey, sessionUser, sessionGeneration, assertCurrentSession } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { apiFetch } from '../api/http'
import { queryClient } from '../api/queryClient'
import type { StorefrontApiResponse } from '../api/storefront'
import { OrderTimeline } from '../components/OrderTimeline'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Chip } from '../components/mui/Chip'
import { CircularProgress } from '../components/mui/CircularProgress'
import { TextField } from '../components/mui/TextField'

type Props = {
  storefront: StorefrontApiResponse
  isAuthenticated: boolean
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

type Tracking = {
  orderNumber: string
  status: string
  createdAt: string
  shipment?: {
    carrier?: string | null
    trackingCode?: string | null
    status?: string
    events: {
      id: string
      status: string
      description?: string | null
      location?: string | null
      occurredAt: string
    }[] | null
  } | null
}

export function TrackOrderPage({ storefront, isAuthenticated, onNavigate }: Props) {
  const [orderId, setOrderId] = useState(new URLSearchParams(window.location.search).get('order') ?? '')
  const [tracking, setTracking] = useState<Tracking | null>(null)
  const notify = useNotification()
  const [error, setError] = useState('')
  const lock = useRef(false)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (lock.current) return
    if (!sessionUser()) {
      notify('Please sign in to track your order.')
      return
    }
    const normalized = orderId.trim()
    if (!normalized) {
      setError('Enter an order number to continue.')
      return
    }
    setError('')
    setTracking(null)
    lock.current = true
    setPending(true)
    const generation = sessionGeneration()
    try {
      const result = await queryClient.fetchQuery({
        queryKey: privateKey('tracking', normalized),
        staleTime: 0,
        retry: false,
        queryFn: async ({ signal }) => {
          const response = await apiFetch(`/api/orders/${encodeURIComponent(normalized)}/tracking`, { signal })
          if (response.status === 404) throw new Error('NOT_FOUND')
          if (!response.ok) throw new Error('Unable to load tracking. Please try again.')
          return (await response.json()) as Tracking
        },
      })
      assertCurrentSession(generation)
      setTracking(result)
    } catch (error) {
      if (generation !== sessionGeneration()) return
      setTracking(null)
      if (error instanceof Error && error.message === 'NOT_FOUND')
        setError('We could not find that order. Check the number and try again.')
      else notify(error instanceof Error ? error : 'Unable to load tracking. Please try again.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 py-6 sm:space-y-8 sm:py-10 lg:py-12" aria-labelledby="track-title">
      <header className="border-b border-[var(--line)] pb-5 sm:pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">Order support</p>
        <h1 id="track-title" className="!m-0 !max-w-none !text-3xl !font-normal !leading-tight !tracking-tight text-[var(--ink)] sm:!text-4xl">Track your order</h1>
        <p className="mb-0 mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">Enter the order number to see its current status and recorded delivery updates.</p>
      </header>

      {!isAuthenticated ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <p className="m-0 text-sm leading-6 text-[var(--muted)]">Sign in to securely view tracking updates for your orders.</p>
          <a className="primary-button w-fit" href="/login" onClick={onNavigate('/login')}>Sign in to track an order <ArrowRight aria-hidden="true" className="size-4" /></a>
        </div>
      ) : <form className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4 sm:p-6" onSubmit={(event) => void submit(event)} noValidate>
        <TextField
            id="order-id"
            label="Order number"
            fullWidth
            size="small"
            disabled={pending}
            value={orderId}
            onChange={(change) => { setOrderId(change.target.value); setTracking(null); setError('') }}
            placeholder="e.g. GAD-…"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'track-error' : undefined}
          />
        <Button variant="contained" fullWidth type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <><CircularProgress size={16} sx={{ mr: 1 }} /> Checking order…</> : <>Track order <ArrowRight aria-hidden="true" className="ml-2 size-4" /></>}
        </Button>
        {error && <Alert id="track-error" className="sm:col-span-2" severity="error" role="alert">{error}</Alert>}
      </form>}

      {pending && <Alert severity="info" role="status">Checking the latest recorded status…</Alert>}

      {tracking && (
        <div className="grid gap-4" aria-live="polite">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Order number</p>
              <h2 className="!m-0 break-all font-mono !text-sm !font-semibold !leading-6 !tracking-normal text-[var(--ink)] sm:!text-base">{tracking.orderNumber}</h2>
            </div>
            <Chip size="small" label={tracking.status.replaceAll('_', ' ').toLowerCase()} />
          </div>
          {(tracking.shipment?.carrier || tracking.shipment?.trackingCode) && (
            <div className="grid gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2 sm:gap-4">
              {tracking.shipment.carrier && <p className="mb-0">Carrier: <span className="font-medium text-[var(--ink)]">{tracking.shipment.carrier}</span></p>}
              {tracking.shipment.trackingCode && <p className="mb-0 break-all">Tracking reference: <span className="font-medium text-[var(--ink)]">{tracking.shipment.trackingCode}</span></p>}
            </div>
          )}
          <OrderTimeline status={tracking.status} createdAt={tracking.createdAt} events={tracking.shipment?.events ?? []} locale={storefront.localization.locale} />
        </div>
      )}

      <p className="m-0 text-sm text-[var(--muted)]">Need help with an order? <a className="font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4" href="/support" onClick={onNavigate('/support')}>Contact customer care</a>.</p>
    </section>
  )
}
