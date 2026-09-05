import { useRef } from 'react'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { ArrowIcon } from '../components/ArrowIcon'

type HomePageProps = { storefront: StorefrontApiResponse; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }

export function HomePage({ storefront, onNavigate }: HomePageProps) {
  const { hero } = storefront.content
  const { collection } = storefront.content
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollCarousel = (direction: number) => carouselRef.current?.scrollBy({ left: direction * 270, behavior: 'smooth' })
  return (
    <>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow">{hero.eyebrow}</p><h1 id="hero-title">{hero.title}</h1><p className="hero-text">{storefront.identity.tagline} {hero.description}</p><a className="primary-button" href="/shop" onClick={onNavigate('/shop')}>{hero.actionLabel} <ArrowIcon direction="right" /></a></div>
        <div className="hero-art" aria-label={hero.artworkDescription} role="img"><div className="sun-disc" /><div className="hero-vase" /><div className="hero-cup" /><div className="hero-book" /><span className="art-label">{hero.artworkLabel}</span></div>
      </section>
      <section className="carousel-section" aria-labelledby="featured-title">
        <div className="section-heading"><div><p className="eyebrow">{collection.eyebrow}</p><h2 id="featured-title">{collection.title}</h2></div><div className="carousel-controls"><button type="button" onClick={() => scrollCarousel(-1)} aria-label={collection.carouselPreviousLabel}><ArrowIcon direction="left" /></button><button type="button" onClick={() => scrollCarousel(1)} aria-label={collection.carouselNextLabel}><ArrowIcon direction="right" /></button></div></div>
        <div className="carousel-track" ref={carouselRef}>{storefront.products.slice(0, 8).map((product) => { const primaryImage = product.media.images.find((image) => image.isPrimary); return <a className="carousel-card" href={`/product/${product.id}`} onClick={onNavigate(`/product/${product.id}`)} key={product.id}><div className={`product-art ${product.tone}`}>{primaryImage ? <img className="product-primary-image" src={primaryImage.url} alt={primaryImage.alt} /> : <div className="product-shape" />}</div><div className="carousel-card-info"><span>{product.category}</span><strong>{product.name}</strong><em>{currency.format(product.price)}</em><small aria-label={`${collection.ratingLabel}: ${product.rating}, ${product.reviewCount} ${collection.reviewsLabel}`}><b aria-hidden="true">★★★★★</b> {product.rating.toFixed(1)} ({product.reviewCount} {collection.reviewsLabel})</small></div></a> })}</div>
      </section>
    </>
  )
}
