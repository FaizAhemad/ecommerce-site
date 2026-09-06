import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StorefrontApiResponse } from '../api/storefront'
import { ProductCard } from '../components/ProductCard'

type Props = { storefront: StorefrontApiResponse; onAdd: () => void; onOpenProduct: (id: string) => void }

export function WishlistPage({ storefront, onAdd, onOpenProduct }: Props) {
  const { t } = useTranslation()
  const [ids, setIds] = useState<string[]>(() => JSON.parse(window.localStorage.getItem('wishlist') ?? '[]'))
  useEffect(() => { const sync = () => setIds(JSON.parse(window.localStorage.getItem('wishlist') ?? '[]')); window.addEventListener('wishlistchange', sync); return () => window.removeEventListener('wishlistchange', sync) }, [])
  const products = storefront.products.filter((product) => ids.includes(product.id))
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })
  return <section className="wishlist-page page-section"><div className="section-heading"><div><p className="eyebrow">{t('wishlist:eyebrow')}</p><h1>{t('wishlist:title')}</h1></div><p className="section-note">{products.length} {products.length === 1 ? t('wishlist:savedItem') : t('wishlist:savedItems')}</p></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} currency={currency} addToCartLabel={storefront.content.collection.addToCartLabel} ratingLabel={storefront.content.collection.ratingLabel} reviewsLabel={storefront.content.collection.reviewsLabel} onAdd={onAdd} onOpen={() => onOpenProduct(product.id)} />)}</div> : <div className="wishlist-empty"><h2>{t('wishlist:emptyTitle')}</h2><p>{t('wishlist:emptyDescription')}</p><a className="primary-button" href="/products">{t('wishlist:exploreProducts')}</a></div>}</section>
}
