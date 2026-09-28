import { readWishlist, toggleWishlistItem, wishlistPending } from '../api/wishlistState'
import type { StorefrontApiResponse } from '../api/storefront'
import { Heart } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { cn } from '../lib/utils'
import { AddToCartButton } from './AddToCartButton'
import { RatingStars } from './RatingStars'
import { useNotification } from './NotificationProvider'
import { updateCart } from '../api/cart'
import {
  productAddButtonClass,
  productAddButtonLayoutClass,
  productCardClass,
  productInfoClass,
  productMediaClass,
  productRatingClass,
  productSwatchesClass,
  productTitleClass,
  productTitleRowClass,
  productWishlistClass,
} from './productCardStyles'

type ProductCardProps = {
  product: StorefrontApiResponse['products'][number]
  currency: Intl.NumberFormat
  addToCartLabel: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: (productId: string) => Promise<void>
  onOpen: () => void
  quantity?: number
  isCartLoading?: boolean
  isCartUpdating?: boolean
  cartPendingAction?: 'adding' | 'removing' | 'updating'
}

export function ProductCard({
  product,
  currency,
  addToCartLabel,
  ratingLabel,
  reviewsLabel,
  onAdd,
  onOpen,
  quantity = 0,
  isCartLoading = false,
  isCartUpdating = false,
  cartPendingAction,
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
  const displayColors = product.colors?.filter(
    (color) => color.trim() && color.trim().toLowerCase() !== 'default',
  ) ?? []
  const decreaseQuantity = () =>
    updateCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        priceMinor: product.priceMinor ?? Math.round(product.price * 100),
      },
      Math.max(0, quantity - 1),
      'set',
    )

  return (
    <article
      className={productCardClass}
      tabIndex={0}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('.catalog-product-image, .catalog-product-title')) onOpen()
      }}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className={productMediaClass}>
        <span className="absolute left-3.5 top-3.5 z-10 text-[9px] uppercase tracking-[0.08em] text-[#324239]">
          {product.badge}
        </span>
        {primaryImage ? (
          <img
            className="catalog-product-image block size-full cursor-pointer object-cover"
            src={primaryImage.url}
            alt={primaryImage.alt}
          />
        ) : (
          <div className="absolute left-1/2 top-1/2 h-[52%] w-[42%] -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] rounded-[48%_48%_18%_18%] bg-[#ebeee4] shadow-[23px_18px_0_rgba(36,92,75,0.26)]" />
        )}
      </div>

      <div className={productInfoClass}>
        <div className="flex min-w-0 flex-col">
          <p className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[10px] font-semibold uppercase leading-[1.3] tracking-[0.1em] text-[var(--muted)]">
            {product.category}
          </p>
          <div className={productTitleRowClass}>
            <h3 className={cn('catalog-product-title m-0 cursor-pointer', productTitleClass)} title={product.name}>
              {product.name}
            </h3>
            <button
              className={cn(
                productWishlistClass,
                wishlisted && 'border-[#d52f45]/30 bg-[#d52f45]/5 text-[#d52f45]',
              )}
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
              <Heart
                aria-hidden="true"
                className={cn('size-4', wishlisted && 'fill-current')}
              />
            </button>
          </div>
          {product.seller && !product.seller.isPlatform && (
            <p className="mt-1.5 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[11px] leading-[1.4] text-[var(--muted)]">
              Sold by {product.seller.name}
            </p>
          )}
        </div>

        <div className="flex min-h-11 w-full items-center gap-2">
          <div className="grid min-h-[42px] min-w-0 flex-1 content-center gap-1">
            <strong className="max-w-full break-words text-left font-sans text-[clamp(18px,1.35vw,21px)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--ink)]">
              {currency.format(product.price)}
            </strong>
            {product.compareAtPriceMinor != null &&
              product.priceMinor != null &&
              product.compareAtPriceMinor > product.priceMinor && (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-sans text-[11px] leading-tight">
                  <del className="text-[var(--muted)] decoration-[var(--muted)]">
                    {currency.format(product.compareAtPriceMinor / 100)}
                  </del>
                  <span className="rounded-full bg-[#e9efdf] px-1.5 py-1 text-[10px] font-bold text-[#36563c]">
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
        className={productRatingClass}
        aria-label={
          product.reviewCount > 0
            ? `${ratingLabel}: ${product.rating}, ${product.reviewCount} ${reviewsLabel}`
            : 'No reviews yet'
        }
      >
        {product.reviewCount > 0 ? (
          <>
            <RatingStars rating={product.rating} />
            <b className="shrink-0 font-semibold">{product.rating.toFixed(1)}</b>
            <em className="not-italic text-[var(--muted)]">
              ({product.reviewCount} {reviewsLabel})
            </em>
          </>
        ) : (
          <span className="text-[var(--muted)]">No reviews yet</span>
        )}
      </div>

      {displayColors.length > 0 && (
        <div className={productSwatchesClass} aria-label={`Available colors: ${displayColors.join(', ')}`}>
          {displayColors.map((color) => (
            <span
              className="size-[18px] shrink-0 rounded-full border border-[rgba(37,40,33,0.2)]"
              style={{ backgroundColor: product.colorValues?.[color] ?? color.toLowerCase() }}
              key={color}
              title={color}
              aria-label={color}
            />
          ))}
        </div>
      )}

      <AddToCartButton
        unavailableReason={
          product.purchase?.available === false
            ? product.purchase.reason ?? 'Currently unavailable'
            : undefined
        }
        productId={product.id}
        onAdd={onAdd}
        label={addToCartLabel}
        className={productAddButtonClass}
        iconClassName="ml-auto text-lg leading-none"
        quantity={quantity}
        isCartLoading={isCartLoading}
        isUpdating={isCartUpdating}
        pendingAction={cartPendingAction}
        onDecrease={decreaseQuantity}
        quantityControlClassName={productAddButtonLayoutClass}
      />
    </article>
  )
}
