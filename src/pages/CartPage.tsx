import { useState, type MouseEvent } from 'react'
import { ArrowRight, Image as ImageIcon, ShoppingBag } from 'lucide-react'
import { useCart, updateCart } from '../api/cart'
import { AddToCartButton } from '../components/AddToCartButton'
import { ImagePreviewDialog } from '../components/ImagePreviewDialog'
import { productPrimaryActionClass } from '../components/productCardStyles'
import type { StorefrontApiResponse } from '../api/storefront'
type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
export function CartPage({ storefront, onNavigate }: Props) {
  const { cart } = storefront.content
  const cartQuery = useCart()
  const items = cartQuery.data ?? []
  const loading = cartQuery.isLoading
  const error = cartQuery.isError ? 'Unable to load your cart.' : ''
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  const load = () => {
    void cartQuery.refetch()
  }
  const total = items.reduce(
    (sum, item) => sum + (item.product.priceMinor / 100) * item.quantity,
    0,
  )
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <section className="pb-12 pt-5 sm:pb-16 sm:pt-7" aria-labelledby="cart-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4 sm:mb-6 sm:pb-5">
        <div>
          <p className="eyebrow">{storefront.content.ui.cartLabel}</p>
          <h1 id="cart-title" className="!mb-2 text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{cart.title}</h1>
          <p className="hero-text !mb-0">Review your selected pieces before checkout.</p>
        </div>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--muted)]">
          <ShoppingBag aria-hidden="true" className="size-4" />
          {items.reduce((sum, item) => sum + item.quantity, 0)} items
        </span>
      </div>
      {loading ? (
        <p className="state-message" role="status">Loading your cart…</p>
      ) : error ? (
        <div className="mx-auto grid min-h-64 max-w-2xl place-content-center justify-items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <p>{error}</p>
          <button className="primary-button" type="button" onClick={load} disabled={cartQuery.isFetching}>
            Try again
          </button>
        </div>
      ) : !items.length ? (
        <div className="mx-auto grid min-h-[360px] max-w-3xl place-content-center justify-items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[rgba(215,225,208,0.5)] text-[var(--ink)]"><ShoppingBag aria-hidden="true" className="size-6" /></span>
          <p className="mb-0 max-w-md text-[var(--muted)]">{cart.emptyDescription}</p>
          <a className="primary-button" href="/products" onClick={onNavigate('/products')}>
            {cart.continueShoppingLabel}
          </a>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] py-4 text-sm">
              <h2 className="!mb-0 !text-base !font-semibold !leading-snug !tracking-normal text-[var(--ink)]">Your items</h2>
              <span className="text-[var(--muted)]">{items.length} {items.length === 1 ? 'product' : 'products'}</span>
            </div>
            <div>
              {items.map((item) => (
                <article className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-[var(--line)] py-4 last:border-b-0 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-5 sm:py-5" key={item.id}>
                  <CartProductImage
                    key={item.product.images?.[0]?.id ?? item.product.id}
                    product={item.product}
                  />
                  <div className="min-w-0 self-center">
                    <p className="mb-1 text-xs text-[var(--muted)]">{item.product.category}</p>
                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--ink)] sm:text-base">{item.product.name}</h3>
                    <p className="m-0 text-sm font-semibold tabular-nums text-[var(--ink)] sm:hidden">
                      {currency.format((item.product.priceMinor / 100) * item.quantity)}
                    </p>
                    <p className="m-0 min-h-4 text-xs text-[var(--muted)]" role="status">
                      {cartQuery.pending.has(item.product.id) ? 'Saving your change…' : ''}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
                    <strong className="hidden text-sm font-semibold tabular-nums text-[var(--ink)] sm:block">
                      {currency.format((item.product.priceMinor / 100) * item.quantity)}
                    </strong>
                    <AddToCartButton
                      productId={item.product.id}
                      onAdd={() => updateCart(item.product, item.quantity + 1, 'set')}
                      onDecrease={() =>
                        updateCart(item.product, Math.max(0, item.quantity - 1), 'set')
                      }
                      label="Add to cart"
                      className={productPrimaryActionClass}
                      quantity={item.quantity}
                      isUpdating={cartQuery.pending.has(item.product.id)}
                      quantityControlClassName="mx-0 my-0 w-[136px] shrink-0"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Order summary">
            <h2 className="!mb-5 !text-lg !font-semibold !leading-tight !tracking-normal text-[var(--ink)]">Order summary</h2>
            <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-4 text-sm text-[var(--muted)]">
              <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
              <span className="tabular-nums text-[var(--ink)]">{currency.format(total)}</span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-base font-semibold text-[var(--ink)]">
              <span>Estimated total</span>
              <strong className="tabular-nums">{currency.format(total)}</strong>
            </div>
            <p className="mb-5 text-xs leading-5 text-[var(--muted)]">Final charges and available payment options are shown during checkout.</p>
            <a
              className="primary-button flex w-full items-center justify-center gap-2"
              href="/checkout"
              aria-disabled={cartQuery.isUpdating}
              onClick={(event) => {
                if (cartQuery.isUpdating) event.preventDefault()
                else onNavigate('/checkout')(event)
              }}
            >
              Proceed to checkout <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] px-3 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]" href="/products" onClick={onNavigate('/products')}>
              Continue shopping
            </a>
            {cartQuery.isUpdating && <p className="mb-0 mt-3 text-center text-xs text-[var(--muted)]" role="status">Saving cart changes…</p>}
          </aside>
        </div>
      )}
      </section>
    </div>
  )
}

function CartProductImage({
  product,
}: {
  product: {
    id: string
    name: string
    images?: { id: string; url: string; alt: string | null; sortOrder: number }[]
  }
}) {
  const image = product.images?.[0]
  const imageUrl = image?.url.trim()
  const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!safeImageUrl || failedUrl === safeImageUrl)
    return (
      <div
        className="grid size-[76px] place-items-center rounded-[var(--radius-card)] bg-[rgba(215,225,208,0.35)] text-center text-[var(--muted)] sm:size-[88px]"
        role="img"
        aria-label={`No product image available for ${product.name}`}
      >
        <div className="grid justify-items-center gap-1 text-xs">
          <ImageIcon aria-hidden="true" className="size-6" />
          <span>Image unavailable</span>
        </div>
      </div>
    )

  const alt = image?.alt?.trim() || product.name
  return (
    <>
      <button
        type="button"
        className="group block size-[76px] cursor-zoom-in overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-wait sm:size-[88px]"
        disabled={loadedUrl !== safeImageUrl}
        aria-label={`View larger image of ${product.name}`}
        onClick={() => setPreviewOpen(true)}
      >
        <img
          className="h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-[1.03]"
          src={safeImageUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoadedUrl(safeImageUrl)}
          onError={() => setFailedUrl(safeImageUrl)}
        />
      </button>
      {previewOpen && (
        <ImagePreviewDialog src={safeImageUrl} alt={alt} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  )
}
