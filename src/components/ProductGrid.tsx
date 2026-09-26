import type { StorefrontProduct } from '../api/storefront'
import { ProductCard } from './ProductCard'
import { productGridClass } from './productCardStyles'

type ProductGridProps = {
  products: readonly StorefrontProduct[]
  currency: Intl.NumberFormat
  addToCartLabel?: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: (productId: string) => Promise<void>
  onOpenProduct: (id: string) => void
}

export function ProductGrid({
  products,
  currency,
  addToCartLabel = 'Add to cart',
  ratingLabel,
  reviewsLabel,
  onAdd,
  onOpenProduct,
}: ProductGridProps) {
  return (
    <div className={productGridClass}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currency={currency}
          addToCartLabel={addToCartLabel}
          ratingLabel={ratingLabel}
          reviewsLabel={reviewsLabel}
          onAdd={onAdd}
          onOpen={() => onOpenProduct(product.id)}
        />
      ))}
    </div>
  )
}
