import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { privateKey } from '../api/sessionScope'
import { supportRequest, type SupportTicket } from '../api/support'
import { SupportTicketCard } from '../components/SupportTicketCard'
import { useNotification } from '../components/NotificationProvider'
import type { StorefrontApiResponse } from '../api/storefront'
export function SupportPage({
  storefront,
  isAuthenticated = false,
  mode = 'create',
}: {
  storefront: StorefrontApiResponse
  isAuthenticated?: boolean
  mode?: 'create' | 'list' | 'admin'
}) {
  const admin = mode === 'admin',
    list = mode !== 'create'
  const [subject, setSubject] = useState(''),
    [message, setMessage] = useState(''),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState<SupportTicket | null>(null)
  const identity = useRef<string | null>(null),
    operation = useRef<AbortController | null>(null)
  const notify = useNotification()
  const query = useInfiniteQuery({
    queryKey: privateKey('support', mode),
    enabled: isAuthenticated && list,
    initialPageParam: 0,
    queryFn: async ({ signal, pageParam }) => {
      const result = await supportRequest(admin, 'GET', signal, undefined, pageParam)
      if (
        !Array.isArray(result.tickets) ||
        !(result.nextPage === null || typeof result.nextPage === 'number')
      )
        throw new Error('Unable to confirm support requests.')
      return { tickets: result.tickets, nextPage: result.nextPage }
    },
    getNextPageParam: (last) => last.nextPage ?? undefined,
    retry: false,
  })
  useEffect(() => () => operation.current?.abort(), [])
  const write = async (body: unknown) => {
    if (operation.current) return false
    const controller = new AbortController()
    operation.current = controller
    setPending(true)
    setError('')
    try {
      const result = await supportRequest(admin, list ? 'PATCH' : 'POST', controller.signal, body)
      if (controller.signal.aborted) return false
      if (list) {
        if (result.updated !== true)
          throw new Error('Unable to confirm the update. Check the request status.')
        void query.refetch({ cancelRefetch: false })
      } else {
        if (!result.ticket?.id)
          throw new Error(
            'Unable to confirm your request. Check your requests before trying again.',
          )
        setSaved(result.ticket)
      }
      notify(list ? 'Request status updated.' : 'Your support request was recorded.', 'success')
      return true
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Unable to complete the request.')
        notify(failure instanceof Error ? failure : 'Unable to complete the request.')
      }
      return false
    } finally {
      operation.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <section className="page-section support-section" aria-labelledby="support-title">
      <p className="eyebrow">{storefront.identity.businessName}</p>
      <h1 id="support-title">
        {admin ? 'Manage support requests' : list ? 'Your support requests' : 'How can we help?'}
      </h1>
      <div className="profile-actions">
        <a href="/support">Contact support</a>
        {isAuthenticated && <a href="/support-requests">Your requests</a>}
        {admin && <a href="/admin">Back to dashboard</a>}
      </div>
      {error && (
        <p className="state-message" role="alert">
          {error}
        </p>
      )}
      {!isAuthenticated ? (
        <p>
          <a href="/login">Sign in</a> to send and track a private support request.
        </p>
      ) : list ? (
        <>
          {query.isPending && <p role="status">Loading requests?</p>}
          {query.isError && (
            <div role="alert">
              <p>Unable to load requests.</p>
              <button
                className="secondary-button"
                disabled={query.isFetching}
                onClick={() =>
                  void (query.isFetchNextPageError
                    ? query.fetchNextPage({ cancelRefetch: false })
                    : query.refetch({ cancelRefetch: false }))
                }
              >
                Retry
              </button>
            </div>
          )}
          {query.isSuccess && !query.data.pages[0].tickets.length && (
            <p>No support requests yet.</p>
          )}
          {query.data?.pages
            .flatMap((page) => page.tickets)
            .map((ticket) => (
              <SupportTicketCard
                key={ticket.id}
                ticket={ticket}
                admin={admin}
                pending={pending}
                update={write}
              />
            ))}
          {query.hasNextPage && (
            <button
              className="secondary-button"
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage({ cancelRefetch: false })}
            >
              {query.isFetching ? 'Loading?' : 'Load more requests'}
            </button>
          )}
        </>
      ) : saved ? (
        <div className="state-message" role="status">
          <p>Your request is recorded. Reference: {saved.id}</p>
          <p>
            {saved.emailStatus === 'ACCEPTED'
              ? 'Confirmation email requested.'
              : 'Email confirmation is not confirmed. You can still track this request here.'}
          </p>
          <a href="/support-requests">Track your request</a>
          <button
            className="secondary-button"
            onClick={() => {
              setSaved(null)
              setSubject('')
              setMessage('')
              identity.current = null
            }}
          >
            Start another request
          </button>
        </div>
      ) : (
        <form
          className="auth-form"
          aria-busy={pending}
          onSubmit={(e) => {
            e.preventDefault()
            identity.current ??= crypto.randomUUID()
            void write({ id: identity.current, subject, body: message })
          }}
        >
          <label>
            Subject
            <input
              required
              maxLength={120}
              value={subject}
              disabled={pending}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label>
            How can we help?
            <textarea
              required
              rows={6}
              maxLength={4000}
              value={message}
              disabled={pending}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <p>Do not include passwords, payment card details or sensitive health information.</p>
          <button className="primary-button" disabled={pending}>
            {pending ? 'Recording request?' : 'Send request'}
          </button>
        </form>
      )}
    </section>
  )
}
