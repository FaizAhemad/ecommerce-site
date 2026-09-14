import { useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '../api/cart'
import { getProfile } from '../api/profile'
import { privateKey } from '../api/sessionScope'
import type { StorefrontApiResponse } from '../api/storefront'
import { CheckoutSubmit } from '../components/CheckoutSubmit'

type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
export function PaymentPage({ storefront, onNavigate }: Props) {
  const cart = useCart()
  const profile = useQuery({
    queryKey: privateKey('profile'),
    queryFn: ({ signal }) => getProfile(signal),
  })
  const [selected, setSelected] = useState('')
  const addresses = profile.data?.addresses ?? []
  const selectedId = selected || addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ''
  const items = cart.data ?? []
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.priceMinor, 0)
  const money = (minor: number) =>
    new Intl.NumberFormat(storefront.localization.locale, {
      style: 'currency',
      currency: storefront.localization.currency,
    }).format(minor / 100)
  return (
    <section className="page-section payment-page" aria-labelledby="payment-title">
      <h1 id="payment-title">Checkout</h1>
      {cart.isPending || profile.isPending ? (
        <p role="status">Loading cart and delivery addresses?</p>
      ) : cart.isError || profile.isError ? (
        <div className="state-message" role="alert">
          <p>Unable to load checkout. Please try again.</p>
          <button
            className="secondary-button"
            disabled={cart.isFetching || profile.isFetching}
            onClick={() => {
              void cart.refetch({ cancelRefetch: false })
              void profile.refetch({ cancelRefetch: false })
            }}
          >
            Retry
          </button>
        </div>
      ) : !items.length ? (
        <p>
          Your cart is empty.{' '}
          <a href="/products" onClick={onNavigate('/products')}>
            Browse products
          </a>
        </p>
      ) : (
        <div className="payment-layout">
          <div>
            <h2>Delivery address</h2>
            {!addresses.length ? (
              <p>Add a delivery address in your profile.</p>
            ) : (
              <fieldset className="payment-form">
                <legend>Choose a saved address</legend>
                {addresses.map((address) => (
                  <label key={address.id} className="payment-option">
                    <input
                      type="radio"
                      name="delivery-address"
                      checked={selectedId === address.id}
                      onChange={() => setSelected(address.id)}
                    />
                    <span>
                      {address.name}: {address.line1}, {address.city}, {address.state}{' '}
                      {address.postalCode}, {address.country}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <a href="/profile" onClick={onNavigate('/profile')}>
              Manage delivery addresses
            </a>
            <CheckoutSubmit
              addressId={selectedId}
              cartRevision={JSON.stringify(
                items.map((item) => [item.id, item.quantity, item.product.priceMinor]),
              )}
              disabled={cart.isUpdating}
            />
            {cart.isUpdating && <p role="status">Updating your cart?</p>}
          </div>
          <aside className="order-summary">
            <h2>Cart summary</h2>
            {items.map((item) => (
              <div className="summary-line" key={item.product.id}>
                <span>
                  {item.product.name} ? {item.quantity}
                </span>
                <strong>{money(item.product.priceMinor * item.quantity)}</strong>
              </div>
            ))}
            <div className="summary-total">
              <span>Items subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <p>Delivery charges and taxes must be confirmed before payment.</p>
            <a href="/cart" onClick={onNavigate('/cart')}>
              Return to cart
            </a>
          </aside>
        </div>
      )}
    </section>
  )
}
