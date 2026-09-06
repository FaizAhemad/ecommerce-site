import type { StorefrontApiResponse } from '../api/storefront'

type ProductCardProps = {
  product: StorefrontApiResponse['products'][number]
  currency: Intl.NumberFormat
  addToCartLabel: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: () => void
  onOpen: () => void
}

export function ProductCard({ product, currency, addToCartLabel, ratingLabel, reviewsLabel, onAdd, onOpen }: ProductCardProps) {
  const primaryImage = product.media.images.find((image) => image.isPrimary)
  return (
    <article className="product-card" role="link" tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }}>
      <div className={`product-art ${product.tone}`}>
        <span>{product.badge}</span>
        {primaryImage ? <img className="product-primary-image" src={primaryImage.url} alt={primaryImage.alt} /> : <div className="product-shape" />}
      </div>
      <div className="product-info">
        <div>
          <p className="product-category">{product.category}</p>
          <h3>{product.name}</h3>
        </div>
        <strong>{currency.format(product.price)}</strong>
      </div>
      <div className="product-rating" aria-label={`${ratingLabel}: ${product.rating}, ${product.reviewCount} ${reviewsLabel}`}><span aria-hidden="true">★★★★★</span><b>{product.rating.toFixed(1)}</b><em>({product.reviewCount} {reviewsLabel})</em></div>
      {product.colors && <div className="product-swatches" aria-label={`Available colors: ${product.colors.join(', ')}`}>{product.colors.map((color) => <span className={`color-swatch color-${color.toLowerCase()}`} key={color} title={color} />)}</div>}
      <button className="add-button" type="button" onClick={(event) => { event.stopPropagation(); onAdd() }}>
        {addToCartLabel} <span aria-hidden="true">+</span>
      </button>
    </article>
  )
}
