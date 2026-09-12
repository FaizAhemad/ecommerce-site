import { toggleWishlistItem, wishlistPending } from '../api/wishlistState'
import { useNotification } from './NotificationProvider'
import { AddToCartButton } from './AddToCartButton'
import { useEffect, useState, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type ProductCardProps = {
  product: StorefrontApiResponse['products'][number]
  currency: Intl.NumberFormat
  addToCartLabel: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: (productId: string) => Promise<void>
  onOpen: () => void
}

export function ProductCard({ product, currency, addToCartLabel, ratingLabel, reviewsLabel, onAdd, onOpen }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(() => JSON.parse(window.localStorage.getItem('wishlist') ?? '[]').includes(product.id))
  useEffect(() => {
    const sync = () => { setWishlisted(JSON.parse(window.localStorage.getItem('wishlist') ?? '[]').includes(product.id)); setActionLocked(wishlistPending(product.id)) }
    window.addEventListener('wishlistchange', sync)
    return () => window.removeEventListener('wishlistchange', sync)
  }, [product.id])
  const [actionLocked, setActionLocked] = useState(() => wishlistPending(product.id))
  const notify = useNotification()
  const toggleWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try { await toggleWishlistItem(product.id) }
    catch (error) { notify(error instanceof Error ? error : 'Unable to update your wishlist.') }
  }

  const primaryImage = product.media.images.find((image) => image.isPrimary)
  return (
    <article className="product-card" tabIndex={0} onClick={(event) => { const target = event.target as HTMLElement; if (target.closest('.product-primary-image, .product-card-title')) onOpen() }} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen() } }}>
      <div className={`product-art ${product.tone}`}>
        <span>{product.badge}</span>

        {primaryImage ? <img className="product-primary-image" src={primaryImage.url} alt={primaryImage.alt} /> : <div className="product-shape" />}
      </div>
      <div className="product-info">
        <div>
          <p className="product-category">{product.category}</p>
          <h3 className="product-card-title">{product.name}</h3>
        </div>
        <div className="product-card-actions"><strong>{currency.format(product.price)}</strong><button className={`wishlist-button${wishlisted ? ' is-wishlisted' : ''}`} type="button" disabled={actionLocked} aria-busy={actionLocked} onClick={toggleWishlist} aria-label={actionLocked ? 'Updating wishlist' : wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wishlisted}>♥</button></div>
      </div>
      <div className="product-rating" aria-label={`${ratingLabel}: ${product.rating}, ${product.reviewCount} ${reviewsLabel}`}><span aria-hidden="true">★★★★★</span><b>{product.rating.toFixed(1)}</b><em>({product.reviewCount} {reviewsLabel})</em></div>
      {product.colors && <div className="product-swatches" aria-label={`Available colors: ${product.colors.join(', ')}`}>{product.colors.map((color) => <span className={`color-swatch color-${color.toLowerCase()}`} style={{ backgroundColor: product.colorValues?.[color] ?? color.toLowerCase() }} key={color} title={color} />)}</div>}
      <AddToCartButton productId={product.id} onAdd={onAdd} label={addToCartLabel} className="add-button" />
    </article>
  )
}
