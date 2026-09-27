import { useCallback, useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { getProducts, type ProductSort, type StorefrontApiResponse } from '../api/storefront'
import { FilterSidebar } from '../components/FilterSidebar'
import { PromoCarousel } from '../components/PromoCarousel'
import { ProductGrid } from '../components/ProductGrid'
import {
  productAddButtonClass,
  productCardClass,
  productGridClass,
  productInfoClass,
  productMediaClass,
  productRatingClass,
  productSwatchesClass,
  productTitleRowClass,
} from '../components/productCardStyles'
import { cn } from '../lib/utils'

type Props = {
  storefront: StorefrontApiResponse
  onAdd: (productId: string) => Promise<void>
  onOpenProduct: (id: string) => void
}
export function ShopPage({ storefront, onAdd, onOpenProduct }: Props) {
  const { collection } = storefront.content
  const initialSearch = new URLSearchParams(window.location.search).get('search') ?? ''
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])
  const hasSearch = search.trim().length > 0
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<ProductSort>('newest')
  const [selectedColors, setSelectedColors] = useState<readonly string[]>([])
  const [selectedRatings, setSelectedRatings] = useState<readonly number[]>([])
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  const productQuery = useInfiniteQuery({
    queryKey: [
      'catalog',
      {
        search: debouncedSearch,
        category,
        sort,
        colors: [...selectedColors].sort(),
        ratings: [...selectedRatings].sort(),
      },
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      getProducts(
        {
          search: debouncedSearch,
          category,
          sort,
          colors: selectedColors,
          ratings: selectedRatings,
          cursor: pageParam,
        },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  })
  const catalog = productQuery.data?.pages.flatMap((page) => page.products) ?? []
  const nextCursor = productQuery.hasNextPage
  const loading = productQuery.isFetching
  const loadingMore = productQuery.isFetchingNextPage
  const paginationSentinel = useRef<HTMLDivElement>(null)
  const paginationLock = useRef(false)
  const { fetchNextPage, hasNextPage, isFetching } = productQuery
  const requestNextPage = useCallback(() => {
    if (!hasNextPage || isFetching || paginationLock.current) return
    paginationLock.current = true
    void fetchNextPage().finally(() => {
      paginationLock.current = false
    })
  }, [fetchNextPage, hasNextPage, isFetching])
  useEffect(() => {
    const sentinel = paginationSentinel.current
    if (
      !sentinel ||
      !productQuery.hasNextPage ||
      productQuery.isFetching ||
      productQuery.isFetchNextPageError ||
      !('IntersectionObserver' in window)
    )
      return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) requestNextPage()
      },
      { rootMargin: '480px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [
    productQuery.hasNextPage,
    productQuery.isFetching,
    productQuery.isFetchNextPageError,
    requestNextPage,
  ])
  const updateSearch = (value: string) => setSearch(value)
  const updateCategory = (value: string) => setCategory(value)
  const toggleColor = (color: string) =>
    setSelectedColors((current) =>
      current.includes(color) ? current.filter((item) => item !== color) : [...current, color],
    )
  const clear = () => {
    setSearch('')
    setCategory('')
    setSort('newest')
    setSelectedColors([])
    setSelectedRatings([])
  }
  const initialLoading = loading && catalog.length === 0
  const skeletons = Array.from({ length: 8 }, (_, index) => index)
  return (
    <section
      className="mx-auto w-full max-w-[90rem] border-t border-[var(--line)] px-4 pb-0 pt-8 md:px-8 md:pt-[86px]"
      aria-labelledby="collection-title"
    >
      {!hasSearch && (
        <PromoCarousel
          promos={storefront.content.promotions}
          previousLabel={collection.carouselPreviousLabel}
          nextLabel={collection.carouselNextLabel}
        />
      )}
      <div className="mb-9 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
            {collection.eyebrow}
          </p>
          <h1 className="m-0 max-w-4xl font-[var(--font-display)] text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.04] tracking-[-0.04em] text-[var(--ink)]" id="collection-title">
            {hasSearch ? `Search results for “${search}”` : collection.title}
          </h1>
        </div>
        <p className="m-0 max-w-xs font-display text-base leading-6 text-[var(--muted)] sm:text-right">
          {collection.description}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[17.5rem_minmax(0,1fr)] md:gap-8 xl:gap-10">
        <FilterSidebar
          search={search}
          category={category}
          sort={sort}
          categories={storefront.facets.categories}
          searchPlaceholder={collection.searchPlaceholder}
          allCategoriesLabel={collection.allCategoriesLabel}
          sortLabel={collection.sortLabel}
          newestSortLabel={collection.newestSortLabel}
          priceLowSortLabel={collection.priceLowSortLabel}
          priceHighSortLabel={collection.priceHighSortLabel}
          clearLabel={collection.clearFiltersLabel}
          collapseLabel={collection.collapseFiltersLabel}
          expandLabel={collection.expandFiltersLabel}
          selectedColors={selectedColors}
          selectedRatings={selectedRatings}
          colorOptions={storefront.facets.colors}
          colorValues={Object.assign(
            {},
            ...storefront.products.map((product) => product.colorValues ?? {}),
            ...catalog.map((product) => product.colorValues ?? {}),
          )}
          ratingLabel={collection.ratingLabel}
          colorsLabel={collection.colorsFilterLabel}
          benefits={storefront.content.filterBenefits}
          onSearch={updateSearch}
          onCategory={updateCategory}
          onSort={setSort}
          onRating={(value) =>
            setSelectedRatings((current) =>
              current.includes(value)
                ? current.filter((rating) => rating !== value)
                : [...current, value],
            )
          }
          onColorToggle={toggleColor}
          onClear={clear}
        />
        <div className="min-w-0">
          {productQuery.isError && catalog.length === 0 ? (
            <div className="grid min-h-64 place-content-center justify-items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-8 text-center" role="alert">
              <p className="m-0 text-sm text-[var(--muted)]">Unable to load products.</p>
              <button className="min-h-11 rounded-md bg-[var(--ink)] px-5 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]" onClick={() => void productQuery.refetch()}>
                Try again
              </button>
            </div>
          ) : initialLoading ? (
            <div
              className={cn(productGridClass, 'min-h-[980px] content-start')}
              aria-label="Loading products"
              aria-busy="true"
            >
              {skeletons.map((index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
              <ProductGrid
                products={catalog}
                currency={currency}
                addToCartLabel={collection.addToCartLabel}
                ratingLabel={collection.ratingLabel}
                reviewsLabel={collection.reviewsLabel}
                onAdd={onAdd}
                onOpenProduct={onOpenProduct}
              />
              {!loading && catalog.length === 0 && (
                <div className="my-8 grid min-h-72 place-content-center justify-items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-6 py-12 text-center" role="status">
                  <span className="grid size-12 place-items-center rounded-full bg-[var(--surface)] text-xl text-[var(--green)]" aria-hidden="true">⌕</span>
                  <h2 className="m-0 font-display text-2xl font-normal text-[var(--ink)]">No products found</h2>
                  <p className="m-0 max-w-sm text-sm leading-6 text-[var(--muted)]">{collection.noResultsLabel}</p>
                  <button className="mt-2 min-h-11 rounded-md border border-[var(--line)] px-4 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]" type="button" onClick={clear}>
                    {collection.clearFiltersLabel}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {nextCursor && <div ref={paginationSentinel} className="h-1" aria-hidden="true" />}
      {nextCursor && typeof IntersectionObserver === 'undefined' && (
        <button
          className="mx-auto mt-6 flex min-h-11 items-center rounded-md border border-[var(--line)] px-5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
          type="button"
          disabled={loading}
          onClick={requestNextPage}
        >
          Load more products
        </button>
      )}
      {loadingMore && catalog.length > 0 && (
        <div
          className="mx-auto mt-7 flex w-fit max-w-full items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-5 py-3 shadow-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--green)]/10 text-[var(--green)]">
            <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin motion-reduce:animate-none" />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm font-semibold text-[var(--ink)]">Finding a few more good finds…</span>
            <span className="text-xs text-[var(--muted)]">More useful pieces are loading into the collection.</span>
          </span>
        </div>
      )}
      {productQuery.isFetchNextPageError && catalog.length > 0 && (
        <div className="mx-auto mt-4 flex max-w-lg flex-wrap items-center justify-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] p-4 text-center" role="alert">
          <p className="m-0 text-sm text-[var(--muted)]">More products could not be loaded.</p>
          <button
            className="min-h-11 rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            type="button"
            onClick={requestNextPage}
          >
            Try again
          </button>
        </div>
      )}
      {!loading && catalog.length > 0 && !nextCursor && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-y border-[var(--line)] py-7 text-center text-sm text-[var(--muted)]" role="status">
          <span>{collection.catalogEndLabel}</span>
          <button className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--surface-raised)] px-4 text-sm text-[var(--ink)] hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {collection.catalogEndActionLabel} ↑
          </button>
        </div>
      )}
    </section>
  )
}

function ProductSkeleton() {
  return (
    <article className={cn(productCardClass, 'pointer-events-none')} aria-hidden="true">
      <div className={cn(productMediaClass, 'animate-pulse bg-[var(--skeleton-base)]')}>
        <span className="absolute left-3.5 top-3.5 z-10 h-2.5 w-16 animate-pulse rounded bg-[var(--skeleton-shape)]" />
        <span className="absolute left-[28%] top-[27%] h-[54%] w-[44%] animate-pulse rounded-[44%_44%_18%_18%] bg-[var(--skeleton-shape)]" />
      </div>
      <div className={productInfoClass}>
        <div className="flex min-w-0 flex-col">
          <span className="mb-1 h-[13px] w-20 animate-pulse rounded-sm bg-[var(--skeleton-base)]" />
          <div className={productTitleRowClass}>
            <span className="h-4 w-3/4 animate-pulse self-center rounded-sm bg-[var(--skeleton-base)]" />
            <span className="size-11 shrink-0 animate-pulse rounded-full bg-[var(--skeleton-shape)]" />
          </div>
          <span className="mt-1.5 h-3.5 w-1/2 animate-pulse rounded-sm bg-[var(--skeleton-base)]" />
        </div>
        <div className="flex min-h-11 w-full items-center">
          <span className="h-4 w-16 animate-pulse rounded-sm bg-[var(--skeleton-base)]" />
        </div>
      </div>
      <div className={productRatingClass}>
        <span className="h-3 w-24 animate-pulse rounded-full bg-[var(--skeleton-base)]" />
      </div>
      <div className={productSwatchesClass} aria-hidden="true">
        <span className="size-[18px] animate-pulse rounded-full bg-[var(--skeleton-shape)]" />
        <span className="size-[18px] animate-pulse rounded-full bg-[var(--skeleton-shape)]" />
      </div>
      <div className={cn(productAddButtonClass, 'animate-pulse bg-[var(--skeleton-base)]')} />
    </article>
  )
}
