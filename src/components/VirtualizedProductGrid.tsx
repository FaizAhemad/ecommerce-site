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

export function VirtualizedProductGrid({ products, currency, addToCartLabel = 'Add to cart', ratingLabel, reviewsLabel, onAdd, onOpenProduct, virtualize = true }: VirtualizedProductGridProps) {
  const cartLabel = addToCartLabel
  const [columns, setColumns] = useState(() => window.matchMedia('(max-width: 760px)').matches ? 2 : 4)
  const [scrollY, setScrollY] = useState(() => window.scrollY)
  const [containerTop, setContainerTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  // Start with a safe estimate, then measure a rendered card below.
  const [rowHeight, setRowHeight] = useState(() => columns === 2 ? 500 : 500)
  const rows = Math.ceil(products.length / columns)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const onMediaChange = () => setColumns(media.matches ? 2 : 4)
    const onScroll = () => { setScrollY(window.scrollY); if (containerRef.current) setContainerTop(containerRef.current.getBoundingClientRect().top + window.scrollY) }
    media.addEventListener('change', onMediaChange)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { media.removeEventListener('change', onMediaChange); window.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(() => {
    setRowHeight(columns === 2 ? 500 : 500)
  }, [columns])

  useEffect(() => {
    const firstCard = containerRef.current?.querySelector<HTMLElement>('.product-card')
    if (!firstCard || typeof ResizeObserver === 'undefined') return
    const measure = () => setRowHeight(Math.max(460, Math.ceil(firstCard.getBoundingClientRect().height + 32)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(firstCard)
    return () => observer.disconnect()
  }, [products, columns])

  const relativeScroll = Math.max(0, scrollY - containerTop)
  const firstRow = Math.max(0, Math.floor(relativeScroll / rowHeight) - overscanRows)
  const visibleRows = Math.min(rows, firstRow + Math.ceil((window.innerHeight + 1000) / rowHeight) + overscanRows)
  const visibleProducts = useMemo(() => products.slice(firstRow * columns, visibleRows * columns), [products, firstRow, visibleRows, columns])

  if (!virtualize) return <div className="product-grid product-grid-static">{products.map((product) => <ProductCard key={product.id} product={product} currency={currency} addToCartLabel={cartLabel} ratingLabel={ratingLabel} reviewsLabel={reviewsLabel} onAdd={onAdd} onOpen={() => onOpenProduct(product.id)} />)}</div>
  return <div className="virtualized-grid" ref={containerRef} style={{ height: rows * rowHeight }}><div className="product-grid" style={{ transform: `translateY(${firstRow * rowHeight}px)` }}>{visibleProducts.map((product) => <ProductCard key={product.id} product={product} currency={currency} addToCartLabel={cartLabel} ratingLabel={ratingLabel} reviewsLabel={reviewsLabel} onAdd={onAdd} onOpen={() => onOpenProduct(product.id)} />)}</div></div>
}
