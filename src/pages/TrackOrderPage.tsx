import { privateKey, sessionUser } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { apiFetch as fetch } from '../api/http'
import { useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { queryClient } from '../api/queryClient'
import type { StorefrontApiResponse } from '../api/storefront'

type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

export function TrackOrderPage({ onNavigate }: Props) {
  const [orderId, setOrderId] = useState(
    new URLSearchParams(window.location.search).get('order') ?? '',
  )
  type Tracking = {
    status: string
    shipment?: {
      events:
        | {
            id: string
            status: string
            description?: string | null
            location?: string | null
            occurredAt: string
          }[]
        | null
    } | null
  }
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
    try {
      const result = await queryClient.fetchQuery({
        queryKey: privateKey('tracking', normalized),
        staleTime: 0,
        retry: false,
        queryFn: async ({ signal }) => {
          const response = await fetch(`/api/orders/${encodeURIComponent(normalized)}/tracking`, {
            signal,
          })
          if (response.status === 404) throw new Error('NOT_FOUND')
          if (!response.ok) throw new Error('Unable to load tracking. Please try again.')
          return (await response.json()) as Tracking
        },
      })
      setTracking(result)
    } catch (error) {
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
    <section className="page-section track-page" aria-labelledby="track-title">
      <div className="track-hero">
        <p className="eyebrow">ORDER SUPPORT</p>
        <h1 id="track-title">Track your order</h1>
        <p className="hero-text">Enter your order number to see the latest delivery update.</p>
        <form className="track-form" onSubmit={submit} noValidate>
          <label htmlFor="order-id">Order number</label>
          <div>
            <input
              id="order-id"
              disabled={pending}
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value)
                setTracking(null)
                setError('')
              }}
              placeholder="Your order number"
              required
              aria-invalid={Boolean(error)}
            />
            <button className="primary-button" type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Checking...' : 'Track order'} <span aria-hidden="true">→</span>
            </button>
          </div>
          {error && (
            <small className="form-error" role="alert">
              {error}
            </small>
          )}
        </form>
      </div>
      {tracking && (
        <div className="tracking-card" aria-live="polite">
          <div className="tracking-card-header">
            <div>
              <p className="eyebrow">ORDER {orderId}</p>
              <h2>{tracking.status}</h2>
            </div>
            <span className="tracking-badge">Live status</span>
          </div>
          {tracking.shipment?.events?.length ? (
            <div className="tracking-progress">
              {tracking.shipment.events.map((event) => (
                <span className="complete" key={event.id}>
                  <i>✓</i>
                  <strong>{event.status}</strong>
                  <small>
                    {event.description ??
                      event.location ??
                      new Date(event.occurredAt).toLocaleString()}
                  </small>
                </span>
              ))}
            </div>
          ) : (
            <p className="tracking-note">
              Tracking events will appear as your order moves through fulfillment.
            </p>
          )}
        </div>
      )}
      <p className="track-help">
        Need help with an order?{' '}
        <a href="/support" onClick={onNavigate('/support')}>
          Contact customer care
        </a>
      </p>
    </section>
  )
}
