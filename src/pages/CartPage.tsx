import { useState, type MouseEvent } from 'react'
import { ArrowRight, Image as ImageIcon, ShoppingBag } from 'lucide-react'
import { useCart, updateCart } from '../api/cart'
import { AddToCartButton } from '../components/AddToCartButton'
import { ImagePreviewDialog } from '../components/ImagePreviewDialog'
import { productPrimaryActionClass } from '../components/productCardStyles'
import type { StorefrontApiResponse } from '../api/storefront'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Chip } from '../components/mui/Chip'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Container } from '../components/mui/Container'
import { Paper } from '../components/mui/Paper'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'
type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}
export function CartPage({ storefront, onNavigate }: Props) {
  const { cart } = storefront.content
  const cartQuery = useCart()
  const items = cartQuery.data ?? []
  const loading = cartQuery.isLoading
  const error = cartQuery.isError ? 'Unable to refresh your cart.' : ''
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  const load = () => {
    void cartQuery.refetch()
  }
  const total = items.reduce(
    (sum, item) => sum + (item.product.priceMinor / 100) * item.quantity,
    0,
  )
  return (
    <Container maxWidth="lg" component="section" aria-labelledby="cart-title" sx={{ py: { xs: 3, sm: 5 } }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4 sm:mb-6 sm:pb-5">
        <div>
          <Typography variant="overline" color="text.secondary">{storefront.content.ui.cartLabel}</Typography>
          <Typography id="cart-title" component="h1" variant="h3" sx={{ mb: 1 }}>{cart.title}</Typography>
          <Typography color="text.secondary">Review your selected pieces before checkout.</Typography>
        </div>
        <Chip
          icon={<ShoppingBag aria-hidden="true" className="size-4" />}
          label={`${items.reduce((sum, item) => sum + item.quantity, 0)} items`}
          variant="outlined"
        />
      </div>
      {error && cartQuery.data && <Alert severity="warning" role="alert" sx={{ mb: 3 }} action={<Button color="inherit" size="small" disabled={cartQuery.isFetching} onClick={load}>Retry</Button>}>Your saved cart is still shown, but the latest refresh failed.</Alert>}
      {loading ? (
        <Stack role="status" spacing={1.5} sx={{ minHeight: 240, alignItems: 'center', justifyContent: 'center', border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
          <CircularProgress /><Typography color="text.secondary">Loading your cart…</Typography>
        </Stack>
      ) : error && !cartQuery.data ? (
        <Stack spacing={2} sx={{ minHeight: 240, maxWidth: 600, mx: 'auto', alignItems: 'center', justifyContent: 'center' }}>
          <Alert severity="error" role="alert">Unable to load your cart. Your saved items have not been changed.</Alert>
          <Button variant="outlined" type="button" onClick={load} disabled={cartQuery.isFetching}>Try again</Button>
        </Stack>
      ) : !items.length ? (
        <Stack component={Paper} variant="outlined" spacing={2} sx={{ minHeight: 360, maxWidth: 800, mx: 'auto', px: 3, py: 6, textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag aria-hidden="true" size={28} />
          <Typography color="text.secondary">{cart.emptyDescription}</Typography>
          <Button component="a" variant="contained" href="/products" onClick={onNavigate('/products')}>
            {cart.continueShoppingLabel}
          </Button>
        </Stack>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] py-4 text-sm">
              <h2 className="!mb-0 !text-base !font-semibold !leading-snug !tracking-normal text-[var(--ink)]">Your items</h2>
              <span className="text-[var(--muted)]">{items.length} {items.length === 1 ? 'product' : 'products'}</span>
            </div>
            <div>
              {items.map((item) => (
                <article className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-[var(--line)] py-4 last:border-b-0 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-5 sm:py-5" key={item.id}>
                  <CartProductImage
                    key={item.product.images?.[0]?.id ?? item.product.id}
                    product={item.product}
                  />
                  <div className="min-w-0 self-center">
                    <p className="mb-1 text-xs text-[var(--muted)]">{item.product.category}</p>
                    <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--ink)] sm:text-base">{item.product.name}</h3>
                    <p className="m-0 text-sm font-semibold tabular-nums text-[var(--ink)] sm:hidden">
                      {currency.format((item.product.priceMinor / 100) * item.quantity)}
                    </p>
                    <p className="m-0 min-h-4 text-xs text-[var(--muted)]" role="status">
                      {cartQuery.pending.has(item.product.id) ? 'Saving your change…' : ''}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
                    <strong className="hidden text-sm font-semibold tabular-nums text-[var(--ink)] sm:block">
                      {currency.format((item.product.priceMinor / 100) * item.quantity)}
                    </strong>
                    <AddToCartButton
                      productId={item.product.id}
                      onAdd={() => updateCart(item.product, item.quantity + 1, 'set')}
                      onDecrease={() =>
                        updateCart(item.product, Math.max(0, item.quantity - 1), 'set')
                      }
                      label="Add to cart"
                      className={productPrimaryActionClass}
                      quantity={item.quantity}
                      quantityDisplay="quantity"
                      isUpdating={cartQuery.pending.has(item.product.id)}
                      quantityControlClassName="mx-0 my-0 w-[136px] shrink-0"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
          <Paper component="aside" variant="outlined" className="lg:sticky lg:top-24" sx={{ p: { xs: 2.5, sm: 3 } }} aria-label="Order summary">
            <Typography component="h2" variant="h6" sx={{ mb: 2.5 }}>Order summary</Typography>
            <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-4 text-sm text-[var(--muted)]">
              <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
              <span className="tabular-nums text-[var(--ink)]">{currency.format(total)}</span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-base font-semibold text-[var(--ink)]">
              <span>Estimated total</span>
              <strong className="tabular-nums">{currency.format(total)}</strong>
            </div>
            <p className="mb-5 text-xs leading-5 text-[var(--muted)]">Final charges and available payment options are shown during checkout.</p>
            <Button
              component="a"
              variant="contained"
              fullWidth
              href="/checkout"
              aria-disabled={cartQuery.isUpdating}
              onClick={(event) => {
                if (cartQuery.isUpdating) event.preventDefault()
                else onNavigate('/checkout')(event)
              }}
            >
              Proceed to checkout <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button className="mt-3" component="a" variant="text" fullWidth href="/products" onClick={onNavigate('/products')}>
              Continue shopping
            </Button>
            {cartQuery.isUpdating && <p className="mb-0 mt-3 text-center text-xs text-[var(--muted)]" role="status">Saving cart changes…</p>}
          </Paper>
        </div>
      )}
    </Container>
  )
}

function CartProductImage({
  product,
}: {
  product: {
    id: string
    name: string
    images?: { id: string; url: string; alt: string | null; sortOrder: number }[]
  }
}) {
  const image = product.images?.[0]
  const imageUrl = image?.url.trim()
  const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!safeImageUrl || failedUrl === safeImageUrl)
    return (
      <div
        className="grid size-[76px] place-items-center rounded-[var(--radius-card)] bg-[rgba(215,225,208,0.35)] text-center text-[var(--muted)] sm:size-[88px]"
        role="img"
        aria-label={`No product image available for ${product.name}`}
      >
        <div className="grid justify-items-center gap-1 text-xs">
          <ImageIcon aria-hidden="true" className="size-6" />
          <span>Image unavailable</span>
        </div>
      </div>
    )

  const alt = image?.alt?.trim() || product.name
  return (
    <>
      <Button
        variant="outlined"
        type="button"
        className="group block size-[76px] cursor-zoom-in overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] disabled:cursor-wait sm:size-[88px]"
        sx={{ minWidth: { xs: 76, sm: 88 }, width: { xs: 76, sm: 88 }, height: { xs: 76, sm: 88 }, minHeight: { xs: 76, sm: 88 }, p: 0, overflow: 'hidden', borderRadius: 2 }}
        disabled={loadedUrl !== safeImageUrl}
        aria-label={`View larger image of ${product.name}`}
        onClick={() => setPreviewOpen(true)}
      >
        <img
          className="h-full w-full object-contain p-1 transition-transform duration-200 group-hover:scale-[1.03]"
          src={safeImageUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoadedUrl(safeImageUrl)}
          onError={() => setFailedUrl(safeImageUrl)}
        />
      </Button>
      {previewOpen && (
        <ImagePreviewDialog src={safeImageUrl} alt={alt} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  )
}
