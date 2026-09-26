import type { StorefrontProduct } from '../api/storefront'
import { ProductCard } from './ProductCard'
import { productGridClass } from './productCardStyles'
import { useCart } from '../api/cart'
import { sessionUser } from '../api/sessionScope'

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
  const cart = useCart()
  const quantities = new Map((cart.data ?? []).map((item) => [item.product.id, item.quantity]))
  const isCartLoading = Boolean(sessionUser() && cart.isPending)

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
          quantity={quantities.get(product.id) ?? 0}
          isCartLoading={isCartLoading}
          isCartUpdating={cart.pending.has(product.id)}
        />
      ))}
    </div>
  )
}
