import { useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '../api/cart'
import { getProfile, type Address } from '../api/profile'
import { privateKey } from '../api/sessionScope'
import type { StorefrontApiResponse } from '../api/storefront'
import { CheckoutSubmit } from '../components/CheckoutSubmit'
import './PaymentPage.css'

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
  const [snapshot, setSnapshot] = useState<{ items: NonNullable<typeof cart.data>; addresses: Address[]; addressId: string } | null>(null)
  const attempted = snapshot !== null
  const addresses = snapshot?.addresses ?? profile.data?.addresses ?? []
  const selectedId = snapshot?.addressId || addresses.find(a => a.id === selected && a.country === 'IN')?.id || addresses.find(a => a.isDefault && a.country === 'IN')?.id || addresses.find(a => a.country === 'IN')?.id || ''
  const items = snapshot?.items ?? cart.data ?? []
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.priceMinor, 0)
  const money = (minor: number) =>
    new Intl.NumberFormat(storefront.localization.locale, {
      style: 'currency',
      currency: 'INR',
    }).format(minor / 100)
  return (
    <section className="page-section checkout-page" aria-labelledby="payment-title">
      <h1 id="payment-title">Checkout</h1>
      {!attempted && (cart.isPending || profile.isPending) ? (
        <p role="status">Loading cart and delivery addresses...</p>
      ) : !attempted && (cart.isError || profile.isError) ? (
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
        <div className="checkout-layout">
          <div>
            <h2>Delivery address</h2>
            {!addresses.length ? (
              <p>Add a delivery address in your profile.</p>
            ) : (
              <fieldset className="checkout-addresses" disabled={attempted}>
                <legend>Choose a saved address</legend>
                {addresses.map((address) => (
                  <label key={address.id} className={`checkout-address ${selectedId === address.id ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="delivery-address"
                      disabled={address.country !== 'IN'}
                      checked={selectedId === address.id}
                      onChange={() => setSelected(address.id)}
                    />
                    <span>
                      {address.name}: {address.line1}, {address.line2 && `${address.line2}, `} {address.city}, {address.state}{' '}
                      {address.postalCode}, {address.country}{address.phone && ` - ${address.phone}`}
                      {address.country !== 'IN' && ' - Delivery is currently available in India only.'}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {!attempted && <a href="/profile" onClick={onNavigate('/profile')}>
              Manage delivery addresses
            </a>}
            <CheckoutSubmit
              addressId={selectedId}
              cartRevision={JSON.stringify(
                items.map((item) => [item.id, item.quantity, item.product.priceMinor]),
              )}
              disabled={cart.isUpdating || cart.isFetching || profile.isFetching}
              onAttempt={() => setSnapshot({ items, addresses, addressId: selectedId })}
            />
            {cart.isUpdating && <p role="status">Updating your cart...</p>}
          </div>
          <aside className="order-summary">
            <h2>Cart summary</h2>
            {items.map((item) => (
              <div className="summary-line" key={item.product.id}>
                <span>
                  {item.product.name} - Qty {item.quantity}
                </span>
                <strong>{money(item.product.priceMinor * item.quantity)}</strong>
              </div>
            ))}
            <div className="summary-total">
              <span>Items subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <p>Final delivery, tax and discounts are shown in the confirmed order total. Payment follows order creation.</p>
            {!attempted && <a href="/cart" onClick={onNavigate('/cart')}>
              Return to cart
            </a>}
          </aside>
        </div>
      )}
    </section>
  )
}
