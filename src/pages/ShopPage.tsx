import { useEffect, useRef, useState } from 'react'
import { getProducts, type ProductSort, type StorefrontApiResponse, type StorefrontProduct } from '../api/storefront'
import { VirtualizedProductGrid } from '../components/VirtualizedProductGrid'
import { FilterSidebar } from '../components/FilterSidebar'

type ShopPageProps = { storefront: StorefrontApiResponse; onAdd: () => void; onOpenProduct: (id: string) => void }

export function ShopPage({ storefront, onAdd, onOpenProduct }: ShopPageProps) {
  const { collection } = storefront.content
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<ProductSort>('newest')
  const [selectedColors, setSelectedColors] = useState<readonly string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [catalog, setCatalog] = useState<readonly StorefrontProduct[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const sentinel = useRef<HTMLDivElement>(null)
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })

  useEffect(() => {
    let cancelled = false
    getProducts({ search, category, sort, colors: selectedColors, minRating }).then((page) => {
      if (cancelled) return
      setCatalog(page.products)
      setNextCursor(page.nextCursor)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [category, search, sort, selectedColors, minRating])

  useEffect(() => {
    if (!sentinel.current || !nextCursor) return
    const observer = new IntersectionObserver(() => setNextCursor(null), { rootMargin: '300px' })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [nextCursor])

  const updateSearch = (value: string) => { setLoading(true); setSearch(value) }
  const updateCategory = (value: string) => { setLoading(true); setCategory(value) }
  const toggleColor = (color: string) => { setLoading(true); setSelectedColors((current) => current.includes(color) ? current.filter((item) => item !== color) : [...current, color]) }
  return (
    <section className="collection-section page-section" aria-labelledby="collection-title">
      <div className="section-heading"><div><p className="eyebrow">{collection.eyebrow}</p><h1 id="collection-title">{collection.title}</h1></div><p className="section-note">{collection.description}</p></div>
      <div className="catalog-layout"><FilterSidebar search={search} category={category} sort={sort} categories={storefront.facets.categories} searchPlaceholder={collection.searchPlaceholder} allCategoriesLabel={collection.allCategoriesLabel} sortLabel={collection.sortLabel} newestSortLabel={collection.newestSortLabel} priceLowSortLabel={collection.priceLowSortLabel} priceHighSortLabel={collection.priceHighSortLabel} clearLabel={collection.clearFiltersLabel} collapseLabel={collection.collapseFiltersLabel} expandLabel={collection.expandFiltersLabel} selectedColors={selectedColors} minRating={minRating} colorOptions={storefront.facets.colors} ratingLabel={collection.ratingLabel} colorsLabel={collection.colorsFilterLabel} onSearch={updateSearch} onCategory={updateCategory} onSort={(value) => { setLoading(true); setSort(value) }} onRating={(value) => { setLoading(true); setMinRating((current) => current === value ? 0 : value) }} onColorToggle={toggleColor} onClear={() => { setLoading(true); setSearch(''); setCategory(''); setSort('newest'); setSelectedColors([]); setMinRating(0) }} /><div className="catalog-results"><VirtualizedProductGrid products={catalog} currency={currency} addToBagLabel={collection.addToBagLabel} ratingLabel={collection.ratingLabel} reviewsLabel={collection.reviewsLabel} onAdd={onAdd} onOpenProduct={onOpenProduct} /></div></div>
      {!loading && catalog.length === 0 && <p className="empty-state">{collection.noResultsLabel}</p>}
      <div className="catalog-sentinel" ref={sentinel} aria-live="polite">{loading ? collection.loadingMoreLabel : nextCursor ? collection.loadingMoreLabel : ''}</div>
    </section>
  )
}
