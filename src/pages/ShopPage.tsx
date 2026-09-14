import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getProducts, type ProductSort, type StorefrontApiResponse } from '../api/storefront'
import { FilterSidebar } from '../components/FilterSidebar'
import { PromoCarousel } from '../components/PromoCarousel'
import { VirtualizedProductGrid } from '../components/VirtualizedProductGrid'

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
  const sentinel = useRef<HTMLDivElement>(null)
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
    <section className="collection-section page-section" aria-labelledby="collection-title">
      {!hasSearch && (
        <PromoCarousel
          promos={storefront.content.promotions}
          previousLabel={collection.carouselPreviousLabel}
          nextLabel={collection.carouselNextLabel}
        />
      )}
      <div className="section-heading">
        <div>
          <p className="eyebrow">{collection.eyebrow}</p>
          <h1 id="collection-title">
            {hasSearch ? `Search results for “${search}”` : collection.title}
          </h1>
        </div>
        <p className="section-note">{collection.description}</p>
      </div>
      <div className="catalog-layout">
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
        <div className="catalog-results">
          {productQuery.isError ? (
            <div className="state-panel" role="alert">
              <p>Unable to load products.</p>
              <button className="primary-button" onClick={() => void productQuery.refetch()}>
                Try again
              </button>
            </div>
          ) : initialLoading ? (
            <div
              className="product-grid product-grid-static product-skeleton-grid"
              aria-label="Loading products"
              aria-busy="true"
            >
              {skeletons.map((index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
              <VirtualizedProductGrid
                products={catalog}
                currency={currency}
                addToCartLabel={collection.addToCartLabel}
                ratingLabel={collection.ratingLabel}
                reviewsLabel={collection.reviewsLabel}
                onAdd={onAdd}
                onOpenProduct={onOpenProduct}
              />
              {!loading && catalog.length === 0 && (
                <p className="empty-state">{collection.noResultsLabel}</p>
              )}
            </>
          )}
        </div>
      </div>
      {nextCursor && (
        <button
          className="secondary-button"
          disabled={loading}
          onClick={() => {
            if (!productQuery.isFetching) void productQuery.fetchNextPage()
          }}
        >
          {loading ? 'Loading...' : 'Load more products'}
        </button>
      )}
      {!loading && catalog.length > 0 && !nextCursor && (
        <div className="catalog-end" role="status">
          <span>{collection.catalogEndLabel}</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {collection.catalogEndActionLabel} ↑
          </button>
        </div>
      )}
      <div className="catalog-sentinel" ref={sentinel} aria-live="polite">
        {loading && catalog.length > 0 ? collection.loadingMoreLabel : ''}
      </div>
    </section>
  )
}

function ProductSkeleton() {
  return (
    <article className="product-card product-skeleton" aria-hidden="true">
      <div className="product-art">
        <span className="skeleton-block skeleton-badge" />
        <span className="skeleton-circle" />
      </div>
      <div className="product-info">
        <div>
          <span className="skeleton-line skeleton-category" />
          <span className="skeleton-line skeleton-title" />
        </div>
        <span className="skeleton-line skeleton-price" />
      </div>
      <div className="product-rating">
        <span className="skeleton-line skeleton-rating" />
      </div>
      <div className="skeleton-button" />
    </article>
  )
}
