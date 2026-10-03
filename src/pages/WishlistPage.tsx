import { privateKey } from '../api/sessionScope'
import { readWishlist } from '../api/wishlistState'
import { wishlistVersion, replaceWishlist } from '../api/wishlistState'
import { apiFetch as fetch } from '../api/http'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { StorefrontApiResponse } from '../api/storefront'
import { ProductCard } from '../components/ProductCard'
import { queryClient } from '../api/queryClient'
import { getCartPendingAction, useCart } from '../api/cart'
import { sessionUser } from '../api/sessionScope'
import { Box } from '../components/mui/Box'
import { Button } from '../components/mui/Button'
import { Container } from '../components/mui/Container'
import { Paper } from '../components/mui/Paper'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

type Props = {
  storefront: StorefrontApiResponse
  onAdd: (productId: string) => Promise<void>
  onOpenProduct: (id: string) => void
}

export function WishlistPage({ storefront, onAdd, onOpenProduct }: Props) {
  const { t } = useTranslation()
  const cart = useCart()
  const quantities = new Map((cart.data ?? []).map((item) => [item.product.id, item.quantity]))
  const isCartLoading = Boolean(sessionUser() && cart.isPending)
  const [ids, setIds] = useState<string[]>(() => readWishlist())
  const wishlistQuery = useQuery({
    queryKey: privateKey('wishlist'),
    queryFn: async () => {
      const response = await fetch('/api/wishlist')
      if (!response.ok) return []
      const body = await response.json()
      return (body?.wishlist?.items ?? []).map(
        (item: { productId: string }) => item.productId as string,
      )
    },
    staleTime: 0,
  })
  useEffect(() => {
    const sync = () => {
      const next = readWishlist()
      setIds(next)
      queryClient.setQueryData(privateKey('wishlist'), next)
    }
    window.addEventListener('wishlistchange', sync)
    const version = wishlistVersion()
    if (wishlistQuery.data?.length) replaceWishlist(wishlistQuery.data, version)
    return () => window.removeEventListener('wishlistchange', sync)
  }, [wishlistQuery.data])
  const products = storefront.products.filter((product) => ids.includes(product.id))
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, sm: 5, lg: 7 } }}>
      <Stack spacing={{ xs: 3, sm: 4 }}>
      <Stack component="header" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Box>
          <Typography variant="overline" color="text.secondary">{t('wishlist:eyebrow')}</Typography>
          <Typography component="h1" variant="h3">{t('wishlist:title')}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {products.length} {products.length === 1 ? t('wishlist:savedItem') : t('wishlist:savedItems')}
        </Typography>
      </Stack>
      {products.length ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 248px), 1fr))', gap: { xs: 1.5, sm: 2.5 } }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              addToCartLabel={storefront.content.collection.addToCartLabel}
              ratingLabel={storefront.content.collection.ratingLabel}
              reviewsLabel={storefront.content.collection.reviewsLabel}
              onAdd={onAdd}
              onOpen={() => onOpenProduct(product.id)}
              quantity={quantities.get(product.id) ?? 0}
              isCartLoading={isCartLoading}
              isCartUpdating={cart.pending.has(product.id)}
              cartPendingAction={getCartPendingAction(product.id)}
            />
          ))}
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography component="h2" variant="h5">{t('wishlist:emptyTitle')}</Typography>
          <Typography color="text.secondary">{t('wishlist:emptyDescription')}</Typography>
          <Button component="a" variant="contained" href="/products">
            {t('wishlist:exploreProducts')}
          </Button>
          </Stack>
        </Paper>
      )}
      </Stack>
    </Container>
  )
}
