import { useState, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type ProductCardProps = {
  product: StorefrontApiResponse['products'][number]
  currency: Intl.NumberFormat
  addToCartLabel: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: () => void
  onOpen: () => void
}

export function ProductCard({ product, currency, addToCartLabel, ratingLabel, reviewsLabel, onAdd, onOpen }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(() => JSON.parse(window.localStorage.getItem('wishlist') ?? '[]').includes(product.id))
  const toggleWishlist = (event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); const current: string[] = JSON.parse(window.localStorage.getItem('wishlist') ?? '[]'); const next = wishlisted ? current.filter((id) => id !== product.id) : [...new Set([...current, product.id])]; window.localStorage.setItem('wishlist', JSON.stringify(next)); setWishlisted(!wishlisted); window.dispatchEvent(new Event('wishlistchange')) }
  const primaryImage = product.media.images.find((image) => image.isPrimary)
  return (
    <article className="product-card" role="link" tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }}>
      <div className={`product-art ${product.tone}`}>
        <span>{product.badge}</span>
        <button className={`wishlist-button${wishlisted ? ' is-wishlisted' : ''}`} type="button" onClick={toggleWishlist} aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted}>♥</button>
        {primaryImage ? <img className="product-primary-image" src={primaryImage.url} alt={primaryImage.alt} /> : <div className="product-shape" />}
      </div>
      <div className="product-info">
        <div>
          <p className="product-category">{product.category}</p>
          <h3>{product.name}</h3>
        </div>
        <strong>{currency.format(product.price)}</strong>
      </div>
      <div className="product-rating" aria-label={`${ratingLabel}: ${product.rating}, ${product.reviewCount} ${reviewsLabel}`}><span aria-hidden="true">★★★★★</span><b>{product.rating.toFixed(1)}</b><em>({product.reviewCount} {reviewsLabel})</em></div>
      {product.colors && <div className="product-swatches" aria-label={`Available colors: ${product.colors.join(', ')}`}>{product.colors.map((color) => <span className={`color-swatch color-${color.toLowerCase()}`} key={color} title={color} />)}</div>}
      <button className="add-button" type="button" onClick={(event) => { event.stopPropagation(); onAdd() }}>
        {addToCartLabel} <span aria-hidden="true">+</span>
      </button>
    </article>
  )
}
