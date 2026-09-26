import { useEffect, useMemo, useRef, useState } from 'react'
import type { StorefrontProduct } from '../api/storefront'
import { ProductCard } from './ProductCard'

type VirtualizedProductGridProps = {
  [key: string]: unknown
  products: readonly StorefrontProduct[]
  currency: Intl.NumberFormat
  addToCartLabel?: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: (productId: string) => Promise<void>
  onOpenProduct: (id: string) => void
  virtualize?: boolean
}

const overscanRows = 2
const getColumnCount = (container?: HTMLElement | null) => {
  if (window.matchMedia('(max-width: 760px)').matches) return 2

  const width = container?.clientWidth ?? window.innerWidth
  const grid = container?.querySelector<HTMLElement>('.product-grid')
  const styles = grid ? window.getComputedStyle(grid) : null
  const minimum = Number.parseFloat(styles?.getPropertyValue('--product-card-min-width') ?? '') || 230
  const gap = Number.parseFloat(styles?.columnGap ?? '') || 20
  return Math.max(1, Math.floor((width + gap) / (minimum + gap)))
}

export function VirtualizedProductGrid({
  products,
  currency,
  addToCartLabel = 'Add to cart',
  ratingLabel,
  reviewsLabel,
  onAdd,
  onOpenProduct,
  virtualize = true,
}: VirtualizedProductGridProps) {
  const cartLabel = addToCartLabel
  const [columns, setColumns] = useState(() => getColumnCount())
  const [scrollY, setScrollY] = useState(() => window.scrollY)
  const [containerTop, setContainerTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  // Start with a safe estimate, then measure a rendered card below.
  const [rowHeight, setRowHeight] = useState(520)
  const rows = Math.ceil(products.length / columns)

  useEffect(() => {
    const updateColumns = () => setColumns(getColumnCount(containerRef.current))
    const onScroll = () => {
      setScrollY(window.scrollY)
      if (containerRef.current)
        setContainerTop(containerRef.current.getBoundingClientRect().top + window.scrollY)
    }
    const mobileMedia = window.matchMedia('(max-width: 760px)')
    mobileMedia.addEventListener('change', updateColumns)
    window.addEventListener('resize', updateColumns)
    window.addEventListener('scroll', onScroll, { passive: true })
    const resizeObserver = typeof ResizeObserver === 'undefined' || !containerRef.current
      ? null
      : new ResizeObserver(updateColumns)
    if (containerRef.current) resizeObserver?.observe(containerRef.current)
    updateColumns()
    onScroll()
    return () => {
      mobileMedia.removeEventListener('change', updateColumns)
      window.removeEventListener('resize', updateColumns)
      window.removeEventListener('scroll', onScroll)
      resizeObserver?.disconnect()
    }
  }, [virtualize])

  useEffect(() => {
    setRowHeight(520)
  }, [columns])

  useEffect(() => {
    const firstCard = containerRef.current?.querySelector<HTMLElement>('.product-card')
    if (!firstCard || typeof ResizeObserver === 'undefined') return
    const measure = () => setRowHeight(Math.ceil(firstCard.getBoundingClientRect().height + 32))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(firstCard)
    return () => observer.disconnect()
  }, [products, columns])

  const relativeScroll = Math.max(0, scrollY - containerTop)
  const firstRow = Math.max(0, Math.floor(relativeScroll / rowHeight) - overscanRows)
  const visibleRows = Math.min(
    rows,
    firstRow + Math.ceil((window.innerHeight + 1000) / rowHeight) + overscanRows,
  )
  const visibleProducts = useMemo(
    () => products.slice(firstRow * columns, visibleRows * columns),
    [products, firstRow, visibleRows, columns],
  )

  if (!virtualize)
    return (
      <div className="product-grid product-grid-static">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            addToCartLabel={cartLabel}
            ratingLabel={ratingLabel}
            reviewsLabel={reviewsLabel}
            onAdd={onAdd}
            onOpen={() => onOpenProduct(product.id)}
          />
        ))}
      </div>
    )
  return (
    <div className="virtualized-grid" ref={containerRef} style={{ height: rows * rowHeight }}>
      <div className="product-grid" style={{ transform: `translateY(${firstRow * rowHeight}px)` }}>
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            addToCartLabel={cartLabel}
            ratingLabel={ratingLabel}
            reviewsLabel={reviewsLabel}
            onAdd={onAdd}
            onOpen={() => onOpenProduct(product.id)}
          />
        ))}
      </div>
    </div>
  )
}
