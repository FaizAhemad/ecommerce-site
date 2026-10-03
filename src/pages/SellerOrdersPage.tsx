import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { SellerNavigation } from '../components/SellerNavigation'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Card } from '../components/mui/Card'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Container } from '../components/mui/Container'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'
type Item = { id: string; orderNumber: string; shopName: string; productName: string; quantity: number; unitPriceMinor: number; currency: string; status: string; createdAt: string }
export function SellerOrdersPage({ onNavigate }: { onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const [page, setPage] = useState(0)
  const query = useQuery({ queryKey: privateKey('seller-orders', page), retry: false, queryFn: async ({ signal }) => {
    const response = await apiFetch(`/api/seller/orders?page=${page}`, { signal })
    if (!response.ok) throw new Error('Unable to load order records.')
    return await response.json() as { items: Item[]; nextPage: number | null }
  } })
  return <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}><Stack spacing={2.5}>
    <Typography component="h1" variant="h3">Shop order records</Typography>
    <SellerNavigation onNavigate={onNavigate} />
    <Typography color="text.secondary">Only items attributed to your approved shops are shown. Order status describes the customer order, not an independent seller shipment. Marketplace fulfillment and settlements are not enabled yet.</Typography>
    <Button variant="outlined" disabled={query.isFetching} onClick={() => void query.refetch()} sx={{ alignSelf: 'flex-start' }}>Refresh orders</Button>
    {query.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ py: 2, alignItems: 'center' }}><CircularProgress size={20} /><Typography color="text.secondary">Loading orders…</Typography></Stack>}
    {query.isError && <Alert severity="warning" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch()}>Retry</Button>}>Order records are unavailable. Refresh to retry.</Alert>}
    {query.data?.items.length === 0 && <Card variant="outlined" sx={{ p: 3 }}><Typography>No shop order records on this page.</Typography></Card>}
    {query.data?.items.map(item => <Card variant="outlined" component="article" key={item.id} sx={{ p: { xs: 2, sm: 2.5 } }}><Stack spacing={1}><Typography component="h2" variant="h6">{item.orderNumber}</Typography><Typography>{item.shopName} · {item.productName}</Typography><Typography>Quantity {item.quantity} · Unit price {item.currency} {(item.unitPriceMinor / 100).toFixed(2)}</Typography><Typography>Order status: {item.status}</Typography><Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString()}</Typography></Stack></Card>)}
    <Stack direction="row" spacing={1}><Button variant="outlined" disabled={page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outlined" disabled={query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</Button></Stack>
  </Stack></Container>
}
