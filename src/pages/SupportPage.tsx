import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { privateKey } from '../api/sessionScope'
import { supportRequest, type SupportTicket } from '../api/support'
import { SupportTicketCard } from '../components/SupportTicketCard'
import { SupportAttachments } from '../components/SupportAttachments'
import { useNotification } from '../components/NotificationProvider'
import { ArrowUpRight, ChevronDown, ClipboardList, MessageCircle, PackageSearch, Truck } from 'lucide-react'
import type { StorefrontApiResponse } from '../api/storefront'
import { Accordion } from '../components/mui/Accordion'
import { AccordionDetails } from '../components/mui/AccordionDetails'
import { AccordionSummary } from '../components/mui/AccordionSummary'
import { Alert } from '../components/mui/Alert'
import { Box } from '../components/mui/Box'
import { Button } from '../components/mui/Button'
import { Container } from '../components/mui/Container'
import { Link } from '../components/mui/Link'
import { Paper } from '../components/mui/Paper'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'
import { TextField } from '../components/mui/TextField'
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
  const link = (path: string, label: string) => (
    <Link href={path} onClick={onNavigate?.(path)}>
      {label}
    </Link>
  )

  if (!list) {
    const shortcuts = [
      { path: '/products', title: 'Browse products', description: 'Find items and read product reviews.', Icon: PackageSearch },
      { path: isAuthenticated ? '/orders' : '/login', title: isAuthenticated ? 'Your orders' : 'Sign in for your orders', description: isAuthenticated ? 'Review order and payment status.' : 'Sign in to review order and payment status.', Icon: ClipboardList },
      { path: '/track-order', title: 'Track an order', description: 'See the latest recorded delivery updates.', Icon: Truck },
      { path: isAuthenticated ? '/support-requests' : '/login', title: 'Support requests', description: 'Create a request and follow its status.', Icon: MessageCircle },
    ]
    const faqs = [
      { title: 'Finding and reviewing products', content: <>Use {link('/products', 'Products')} to search and filter the catalogue. Open a product to see its details, available media and customer reviews. Sign in to submit or edit your own review.</> },
      { title: 'Delivery addresses and account access', content: <>Visit {link('/profile', 'Profile')} to manage your details and saved addresses. If you cannot sign in, use {link('/forgot-password', 'password recovery')}. Email verification status and links are available in Profile.</> },
      { title: 'Checkout and payment status', content: <>Review your cart and confirmed charges before ordering. Checkout may be unavailable while the shop is configuring it. Payment is confirmed separately; if a request is interrupted, check {link('/orders', 'Orders')} before trying again.</> },
      { title: 'Delivery, cancellation, returns and refunds', content: <>Open your order for recorded tracking details. Read the published {link('/returns', 'returns policy')} and {link('/refund-policy', 'refund policy')}. If policy information is unavailable or you need an order-specific decision, contact support with the order number before proceeding.</> },
      { title: 'Following a support request', content: <>Sign in to create a request, then visit {link('/support-requests', 'Support requests')} for its recorded status and resolution. A saved request remains trackable even if email confirmation is unavailable.</> },
    ]
    return (
      <Container maxWidth="lg" component="section" aria-labelledby="support-title" sx={{ py: { xs: 3, sm: 5, lg: 6 } }}>
        <Stack spacing={{ xs: 3, sm: 4 }}>
          <Stack spacing={1.25}>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>{storefront.identity.businessName} · Customer care</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(16rem, 0.65fr)' }, alignItems: 'end', gap: { xs: 1, md: 4 } }}>
              <Typography id="support-title" component="h1" variant="h2" sx={{ fontSize: { xs: '2.25rem', sm: '3rem' }, lineHeight: 1.05, letterSpacing: '-0.04em' }}>Support, made simple.</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 520, justifySelf: { md: 'end' } }}>Find a quick answer below, check an order, or send our team a private support request.</Typography>
            </Box>
          </Stack>
          <Box component="nav" aria-label="Helpful links" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            {shortcuts.map(({ path, title, description, Icon }) => (
              <Paper key={title} component="a" href={path} onClick={onNavigate?.(path)} variant="outlined" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minHeight: { xs: 92, sm: 104 }, p: { xs: 2, sm: 2.5 }, textDecoration: 'none', color: 'text.primary', transition: 'border-color 160ms, box-shadow 160ms, transform 160ms', '&:hover': { borderColor: 'text.secondary', boxShadow: 2, transform: 'translateY(-2px)' }, '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.main', outlineOffset: 2 } }}>
                <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, flexShrink: 0, borderRadius: 2, bgcolor: 'action.hover' }}><Icon aria-hidden="true" size={18} /></Box>
                <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}><Typography variant="subtitle2">{title}</Typography><Typography variant="caption" color="text.secondary">{description}</Typography></Stack>
                <ArrowUpRight aria-hidden="true" size={16} />
              </Paper>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.25fr) minmax(18rem, 0.75fr)' }, alignItems: 'start', gap: { xs: 3, lg: 5 } }}>
            <Box component="section" aria-labelledby="support-faq-title" sx={{ minWidth: 0 }}>
              <Stack spacing={0.5} sx={{ mb: 2 }}><Typography variant="overline" color="text.secondary">Helpful answers</Typography><Typography id="support-faq-title" component="h2" variant="h4">Common questions</Typography></Stack>
              <Stack spacing={1}>
                {faqs.map(({ title, content }) => <Accordion key={title}><AccordionSummary expandIcon={<ChevronDown size={18} aria-hidden="true" />}>{title}</AccordionSummary><AccordionDetails><Typography variant="body2" sx={{ lineHeight: 1.8 }}>{content}</Typography></AccordionDetails></Accordion>)}
              </Stack>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>For information about customer data, visit {link('/privacy', 'Privacy')}. Never send passwords or full payment-card details through support.</Typography>
            </Box>
            <Paper component="aside" variant="outlined" aria-labelledby="contact-support-title" sx={{ p: { xs: 2.5, sm: 3 }, position: { lg: 'sticky' }, top: { lg: 96 } }}>
              <Stack spacing={1.25}>
                <Typography variant="overline" color="primary.main">Contact our team</Typography>
                <Typography id="contact-support-title" component="h2" variant="h5">Still need a hand?</Typography>
                <Typography variant="body2" color="text.secondary">Send a private request and keep a record you can return to.</Typography>
                <Link href={`mailto:${storefront.contact.supportEmail}`} sx={{ overflowWrap: 'anywhere' }}>{storefront.contact.supportEmail}</Link>
                {!isAuthenticated ? (
                  <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">Sign in to send a request and follow its status securely.</Typography><Button component="a" href="/login" onClick={onNavigate?.('/login')} variant="contained" fullWidth sx={{ mt: 2 }}>Sign in</Button></Paper>
                ) : saved ? (
                  <Paper variant="outlined" role="status" sx={{ p: 2 }}>
                    <Stack spacing={1}><Typography variant="subtitle1">Request recorded</Typography><Typography variant="caption" color="text.secondary">Reference: {saved.id}</Typography>
                      <SupportAttachments ticketId={saved.id} canUpload />
                      <Typography variant="caption" color="text.secondary">{saved.emailStatus === 'ACCEPTED' ? 'Confirmation email requested.' : 'Email confirmation is not confirmed. You can still track this request here.'}</Typography>
                      {link('/support-requests', 'Track your request')}
                      <Button variant="outlined" fullWidth onClick={() => { setSaved(null); setSubject(''); setMessage(''); identity.current = null }}>Start another request</Button>
                    </Stack>
                  </Paper>
                ) : (
                  <Stack component="form" spacing={2} aria-busy={pending} onSubmit={(event) => { event.preventDefault(); identity.current ??= crypto.randomUUID(); void write({ id: identity.current, subject, body: message }) }}>
                    {error && <Alert severity="error" role="alert">{error}</Alert>}
                    <TextField label="Subject" required slotProps={{ htmlInput: { maxLength: 120 } }} value={subject} disabled={pending} onChange={(event) => setSubject(event.target.value)} fullWidth />
                    <TextField label="How can we help?" required multiline minRows={5} slotProps={{ htmlInput: { maxLength: 4000 } }} value={message} disabled={pending} onChange={(event) => setMessage(event.target.value)} fullWidth />
                    <Typography variant="caption" color="text.secondary">Do not include passwords, payment-card details or sensitive health information.</Typography>
                    <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: { sm: 'flex-start' }, minWidth: { sm: 220 } }}>{pending ? 'Recording request…' : 'Send support request'}</Button>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    )
  }  if (admin) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={3} component="section" aria-labelledby="support-title">
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">{storefront.identity.businessName} · Admin workspace</Typography>
            <Typography id="support-title" component="h1" variant="h3">Support inbox</Typography>
            <Typography color="text.secondary">Review customer requests, messages, and resolution status.</Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component="a" href="/admin" variant="outlined" onClick={onNavigate?.('/admin')}>Back to admin</Button>
            <Button component="a" href="/support" variant="text" onClick={onNavigate?.('/support')}>Customer support page</Button>
          </Stack>
          {error && <Alert severity="error" role="alert">{error}</Alert>}
          {!isAuthenticated ? (
            <Alert severity="warning">Sign in with an administrator account to view support requests.</Alert>
          ) : (
            <>
              {query.isPending && <Paper variant="outlined" role="status" sx={{ p: 3 }}><Typography color="text.secondary">Loading support requests…</Typography></Paper>}
              {query.isError && <Alert severity="error" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => void (query.isFetchNextPageError ? query.fetchNextPage({ cancelRefetch: false }) : query.refetch({ cancelRefetch: false }))}>Retry</Button>}>Unable to load support requests. Try again.</Alert>}
              {query.isSuccess && !query.data.pages.some(page => page.tickets.length) && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No support requests yet</Typography><Typography color="text.secondary">New customer requests will appear here.</Typography></Paper>}
              <Stack spacing={2}>
                {query.data?.pages.flatMap(page => page.tickets).map(ticket => (
                  <SupportTicketCard key={ticket.id} ticket={ticket} admin pending={pending} update={write} />
                ))}
              </Stack>
              {query.hasNextPage && <Button variant="outlined" disabled={query.isFetching} onClick={() => void query.fetchNextPage({ cancelRefetch: false })}>{query.isFetching ? 'Loading requests…' : 'Load more requests'}</Button>}
            </>
          )}
        </Stack>
      </Container>
    )
  }
  return (
    <Container maxWidth="md" component="section" aria-labelledby="support-title" sx={{ py: { xs: 3, sm: 5 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">{storefront.identity.businessName} · Customer care</Typography>
          <Typography id="support-title" component="h1" variant="h3">Your support requests</Typography>
          <Typography color="text.secondary">Review saved requests and their latest recorded status.</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component="a" href="/support" variant="outlined" onClick={onNavigate?.('/support')}>Contact support</Button>
          <Button component="a" href="/" variant="text" onClick={onNavigate?.('/')}>Back to home</Button>
        </Stack>
        {error && <Alert severity="error" role="alert">{error}</Alert>}
        {!isAuthenticated ? (
          <Alert severity="info" action={<Button component="a" href="/login" size="small" onClick={onNavigate?.('/login')}>Sign in</Button>}>Sign in to view and follow your private support requests.</Alert>
        ) : (
          <>
            {query.isPending && <Paper variant="outlined" role="status" sx={{ p: 3 }}><Typography color="text.secondary">Loading support requests…</Typography></Paper>}
            {query.isError && <Alert severity="error" role="alert" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => void (query.isFetchNextPageError ? query.fetchNextPage({ cancelRefetch: false }) : query.refetch({ cancelRefetch: false }))}>Retry</Button>}>Unable to load support requests. Try again.</Alert>}
            {query.isSuccess && !query.data.pages.some(page => page.tickets.length) && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No support requests yet</Typography><Typography color="text.secondary">Requests you send to our team will appear here.</Typography><Button component="a" href="/support" variant="outlined" onClick={onNavigate?.('/support')} sx={{ mt: 1 }}>Contact support</Button></Paper>}
            <Stack spacing={2}>
              {query.data?.pages.flatMap(page => page.tickets).map(ticket => <SupportTicketCard key={ticket.id} ticket={ticket} admin={false} pending={pending} update={write} />)}
            </Stack>
            {query.hasNextPage && <Button variant="outlined" disabled={query.isFetching} onClick={() => void query.fetchNextPage({ cancelRefetch: false })}>{query.isFetching ? 'Loading requests…' : 'Load more requests'}</Button>}
          </>
        )}
      </Stack>
    </Container>
  )}
