import type { StorefrontProduct } from '../api/storefront'
import { ProductCard } from './ProductCard'
import { getCartPendingAction, useCart } from '../api/cart'
import { sessionUser } from '../api/sessionScope'
import { Box } from './mui/Box'

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
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))',
        },
        columnGap: { xs: 1.5, md: 2.5 },
        rowGap: { xs: 2.5, md: 4 },
        alignItems: 'stretch',
      }}
    >
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
          cartPendingAction={getCartPendingAction(product.id)}
        />
      ))}
    </Box>
  )
}
