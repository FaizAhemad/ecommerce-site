import { readWishlist } from '../api/wishlistState'
import { toggleWishlistItem, wishlistPending } from '../api/wishlistState'
import { useNotification } from './NotificationProvider'
import { AddToCartButton } from './AddToCartButton'
import { RatingStars } from './RatingStars'
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

export function ProductCard({
  product,
  currency,
  addToCartLabel,
  ratingLabel,
  reviewsLabel,
  onAdd,
  onOpen,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(() => readWishlist().includes(product.id))
  const [actionLocked, setActionLocked] = useState(() => wishlistPending(product.id))
  useEffect(() => {
    const sync = () => {
      setWishlisted(readWishlist().includes(product.id))
      setActionLocked(wishlistPending(product.id))
    }
    window.addEventListener('wishlistchange', sync)
    return () => window.removeEventListener('wishlistchange', sync)
  }, [product.id])
  const notify = useNotification()
  const toggleWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try {
      await toggleWishlistItem(product.id)
    } catch (error) {
      notify(error instanceof Error ? error : 'Unable to update your wishlist.')
    }
  }

  const primaryImage = product.media.images.find((image) => image.isPrimary)
  return (
    <article
      className="product-card"
      tabIndex={0}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('.product-primary-image, .product-card-title')) onOpen()
      }}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className={`product-art ${product.tone}`}>
        <span>{product.badge}</span>

        {primaryImage ? (
          <img className="product-primary-image" src={primaryImage.url} alt={primaryImage.alt} />
        ) : (
          <div className="product-shape" />
        )}
      </div>
      <div className="product-info">
        <div>
          <p className="product-category">{product.category}</p>
          <div className="product-title-row">
            <h3 className="product-card-title" title={product.name}>
              {product.name}
            </h3>
            <button
              className={`wishlist-button${wishlisted ? ' is-wishlisted' : ''}`}
              type="button"
              disabled={actionLocked}
              aria-busy={actionLocked}
              onClick={toggleWishlist}
              aria-label={
                actionLocked
                  ? 'Updating wishlist'
                  : wishlisted
                    ? 'Remove from wishlist'
                    : 'Add to wishlist'
              }
              aria-pressed={wishlisted}
            >
              {wishlisted ? '♥' : '♡'}
            </button>
          </div>
          <p
            className={`product-seller${!product.seller || product.seller.isPlatform ? ' product-seller--empty' : ''}`}
            aria-hidden={!product.seller || product.seller.isPlatform}
          >
            {product.seller && !product.seller.isPlatform ? `Sold by ${product.seller.name}` : ''}
          </p>
        </div>
        <div className="product-card-actions">
          <div className="product-price-group">
            <strong className="product-price">{currency.format(product.price)}</strong>
            {product.compareAtPriceMinor != null &&
              product.priceMinor != null &&
              product.compareAtPriceMinor > product.priceMinor && (
                <div className="product-sale-details">
                  <del>{currency.format(product.compareAtPriceMinor / 100)}</del>
                  <span>
                    {Math.round(
                      ((product.compareAtPriceMinor - product.priceMinor) /
                        product.compareAtPriceMinor) *
                        100,
                    )}% off
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
      <div
        className="product-rating"
        aria-label={`${ratingLabel}: ${product.rating}, ${product.reviewCount} ${reviewsLabel}`}
      >
        <RatingStars rating={product.rating} />
        <b>{product.rating.toFixed(1)}</b>
        <em>
          ({product.reviewCount} {reviewsLabel})
        </em>
      </div>
      <div
        className="product-swatches"
        aria-label={
          product.colors?.length ? `Available colors: ${product.colors.join(', ')}` : undefined
        }
        aria-hidden={!product.colors?.length}
      >
        {product.colors?.map((color) => (
          <span
            className={`color-swatch color-${color.toLowerCase()}`}
            style={{ backgroundColor: product.colorValues?.[color] ?? color.toLowerCase() }}
            key={color}
            title={color}
            aria-label={color}
          />
        ))}
      </div>
      <AddToCartButton
        unavailableReason={product.purchase?.available === false ? product.purchase.reason ?? 'Currently unavailable' : undefined}
        productId={product.id}
        onAdd={onAdd}
        label={addToCartLabel}
        className="add-button"
      />
    </article>
  )
}
