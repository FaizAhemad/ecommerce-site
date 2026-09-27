import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { ArrowIcon } from '../components/ArrowIcon'
import { ProductGrid } from '../components/ProductGrid'
import { SubscribeSection } from '../components/SubscribeSection'
type HomePageProps = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
  onAdd: (productId: string) => Promise<void>
  onOpenProduct: (id: string) => void
}
export function HomePage({ storefront, onNavigate, onAdd, onOpenProduct }: HomePageProps) {
  const { hero, collection, story } = storefront.content
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  const featured = storefront.products.slice(0, 8)
  const trending = storefront.products.slice(8, 16)
  const categoryPriority = ['Home & Kitchen', 'Electronics', 'Accessories', 'Toys', 'Clothing']
  const categories = [
    ...categoryPriority.filter((category) => storefront.facets.categories.includes(category)),
    ...storefront.facets.categories.filter((category) => !categoryPriority.includes(category)),
  ].slice(0, 5)
  const categoryDescriptions: Record<string, string> = {
    'Home & Kitchen': 'Clever helpers for your everyday routines.',
    Electronics: 'Small upgrades that make life easier.',
    Accessories: 'Useful pieces to carry and keep close.',
    Toys: 'Colorful finds made for play.',
    Clothing: 'Comfortable pieces for everyday wear.',
  }
  return (
    <>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 id="hero-title">{hero.title}</h1>
          <p className="hero-text">
            {storefront.identity.tagline} {hero.description}
          </p>
          <a className="primary-button" href="/products" onClick={onNavigate('/products')}>
            {hero.actionLabel} <ArrowIcon direction="right" />
          </a>
        </div>
        <div className="hero-art">
          <img
            className="hero-art-image"
            src="/images/gadgify-curated-finds.jpg"
            alt={hero.artworkDescription}
            fetchPriority="high"
          />
        </div>
      </section>
      {categories.length > 0 && (
        <section
          className="mx-auto w-full max-w-[90rem] px-4 pb-14 md:px-8 md:pb-20"
          aria-labelledby="home-categories-title"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
                Find your kind of useful
              </p>
              <h2
                className="m-0 font-[var(--font-display)] text-[clamp(1.6rem,3vw,2.25rem)] font-normal leading-tight tracking-[-0.04em] text-[var(--ink)]"
                id="home-categories-title"
              >
                Shop by category
              </h2>
            </div>
            <a
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)]"
              href="/products"
              onClick={onNavigate('/products')}
            >
              View all products <ArrowIcon direction="right" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {categories.map((category, index) => {
              const path = `/products?category=${encodeURIComponent(category)}`
              return (
                <a
                  className="group flex min-h-28 items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 no-underline transition-colors hover:border-[var(--green)] hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] sm:min-h-32 sm:p-5"
                  href={path}
                  onClick={onNavigate(path)}
                  key={category}
                >
                  <span className="min-w-0">
                    <span className="mb-2 block font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      0{index + 1} / CATEGORY
                    </span>
                    <span className="block text-sm font-semibold leading-5 text-[var(--ink)] sm:text-base">
                      {category}
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-[var(--muted)]">
                      {categoryDescriptions[category] ?? 'Explore useful everyday finds.'}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--ink)]" aria-hidden="true">
                    →
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      )}
      <section className="home-products page-section" aria-labelledby="featured-products-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured edit</p>
            <h2 id="featured-products-title">Trending now</h2>
          </div>
          <p className="section-note">
            A considered selection of customer favorites and new arrivals.
          </p>
        </div>
        <ProductGrid
          products={featured}
          currency={currency}
          addToCartLabel={collection.addToCartLabel}
          ratingLabel={collection.ratingLabel}
          reviewsLabel={collection.reviewsLabel}
          onAdd={onAdd}
          onOpenProduct={onOpenProduct}
        />
        <a
          className="primary-button home-explore"
          href="/products"
          onClick={onNavigate('/products')}
        >
          Explore all products <ArrowIcon direction="right" />
        </a>
      </section>
      <section className="home-story page-section">
        <div>
          <p className="eyebrow">{story.eyebrow}</p>
          <h2>{story.title}</h2>
        </div>
        <p className="hero-text">{story.description}</p>
      </section>
      <section className="home-products page-section" aria-labelledby="latest-products-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest arrivals</p>
            <h2 id="latest-products-title">Fresh for the everyday</h2>
          </div>
        </div>
        <ProductGrid
          products={trending}
          currency={currency}
          addToCartLabel={collection.addToCartLabel}
          ratingLabel={collection.ratingLabel}
          reviewsLabel={collection.reviewsLabel}
          onAdd={onAdd}
          onOpenProduct={onOpenProduct}
        />
        <a
          className="primary-button home-explore"
          href="/products"
          onClick={onNavigate('/products')}
        >
          View the full collection <ArrowIcon direction="right" />
        </a>
      </section>
      <SubscribeSection />
    </>
  )
}
