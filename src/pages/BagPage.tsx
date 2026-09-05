import type { StorefrontApiResponse } from '../api/storefront'
import { ArrowIcon } from '../components/ArrowIcon'
import type { MouseEvent } from 'react'

type BagPageProps = { storefront: StorefrontApiResponse; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }

export function BagPage({ storefront, onNavigate }: BagPageProps) {
  const { bag } = storefront.content
  return <section className="page-section bag-page" aria-labelledby="bag-title"><p className="eyebrow">{storefront.content.ui.bagLabel}</p><h1 id="bag-title">{bag.title}</h1><p className="hero-text">{bag.emptyDescription}</p><a className="primary-button" href="/shop" onClick={onNavigate('/shop')}>{bag.continueShoppingLabel} <ArrowIcon direction="right" /></a></section>
}
