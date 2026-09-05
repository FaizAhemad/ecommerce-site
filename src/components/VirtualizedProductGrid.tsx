import { useEffect, useMemo, useState } from 'react'
import type { StorefrontProduct } from '../api/storefront'
import { ProductCard } from './ProductCard'

type VirtualizedProductGridProps = {
  products: readonly StorefrontProduct[]
  currency: Intl.NumberFormat
  addToBagLabel: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: () => void
  onOpenProduct: (id: string) => void
}

const overscanRows = 2

export function VirtualizedProductGrid({ products, currency, addToBagLabel, ratingLabel, reviewsLabel, onAdd, onOpenProduct }: VirtualizedProductGridProps) {
  const [columns, setColumns] = useState(() => window.matchMedia('(max-width: 760px)').matches ? 2 : 4)
  const [scrollY, setScrollY] = useState(() => window.scrollY)
  const rowHeight = columns === 2 ? 385 : 385
  const rows = Math.ceil(products.length / columns)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const onMediaChange = () => setColumns(media.matches ? 2 : 4)
    const onScroll = () => setScrollY(window.scrollY)
    media.addEventListener('change', onMediaChange)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { media.removeEventListener('change', onMediaChange); window.removeEventListener('scroll', onScroll) }
  }, [])

  const firstRow = Math.max(0, Math.floor((scrollY - 500) / rowHeight) - overscanRows)
  const visibleRows = Math.min(rows, firstRow + Math.ceil((window.innerHeight + 1000) / rowHeight) + overscanRows)
  const visibleProducts = useMemo(() => products.slice(firstRow * columns, visibleRows * columns), [products, firstRow, visibleRows, columns])

  return <div className="virtualized-grid" style={{ minHeight: rows * rowHeight }}><div className="product-grid" style={{ transform: `translateY(${firstRow * rowHeight}px)` }}>{visibleProducts.map((product) => <ProductCard key={product.id} product={product} currency={currency} addToBagLabel={addToBagLabel} ratingLabel={ratingLabel} reviewsLabel={reviewsLabel} onAdd={onAdd} onOpen={() => onOpenProduct(product.id)} />)}</div></div>
}
