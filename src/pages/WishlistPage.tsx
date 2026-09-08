import { wishlistVersion, replaceWishlist } from '../api/wishlistState'
import { apiFetch as fetch } from '../api/http'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { StorefrontApiResponse } from '../api/storefront'
import { ProductCard } from '../components/ProductCard'
import { queryClient } from '../api/queryClient'

type Props = { storefront: StorefrontApiResponse; onAdd: (productId: string) => Promise<void>; onOpenProduct: (id: string) => void }

export function WishlistPage({ storefront, onAdd, onOpenProduct }: Props) {
  const { t } = useTranslation()
  const [ids, setIds] = useState<string[]>(() => JSON.parse(window.localStorage.getItem('wishlist') ?? '[]'))
  const wishlistQuery = useQuery({ queryKey: ['wishlist'], queryFn: async () => { const response = await fetch('/api/wishlist'); if (!response.ok) return []; const body = await response.json(); return (body?.wishlist?.items ?? []).map((item: { productId: string }) => item.productId as string) }, staleTime: 0 })
  useEffect(() => { const sync = () => { const next = JSON.parse(window.localStorage.getItem('wishlist') ?? '[]'); setIds(next); queryClient.setQueryData(['wishlist'], next) }; window.addEventListener('wishlistchange', sync); const version = wishlistVersion(); if (wishlistQuery.data?.length) replaceWishlist(wishlistQuery.data, version); return () => window.removeEventListener('wishlistchange', sync) }, [wishlistQuery.data])
  const products = storefront.products.filter((product) => ids.includes(product.id))
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })
  return <section className="wishlist-page page-section"><div className="section-heading"><div><p className="eyebrow">{t('wishlist:eyebrow')}</p><h1>{t('wishlist:title')}</h1></div><p className="section-note">{products.length} {products.length === 1 ? t('wishlist:savedItem') : t('wishlist:savedItems')}</p></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} currency={currency} addToCartLabel={storefront.content.collection.addToCartLabel} ratingLabel={storefront.content.collection.ratingLabel} reviewsLabel={storefront.content.collection.reviewsLabel} onAdd={onAdd} onOpen={() => onOpenProduct(product.id)} />)}</div> : <div className="wishlist-empty"><h2>{t('wishlist:emptyTitle')}</h2><p>{t('wishlist:emptyDescription')}</p><a className="primary-button" href="/products">{t('wishlist:exploreProducts')}</a></div>}</section>
}
