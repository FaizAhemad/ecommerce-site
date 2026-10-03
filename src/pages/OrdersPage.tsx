import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, PackageSearch, Truck } from 'lucide-react'
import { getOrders, orderStatusLabel, paymentStatusLabel } from '../api/orders'
import { privateKey } from '../api/sessionScope'
import { PurchaseFeedback } from '../components/PurchaseFeedback'
import { Alert } from '../components/mui/Alert'
import { Box } from '../components/mui/Box'
import { Button } from '../components/mui/Button'
import { Chip } from '../components/mui/Chip'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Paper } from '../components/mui/Paper'
import { Skeleton } from '../components/mui/Skeleton'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
const orderStatusColor: Record<string, 'default' | 'primary' | 'success' | 'info' | 'warning' | 'error'> = {
  PENDING: 'warning', CONFIRMED: 'success', PROCESSING: 'info', SHIPPED: 'info', DELIVERED: 'default', CANCELLED: 'error', REFUNDED: 'default',
}

export function OrdersPage({ storefront, onNavigate }: Props) {
  const history = useInfiniteQuery({
    queryKey: privateKey('orders'),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getOrders(pageParam, signal),
    getNextPageParam: (last) => last.nextPage ?? undefined,
    retry: false,
  })
  const orders = [...new Map((history.data?.pages.flatMap((page) => page.orders) ?? []).map((order) => [order.id, order])).values()]
  const locale = storefront.localization.locale
  const trackPath = '/track-order'
  return <Stack component="main" spacing={{ xs: 3, sm: 4 }} sx={{ width: '100%', maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5, lg: 7 } }}>
    <Stack component="header" direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="overline" color="text.secondary">Your account</Typography>
        <Typography component="h1" variant="h3">Your orders</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>View order details, payment status, and the latest recorded delivery updates.</Typography>
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        {history.data && <Typography variant="body2" color="text.secondary" aria-live="polite">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</Typography>}
        <Button component="a" variant="outlined" href={trackPath} onClick={onNavigate(trackPath)} startIcon={<Truck size={16} aria-hidden="true" />}>Track an order</Button>
      </Stack>
    </Stack>

    {history.isPending && <Stack spacing={2} role="status" aria-label="Loading your orders" aria-busy="true">
      {[0, 1].map((item) => <Paper variant="outlined" key={item} sx={{ p: { xs: 2, sm: 3 }, minHeight: 220 }}>
        <Skeleton variant="rounded" width={144} height={16} />
        <Skeleton sx={{ mt: 2 }} variant="rounded" width={208} height={12} />
        <Box sx={{ height: 1, bgcolor: 'divider', my: 2.5 }} />
        <Skeleton variant="rounded" width="75%" height={16} />
        <Skeleton sx={{ mt: 1.5 }} variant="rounded" width="50%" height={16} />
      </Paper>)}
    </Stack>}

    {history.isError && <Alert severity="error" role="alert" action={<Button variant="outlined" color="inherit" disabled={history.isFetching} onClick={() => void (history.isFetchNextPageError ? history.fetchNextPage({ cancelRefetch: false }) : history.refetch({ cancelRefetch: false }))}>{history.isFetching ? 'Retrying…' : 'Try again'}</Button>}>
      <Typography component="h2" variant="h6">Unable to load {orders.length ? 'more order history' : 'your orders'}</Typography>
      <Typography variant="body2">Your order history could not be refreshed. Please try again.</Typography>
    </Alert>}

    {history.isSuccess && orders.length === 0 && <Paper variant="outlined" sx={{ p: { xs: 3, sm: 6 }, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: '50%', bgcolor: 'action.hover', color: 'primary.main' }}><PackageSearch size={28} aria-hidden="true" /></Box>
        <Typography component="h2" variant="h5">No orders yet</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>When you place an order, its items and recorded status will appear here.</Typography>
        <Button component="a" variant="contained" href="/products" onClick={onNavigate('/products')} endIcon={<ArrowRight size={16} aria-hidden="true" />}>{storefront.content.cart.continueShoppingLabel || 'Browse products'}</Button>
      </Stack>
    </Paper>}

    {orders.length > 0 && <Stack spacing={{ xs: 2, sm: 2.5 }}>{orders.map((order) => {
      const detailPath = `/orders/${encodeURIComponent(order.id)}`
      const orderTrackPath = `${trackPath}?order=${encodeURIComponent(order.id)}`
      const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(order.createdAt))
      const amount = new Intl.NumberFormat(locale, { style: 'currency', currency: order.currency }).format(order.totalMinor / 100)
      return <Paper component="article" variant="outlined" key={order.id} sx={{ overflow: 'hidden', boxShadow: '0 4px 16px rgba(36,42,35,0.04)' }}>
        <Stack component="header" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, px: { xs: 2, sm: 3 }, py: 2, bgcolor: 'action.hover' }}>
          <Box sx={{ minWidth: 0 }}><Typography variant="overline" color="text.secondary">Order number</Typography><Typography component="h2" variant="subtitle1" sx={{ maxWidth: 640, overflowWrap: 'anywhere', fontFamily: 'monospace', fontWeight: 650 }}>{order.orderNumber}</Typography></Box>
          <Chip size="small" color={orderStatusColor[order.status] ?? 'default'} label={orderStatusLabel(order.status)} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }} />
        </Stack>
        <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CalendarDays size={16} aria-hidden="true" /><Typography variant="body2" color="text.secondary">Placed {date}</Typography></Stack>
          <Stack component="ul" spacing={0} sx={{ listStyle: 'none', m: 0, p: 0, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
            {order.items.map((item) => <Stack component="li" direction="row" spacing={2} key={item.id} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', py: 1.5, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
              <Typography variant="body2" sx={{ minWidth: 0, fontWeight: 600, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{item.productName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>Qty {item.quantity}</Typography>
            </Stack>)}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
            <Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Payment: {order.payment ? paymentStatusLabel(order.payment.status) : 'No payment recorded'}</Typography><Typography variant="caption" color="text.secondary">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</Typography></Stack>
            <Stack spacing={0.5} sx={{ alignItems: { sm: 'flex-end' } }}><Typography variant="caption" color="text.secondary">Order total</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{amount}</Typography></Stack>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Button component="a" variant="outlined" href={detailPath} onClick={onNavigate(detailPath)} endIcon={<ArrowRight size={16} aria-hidden="true" />}>View order details</Button>
            <Button component="a" variant="outlined" href={orderTrackPath} onClick={onNavigate(orderTrackPath)} startIcon={<Truck size={16} aria-hidden="true" />}>Track an order</Button>
          </Stack>
        </Stack>
      </Paper>
    })}</Stack>}

    {history.hasNextPage && <Stack sx={{ alignItems: 'center' }}><Button variant="outlined" disabled={history.isFetching} onClick={() => void history.fetchNextPage({ cancelRefetch: false })}>{history.isFetchingNextPage && <CircularProgress size={16} sx={{ mr: 1 }} />}{history.isFetchingNextPage ? 'Loading orders…' : 'Load older orders'}</Button></Stack>}
    {orders.length > 0 && <PurchaseFeedback />}
    <Stack component="aside" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, borderTop: 1, borderColor: 'divider', pt: 3 }}>
      <Box><Typography variant="overline" color="text.secondary">Need help?</Typography><Typography variant="body2" color="text.secondary">Questions about an order or delivery?</Typography></Box>
      <Button component="a" variant="text" href="/support" onClick={onNavigate('/support')} endIcon={<ArrowRight size={16} aria-hidden="true" />}>Contact customer care</Button>
    </Stack>
  </Stack>
}