import { useCallback, useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getProducts, type ProductSort, type StorefrontApiResponse } from '../api/storefront'
import { FilterSidebar } from '../components/FilterSidebar'
import { PromoCarousel } from '../components/PromoCarousel'
import { ProductGrid } from '../components/ProductGrid'
import { Box } from '../components/mui/Box'
import { Button } from '../components/mui/Button'
import { Card } from '../components/mui/Card'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Skeleton } from '../components/mui/Skeleton'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

type Props = { storefront: StorefrontApiResponse; onAdd: (productId: string) => Promise<void>; onOpenProduct: (id: string) => void }
export function ShopPage({ storefront, onAdd, onOpenProduct }: Props) {
  const { collection } = storefront.content
  const initialSearch = new URLSearchParams(window.location.search).get('search') ?? ''
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), 300); return () => window.clearTimeout(timer) }, [search])
  const hasSearch = search.trim().length > 0
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get('category') ?? '')
  const [sort, setSort] = useState<ProductSort>('newest')
  const [selectedColors, setSelectedColors] = useState<readonly string[]>([])
  const [selectedRatings, setSelectedRatings] = useState<readonly number[]>([])
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })
  const productQuery = useInfiniteQuery({
    queryKey: ['catalog', { search: debouncedSearch, category, sort, colors: [...selectedColors].sort(), ratings: [...selectedRatings].sort() }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) => getProducts({ search: debouncedSearch, category, sort, colors: selectedColors, ratings: selectedRatings, cursor: pageParam }, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  })
  const catalog = productQuery.data?.pages.flatMap((page) => page.products) ?? []
  const loading = productQuery.isFetching
  const loadingMore = productQuery.isFetchingNextPage
  const paginationSentinel = useRef<HTMLDivElement>(null)
  const paginationLock = useRef(false)
  const { fetchNextPage, hasNextPage, isFetching } = productQuery
  const requestNextPage = useCallback(() => {
    if (!hasNextPage || isFetching || paginationLock.current) return
    paginationLock.current = true
    void fetchNextPage().finally(() => { paginationLock.current = false })
  }, [fetchNextPage, hasNextPage, isFetching])
  useEffect(() => {
    const sentinel = paginationSentinel.current
    if (!sentinel || !productQuery.hasNextPage || productQuery.isFetching || productQuery.isFetchNextPageError || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) requestNextPage() }, { rootMargin: '480px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [productQuery.hasNextPage, productQuery.isFetching, productQuery.isFetchNextPageError, requestNextPage])
  const updateCategory = (value: string) => {
    setCategory(value)
    const params = new URLSearchParams(window.location.search)
    if (value) params.set('category', value); else params.delete('category')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', `/products${query ? `?${query}` : ''}`)
  }
  const toggleColor = (color: string) => setSelectedColors((current) => current.includes(color) ? current.filter((item) => item !== color) : [...current, color])
  const clear = () => { setSearch(''); setCategory(''); window.history.replaceState(window.history.state, '', '/products'); setSort('newest'); setSelectedColors([]); setSelectedRatings([]) }
  const initialLoading = loading && catalog.length === 0
  return <Box component="section" aria-labelledby="collection-title" sx={{ width: '100%', maxWidth: '90rem', mx: 'auto', borderTop: 1, borderColor: 'divider', px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 0 }}>
    {!hasSearch && <PromoCarousel promos={storefront.content.promotions} previousLabel={collection.carouselPreviousLabel} nextLabel={collection.carouselNextLabel} />}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }} sx={{ alignItems: { xs: 'stretch', sm: 'flex-end' }, justifyContent: 'space-between', mb: { xs: 4, sm: 6 } }}>
      <Box sx={{ minWidth: 0 }}><Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>{collection.eyebrow}</Typography><Typography component="h1" id="collection-title" variant="h2" sx={{ maxWidth: 760, mt: 0.5, fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' }, lineHeight: 1.05 }}>{hasSearch ? `Search results for “${search}”` : collection.title}</Typography></Box>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320, textAlign: { xs: 'left', sm: 'right' } }}>{collection.description}</Typography>
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '17.5rem minmax(0, 1fr)' }, gap: { xs: 2.5, md: 4, xl: 5 } }}>
      <FilterSidebar search={search} category={category} sort={sort} categories={storefront.facets.categories} searchPlaceholder={collection.searchPlaceholder} allCategoriesLabel={collection.allCategoriesLabel} sortLabel={collection.sortLabel} newestSortLabel={collection.newestSortLabel} priceLowSortLabel={collection.priceLowSortLabel} priceHighSortLabel={collection.priceHighSortLabel} clearLabel={collection.clearFiltersLabel} collapseLabel={collection.collapseFiltersLabel} expandLabel={collection.expandFiltersLabel} selectedColors={selectedColors} selectedRatings={selectedRatings} colorOptions={storefront.facets.colors} colorValues={Object.assign({}, ...storefront.products.map((product) => product.colorValues ?? {}), ...catalog.map((product) => product.colorValues ?? {}))} ratingLabel={collection.ratingLabel} colorsLabel={collection.colorsFilterLabel} benefits={storefront.content.filterBenefits} onSearch={setSearch} onCategory={updateCategory} onSort={setSort} onRating={(value) => setSelectedRatings((current) => current.includes(value) ? current.filter((rating) => rating !== value) : [...current, value])} onColorToggle={toggleColor} onClear={clear} />
      <Box sx={{ minWidth: 0 }}>
        {productQuery.isError && catalog.length === 0 ? <Card role="alert" variant="outlined" sx={{ minHeight: 260, display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 2, p: 4, textAlign: 'center' }}><Typography color="text.secondary">Unable to load products.</Typography><Button variant="contained" onClick={() => void productQuery.refetch()}>Try again</Button></Card> : initialLoading ? <Box aria-label="Loading products" aria-busy="true" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: { xs: 2, sm: 2.5 }, minHeight: 980, alignContent: 'start' }}>{Array.from({ length: 8 }, (_, index) => <ProductSkeleton key={index} />)}</Box> : <>
          <ProductGrid products={catalog} currency={currency} addToCartLabel={collection.addToCartLabel} ratingLabel={collection.ratingLabel} reviewsLabel={collection.reviewsLabel} onAdd={onAdd} onOpenProduct={onOpenProduct} />
          {!loading && catalog.length === 0 && <Card role="status" variant="outlined" sx={{ my: 4, minHeight: 280, display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 1.5, p: 4, textAlign: 'center' }}><Typography component="span" aria-hidden="true" sx={{ fontSize: 32, color: 'primary.main' }}>⌕</Typography><Typography component="h2" variant="h5">No products found</Typography><Typography color="text.secondary" sx={{ maxWidth: 380 }}>{collection.noResultsLabel}</Typography><Button variant="outlined" onClick={clear} sx={{ mt: 1 }}>{collection.clearFiltersLabel}</Button></Card>}
        </>}
      </Box>
    </Box>
    {productQuery.hasNextPage && <Box ref={paginationSentinel} sx={{ height: 1 }} aria-hidden="true" />}
    {productQuery.hasNextPage && typeof IntersectionObserver === 'undefined' && <Stack sx={{ alignItems: 'center', mt: 3 }}><Button variant="outlined" disabled={loading} onClick={requestNextPage}>Load more products</Button></Stack>}
    {loadingMore && catalog.length > 0 && <Card role="status" aria-live="polite" aria-busy="true" variant="outlined" sx={{ mx: 'auto', mt: 3, mb: { xs: 5, md: 7 }, px: 2.5, py: 1.5, width: 'fit-content', maxWidth: '100%' }}><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><CircularProgress size={22} /><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>Finding a few more good finds…</Typography><Typography variant="caption" color="text.secondary">More useful pieces are loading into the collection.</Typography></Box></Stack></Card>}
    {productQuery.isFetchNextPageError && catalog.length > 0 && <Card role="alert" variant="outlined" sx={{ mx: 'auto', mt: 2, maxWidth: 520, p: 2, textAlign: 'center' }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center' }}><Typography variant="body2" color="text.secondary">More products could not be loaded.</Typography><Button variant="contained" onClick={requestNextPage}>Try again</Button></Stack></Card>}
    {!loading && catalog.length > 0 && !productQuery.hasNextPage && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', mt: 6, py: 3, borderTop: 1, borderBottom: 1, borderColor: 'divider', textAlign: 'center' }}><Typography variant="body2" color="text.secondary" role="status">{collection.catalogEndLabel}</Typography><Button variant="outlined" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{collection.catalogEndActionLabel} ↑</Button></Stack>}
  </Box>
}

function ProductSkeleton() {
  return <Card component="article" aria-hidden="true" sx={{ overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 3, pointerEvents: 'none' }}>
    <Box sx={{ aspectRatio: '1 / 1', bgcolor: 'action.hover', position: 'relative', p: 2 }}><Skeleton variant="rounded" width="30%" height={12} /><Skeleton variant="rounded" sx={{ position: 'absolute', width: '42%', height: '48%', top: '26%', left: '29%', borderRadius: '44% 44% 18% 18%' }} /></Box>
    <Stack spacing={1.5} sx={{ p: 2 }}><Skeleton width="34%" height={13} /><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Skeleton width="68%" height={18} /><Skeleton variant="circular" width={40} height={40} /></Stack><Skeleton width="48%" height={14} /><Skeleton width="60%" height={16} /><Skeleton variant="rounded" height={44} sx={{ mt: 1 }} /></Stack>
  </Card>
}
