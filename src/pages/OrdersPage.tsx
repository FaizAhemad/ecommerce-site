import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type Props = { storefront: StorefrontApiResponse; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }

export function OrdersPage({ storefront, onNavigate }: Props) {
  return <section className="page-section orders-page" aria-labelledby="orders-title"><div className="orders-heading"><div><p className="eyebrow">ACCOUNT</p><h1 id="orders-title">Your orders</h1><p className="hero-text">Your completed purchases and delivery updates will appear here.</p></div><span className="orders-count">0 orders</span></div><div className="wishlist-empty"><p>No orders yet.</p><a className="primary-button" href="/products" onClick={onNavigate('/products')}>{storefront.content.cart.continueShoppingLabel} <span aria-hidden="true">→</span></a></div><div className="orders-help"><p className="eyebrow">NEED HELP?</p><p>Questions about an order or delivery?</p><a href="/support" onClick={onNavigate('/support')}>Contact customer care →</a></div></section>
}
