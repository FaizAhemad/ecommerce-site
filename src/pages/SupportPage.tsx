import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { privateKey } from '../api/sessionScope'
import { supportRequest, type SupportTicket } from '../api/support'
import { SupportTicketCard } from '../components/SupportTicketCard'
import { SupportAttachments } from '../components/SupportAttachments'
import { useNotification } from '../components/NotificationProvider'
import { ArrowUpRight, ChevronDown, ClipboardList, MessageCircle, PackageSearch, Truck } from 'lucide-react'
import type { StorefrontApiResponse } from '../api/storefront'
export function SupportPage({
  storefront,
  isAuthenticated = false,
  mode = 'create',
  onNavigate,
}: {
  storefront: StorefrontApiResponse
  isAuthenticated?: boolean
  mode?: 'create' | 'list' | 'admin'
  onNavigate?: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
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
  const link = (path: string, label: string, className?: string) => (
    <a className={className} href={path} onClick={onNavigate?.(path)}>
      {label}
    </a>
  )

  if (!list) {
    return (
      <div className="w-full">
      <section className="mx-auto w-full max-w-[1240px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-12" aria-labelledby="support-title">
        <p className="m-0 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[var(--green)]">
          {storefront.identity.businessName} · Customer care
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)] md:items-end md:gap-8">
          <h1 id="support-title" className="!m-0 !max-w-none !text-4xl !font-semibold !leading-[1.05] !tracking-[-0.04em] text-[var(--ink)] sm:!text-5xl">
            Support, made simple.
          </h1>
          <p className="m-0 max-w-xl text-sm leading-6 text-[var(--muted)] md:justify-self-end">
            Find a quick answer below, check an order, or send our team a private support request.
          </p>
        </div>

        <nav aria-label="Helpful links" className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-8 sm:gap-4 xl:grid-cols-4">
          {[
            { path: '/products', title: 'Browse products', description: 'Find items and read product reviews.', Icon: PackageSearch },
            { path: '/orders', title: 'Your orders', description: 'Review order and payment status.', Icon: ClipboardList },
            { path: '/track-order', title: 'Track an order', description: 'See the latest recorded delivery updates.', Icon: Truck },
            { path: isAuthenticated ? '/support-requests' : '/login', title: 'Support requests', description: 'Create a request and follow its status.', Icon: MessageCircle },
          ].map(({ path, title, description, Icon }) => (
            <a
              key={title}
              href={path}
              onClick={onNavigate?.(path)}
              className="group flex min-h-24 items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-[rgba(40,49,59,0.3)] hover:bg-[var(--surface)] hover:shadow-[0_8px_20px_rgba(36,42,35,0.07)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:min-h-28 sm:p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[rgba(215,225,208,0.45)] text-[var(--ink)]"><Icon aria-hidden="true" className="size-[18px]" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-5 text-[var(--ink)]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{description}</span>
              </span>
              <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          ))}
        </nav>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:gap-10 xl:mt-10">
          <section className="min-w-0" aria-labelledby="support-faq-title">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Helpful answers</p>
            <h2 id="support-faq-title" className="!mb-5 !mt-1 !text-2xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!mb-6">Common questions</h2>
            <div className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] px-4 sm:px-6">
              <details className="group py-5 sm:py-6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold leading-6 text-[var(--ink)] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:text-base">Finding and reviewing products<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" /></summary>
                <p className="mb-0 mt-4 max-w-prose text-sm leading-7 text-[var(--muted)]">Use {link('/products', 'Products')} to search and filter the catalogue. Open a product to see its details, available media and customer reviews. Sign in to submit or edit your own review.</p>
              </details>
              <details className="group py-5 sm:py-6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold leading-6 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:text-base">Delivery addresses and account access<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" /></summary>
                <p className="mb-0 mt-4 max-w-prose text-sm leading-7 text-[var(--muted)]">Visit {link('/profile', 'Profile')} to manage your details and saved addresses. If you cannot sign in, use {link('/forgot-password', 'password recovery')}. Email verification status and links are available in Profile.</p>
              </details>
              <details className="group py-5 sm:py-6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold leading-6 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:text-base">Checkout and payment status<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" /></summary>
                <p className="mb-0 mt-4 max-w-prose text-sm leading-7 text-[var(--muted)]">Review your cart and confirmed charges before ordering. Checkout may be unavailable while the shop is configuring it. Payment is confirmed separately; if a request is interrupted, check {link('/orders', 'Orders')} before trying again.</p>
              </details>
              <details className="group py-5 sm:py-6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold leading-6 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:text-base">Delivery, cancellation, returns and refunds<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" /></summary>
                <p className="mb-0 mt-4 max-w-prose text-sm leading-7 text-[var(--muted)]">Open your order for recorded tracking details. Read the published {link('/returns', 'returns policy')} and {link('/refund-policy', 'refund policy')}. If policy information is unavailable or you need an order-specific decision, contact support with the order number before proceeding.</p>
              </details>
              <details className="group py-5 sm:py-6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold leading-6 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:text-base">Following a support request<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" /></summary>
                <p className="mb-0 mt-4 max-w-prose text-sm leading-7 text-[var(--muted)]">Sign in to create a request, then visit {link('/support-requests', 'Support requests')} for its recorded status and resolution. A saved request remains trackable even if email confirmation is unavailable.</p>
              </details>
            </div>
            <p className="mb-0 mt-4 text-xs leading-6 text-[var(--muted)]">For information about customer data, visit {link('/privacy', 'Privacy')}. Never send passwords or full payment-card details through support.</p>
          </section>

          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6 lg:sticky lg:top-24" aria-labelledby="contact-support-title">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">Contact our team</p>
            <h2 id="contact-support-title" className="!mb-2 !mt-1 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)]">Still need a hand?</h2>
            <p className="m-0 text-sm leading-6 text-[var(--muted)]">Send a private request and keep a record you can return to.</p>
            <a className="mt-3 inline-block break-all text-sm font-medium text-[var(--green)] underline decoration-[var(--line)] underline-offset-4" href={`mailto:${storefront.contact.supportEmail}`}>
              {storefront.contact.supportEmail}
            </a>
            {!isAuthenticated ? (
              <div className="mt-5 rounded-xl bg-[var(--paper)] p-4">
                <p className="m-0 text-sm leading-6 text-[var(--muted)]">Sign in to send a request and follow its status securely.</p>
                {link('/login', 'Sign in', 'primary-button mt-4 flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--green)]')}
              </div>
            ) : saved ? (
              <div className="mt-5 rounded-xl bg-[var(--paper)] p-4" role="status">
                <h3 className="m-0 text-base font-semibold text-[var(--ink)]">Request recorded</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Reference: {saved.id}</p>
                <SupportAttachments ticketId={saved.id} canUpload />
                <p className="my-3 text-xs leading-5 text-[var(--muted)]">
                  {saved.emailStatus === 'ACCEPTED' ? 'Confirmation email requested.' : 'Email confirmation is not confirmed. You can still track this request here.'}
                </p>
                {link('/support-requests', 'Track your request', 'text-sm font-semibold text-[var(--green)] underline underline-offset-4')}
                <button className="mt-4 min-h-11 w-full rounded-md border border-[var(--line)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface)]" onClick={() => { setSaved(null); setSubject(''); setMessage(''); identity.current = null }}>
                  Start another request
                </button>
              </div>
            ) : (
              <form
                className="mt-5 grid gap-4"
                aria-busy={pending}
                onSubmit={(event) => {
                  event.preventDefault()
                  identity.current ??= crypto.randomUUID()
                  void write({ id: identity.current, subject, body: message })
                }}
              >
                {error && <p className="m-0 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">{error}</p>}
                <label className="grid gap-1.5 text-sm font-medium text-[var(--ink)]">
                  Subject
                  <input className="min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]" required maxLength={120} value={subject} disabled={pending} onChange={(event) => setSubject(event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-[var(--ink)]">
                  How can we help?
                  <textarea className="w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-base font-normal leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]" required rows={5} maxLength={4000} value={message} disabled={pending} onChange={(event) => setMessage(event.target.value)} />
                </label>
                <p className="m-0 text-xs leading-5 text-[var(--muted)]">Do not include passwords, payment-card details or sensitive health information.</p>
                <button className="min-h-11 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60" disabled={pending}>
                  {pending ? 'Recording request…' : 'Send support request'}
                </button>
              </form>
            )}
          </aside>
        </div>
      </section>
      </div>
    )
  }
  return (
    <section className="page-section support-section" aria-labelledby="support-title">
      <p className="eyebrow">{storefront.identity.businessName}</p>
      <h1 id="support-title">
        {admin ? 'Manage support requests' : list ? 'Your support requests' : 'How can we help?'}
      </h1>
      <div className="profile-actions">
        <span>Gadgify support: {storefront.contact.supportEmail}</span>
        <a href="/support">Contact support</a>
        {isAuthenticated && <a href="/support-requests">Your requests</a>}
        {admin && <a href="/admin">Back to dashboard</a>}
      </div>
      {!list && <p>Use the form below to contact our support team and keep a record of your request.</p>}
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
          <SupportAttachments ticketId={saved.id} canUpload />
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
