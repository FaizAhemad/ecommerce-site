import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Card } from '../components/mui/Card'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Skeleton } from '../components/mui/Skeleton'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'
import { privateKey } from '../api/sessionScope'

type Product = { id: string; name: string; description: string; category: string; mediaIds: string[]; priceMinor: number; catalogId: string | null }
type ShopsResponse = { shops?: { name: string; slug: string }[]; shop?: { name: string; slug: string }; products?: Product[]; nextPage: number | null }

function ShopMedia({ slug, productId, id }: { slug: string; productId: string; id: string }) {
  const query = useQuery({ queryKey: ['shop-media', slug, productId, id], retry: false, gcTime: 0, staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await apiFetch(`/api/shops?slug=${encodeURIComponent(slug)}&productId=${encodeURIComponent(productId)}&mediaId=${encodeURIComponent(id)}`, { signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Media unavailable')
      return await response.json() as { data: string; contentType: string }
    },
  })
  if (query.isPending) return <Stack role="status" sx={{ minHeight: 180, justifyContent: 'center', alignItems: 'center' }}><CircularProgress size={24} /><Typography variant="caption" color="text.secondary">Loading media…</Typography></Stack>
  if (!query.data || query.isError) return <Alert severity="warning">This product media is unavailable.</Alert>
  return query.data.contentType.startsWith('video/')
    ? <video controls preload="metadata" src={query.data.data} aria-label="Shop product video" style={{ maxWidth: '100%', maxHeight: 360 }} />
    : <img src={query.data.data} alt="Shop product" loading="lazy" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }} />
}

export function ShopsPage({ slug, admin = false }: { slug?: string; admin?: boolean }) {
  const [page, setPage] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const access = useQuery({
    queryKey: privateKey('shops-access'), enabled: !admin, retry: false, staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/shops/access', { signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Unable to verify shop access. Please try again.')
      return await response.json() as { allowed: boolean }
    },
  })
  const canBrowse = admin || access.data?.allowed === true
  const query = useQuery({
    queryKey: [...privateKey('marketplace-shops'), slug, page], enabled: canBrowse, retry: false, gcTime: 0, staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await apiFetch(`/api/shops?page=${page}${slug ? `&slug=${encodeURIComponent(slug)}` : ''}`, { signal, cache: 'no-store' })
      if (!response.ok) throw new Error(response.status === 404 ? 'This shop is unavailable.' : 'Unable to load shops. Please try again.')
      return await response.json() as ShopsResponse
    },
  })
  const shops = query.data?.shops ?? []
  const products = query.data?.products ?? []
  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
  if (!admin && access.isPending) return <Stack component="main" role="status" aria-busy="true" spacing={2} sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, sm: 5 } }}><Typography component="h1" variant="h4">Checking shop access</Typography><Skeleton variant="rounded" height={80} /></Stack>
  if (!admin && access.isError) return <Stack component="main" spacing={2} sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}><Alert severity="error" role="alert">{access.error instanceof Error ? access.error.message : 'Unable to verify shop access.'}</Alert><Button component="a" href="/products" variant="outlined">Back to Gadgify products</Button></Stack>
  if (!canBrowse) return <Stack component="main" spacing={2} sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}><Typography component="h1" variant="h4">Shop browsing is for approved sellers and admins</Typography><Typography color="text.secondary">Customers can browse and order through Gadgify Products. To sell through Gadgify, submit a shop application.</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button component="a" href="/products" variant="contained">Browse Gadgify products</Button><Button component="a" href="/seller" variant="outlined">Sell with us</Button></Stack></Stack>
  return <Stack component="main" spacing={{ xs: 2.5, sm: 3.5 }} sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, sm: 5 } }}>
    <Stack spacing={1}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>Gadgify marketplace</Typography>
      <Typography component="h1" variant="h2" sx={{ fontSize: { xs: '2rem', sm: '2.7rem' } }}>{query.data?.shop?.name ?? (slug ? 'Shop showcase' : 'Discover shops')}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 760 }}>Explore approved shop products. Products become orderable through Gadgify only after the shop accepts its exact fee offer.</Typography>
    </Stack>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button component="a" href="/shops" variant="outlined">All shops</Button>
      <Button component="a" href="/seller" variant="outlined">Sell with us</Button>
      <Button variant="text" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh</Button>
    </Stack>
    {query.isPending && <Stack role="status" aria-busy="true" spacing={2}>{[0, 1, 2].map(item => <Skeleton key={item} variant="rounded" height={72} />)}</Stack>}
    {query.isError && <Alert severity="error" role="alert" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Try again</Button>}>{query.error instanceof Error ? query.error.message : 'Unable to load this marketplace page.'}</Alert>}
    {!slug && shops.length > 0 && <Stack spacing={1.5}>
      <Typography component="h2" variant="h5">Shops</Typography>
      {shops.map(shop => <Card variant="outlined" component="article" key={shop.slug} sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Typography component="h3" variant="h6">{shop.name}</Typography>
          <Button component="a" href={`/shops/${encodeURIComponent(shop.slug)}`} variant="outlined">Visit shop</Button>
        </Stack>
      </Card>)}
    </Stack>}
    {products.map(product => <Card variant="outlined" component="article" key={product.id} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={1.5}>
        <Typography variant="overline" color="text.secondary">{product.category}</Typography>
        <Typography component="h2" variant="h5">{product.name}</Typography>
        <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{product.description}</Typography>
        <Typography variant="h6">{money.format(product.priceMinor / 100)}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {product.catalogId && <Button component="a" href={`/product/${encodeURIComponent(product.catalogId)}`} variant="contained">View product details</Button>}
          {product.mediaIds.length > 0 && <Button variant="outlined" onClick={() => setPreview(preview === product.id ? null : product.id)}>{preview === product.id ? 'Hide media' : 'View product media'}</Button>}
        </Stack>
        {preview === product.id && slug && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>{product.mediaIds.map(id => <ShopMedia key={id} slug={slug} productId={product.id} id={id} />)}</Stack>}
      </Stack>
    </Card>)}
    {query.isSuccess && !shops.length && !products.length && <Card variant="outlined" role="status" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}><Typography component="h2" variant="h5">{slug ? 'No approved products to show yet' : 'No approved shops to show yet'}</Typography><Typography color="text.secondary">Please check back later or explore the main product collection.</Typography><Button component="a" href="/products" variant="outlined" sx={{ mt: 1 }}>Browse products</Button></Card>}
    {!slug && (query.data?.nextPage != null || page > 0) && <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}><Button variant="outlined" disabled={page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outlined" disabled={query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</Button></Stack>}
  </Stack>
}
