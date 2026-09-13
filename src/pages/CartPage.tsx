import { useNotification } from '../components/NotificationProvider'
import { ApiRateLimitError } from '../api/http'
import { useCart, updateCart, type CartItem } from '../api/cart'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
export function CartPage({ storefront, onNavigate }: Props) {
  const notify = useNotification()
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
  const change = async (item: CartItem, quantity: number) => {
    try {
      await updateCart(item.product, quantity, 'set')
    } catch (error) {
      notify(
        error instanceof ApiRateLimitError
          ? error
          : 'Unable to update your cart. Please try again.',
      )
    }
  }
  const total = items.reduce(
    (sum, item) => sum + (item.product.priceMinor / 100) * item.quantity,
    0,
  )
  return (
    <section className="page-section cart-page" aria-labelledby="cart-title">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">{storefront.content.ui.cartLabel}</p>
          <h1 id="cart-title">{cart.title}</h1>
          <p className="hero-text">Review your selected pieces before checkout.</p>
        </div>
        <span className="cart-count">
          {items.reduce((sum, item) => sum + item.quantity, 0)} items
        </span>
      </div>
      {loading ? (
        <p className="state-message">Loading your cart…</p>
      ) : error ? (
        <div className="state-panel">
          <p>{error}</p>
          <button className="primary-button" type="button" onClick={load}>
            Try again
          </button>
        </div>
      ) : !items.length ? (
        <div className="wishlist-empty">
          <p>{cart.emptyDescription}</p>
          <a className="primary-button" href="/products" onClick={onNavigate('/products')}>
            {cart.continueShoppingLabel}
          </a>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-art product-art tone-sage">
                  <div className="product-shape" />
                </div>
                <div className="cart-item-copy">
                  <p>{item.product.category}</p>
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-detail" role="status">
                    {cartQuery.pending.has(item.product.id) ? 'Saving...' : ''}
                  </p>
                </div>
                <div className="cart-item-controls">
                  <strong>
                    {currency.format((item.product.priceMinor / 100) * item.quantity)}
                  </strong>
                  <div
                    className="quantity-control"
                    aria-label={`Quantity for ${item.product.name}`}
                  >
                    <button
                      type="button"
                      disabled={cartQuery.pending.has(item.product.id)}
                      onClick={() => change(item, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={cartQuery.pending.has(item.product.id)}
                      onClick={() => change(item, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="cart-summary">
            <span>Estimated total</span>
            <strong>{currency.format(total)}</strong>
          </div>
          <div className="cart-actions">
            <a className="secondary-button" href="/products" onClick={onNavigate('/products')}>
              Continue shopping
            </a>
            <a
              className="primary-button"
              href="/checkout"
              aria-disabled={cartQuery.isUpdating}
              onClick={(event) => {
                if (cartQuery.isUpdating) event.preventDefault()
                else onNavigate('/checkout')(event)
              }}
            >
              Proceed to checkout →
            </a>
          </div>
        </>
      )}
    </section>
  )
}
