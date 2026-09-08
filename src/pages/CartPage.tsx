import { useNotification } from '../components/NotificationProvider'
import { apiFetch as fetch } from '../api/http'
import { useQuery } from '@tanstack/react-query'
import { useState, type MouseEvent } from 'react'
import { queryClient } from '../api/queryClient'
import type { StorefrontApiResponse } from '../api/storefront'
type Props = { storefront: StorefrontApiResponse; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }
type CartItem = { id: string; quantity: number; product: { id: string; name: string; category: string; priceMinor: number; colors?: { name: string }[] } }
export function CartPage({ storefront, onNavigate }: Props) {
  const notify = useNotification()
  const [updating, setUpdating] = useState(false)
  const { cart } = storefront.content; const cartQuery = useQuery({ queryKey: ['cart'], queryFn: async () => { const response = await fetch('/api/cart'); if (!response.ok) throw new Error('cart'); const body = await response.json() as { cart?: { items?: CartItem[] } }; return body.cart?.items ?? [] }, staleTime: 0 }); const items = cartQuery.data ?? []; const loading = cartQuery.isLoading; const error = cartQuery.isError ? 'Unable to load your cart.' : ''
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })
  const load = () => { void cartQuery.refetch() }
  const change = async (item: CartItem, quantity: number) => {
    if (updating) return
    setUpdating(true)
    try {
      const response = await fetch('/api/cart', { method: quantity < 1 ? 'DELETE' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: item.product.id, quantity }) })
      if (!response.ok) throw new Error('cart')
      const body = await response.json() as { cart: { items: CartItem[] } }
      queryClient.setQueryData(['cart'], body.cart.items)
      window.dispatchEvent(new Event('cartchange'))
    } catch { notify('Unable to update your cart. Please try again.') } finally { setUpdating(false) }
  }
  const total = items.reduce((sum, item) => sum + (item.product.priceMinor / 100) * item.quantity, 0)
  return <section className="page-section cart-page" aria-labelledby="cart-title"><div className="cart-heading"><div><p className="eyebrow">{storefront.content.ui.cartLabel}</p><h1 id="cart-title">{cart.title}</h1><p className="hero-text">Review your selected pieces before checkout.</p></div><span className="cart-count">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>{loading ? <p className="state-message">Loading your cart…</p> : error ? <div className="state-panel"><p>{error}</p><button className="primary-button" type="button" onClick={load}>Try again</button></div> : !items.length ? <div className="wishlist-empty"><p>{cart.emptyDescription}</p><a className="primary-button" href="/products" onClick={onNavigate('/products')}>{cart.continueShoppingLabel}</a></div> : <><div className="cart-list">{items.map(item => <article className="cart-item" key={item.id}><div className="cart-item-art product-art tone-sage"><div className="product-shape" /></div><div className="cart-item-copy"><p>{item.product.category}</p><h3>{item.product.name}</h3><p className="cart-item-detail">Ready to ship · Free returns</p></div><div className="cart-item-controls"><strong>{currency.format((item.product.priceMinor / 100) * item.quantity)}</strong><div className="quantity-control" aria-label={`Quantity for ${item.product.name}`}><button type="button" disabled={updating} onClick={() => change(item, item.quantity - 1)} aria-label="Decrease quantity">−</button><span aria-live="polite">{item.quantity}</span><button type="button" disabled={updating} onClick={() => change(item, item.quantity + 1)} aria-label="Increase quantity">+</button></div></div></article>)}</div><div className="cart-summary"><span>Estimated total</span><strong>{currency.format(total)}</strong></div><div className="cart-actions"><a className="secondary-button" href="/products" onClick={onNavigate('/products')}>Continue shopping</a><a className="primary-button" href="/checkout" onClick={onNavigate('/checkout')}>Proceed to checkout →</a></div></>}</section>
}
