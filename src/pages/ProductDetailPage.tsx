import {
  privateKey,
  sessionUser,
  sessionGeneration,
  assertCurrentSession,
} from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { AddToCartButton } from '../components/AddToCartButton'
import { RatingStars } from '../components/RatingStars'
import { Chip } from '../components/mui/Chip'
import { Button } from '../components/mui/Button'
import { MenuItem } from '../components/mui/MenuItem'
import { TextField } from '../components/mui/TextField'
import { apiFetch as fetch, LONG_RUNNING_API_TIMEOUT_MS } from '../api/http'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { getProduct, type StorefrontApiResponse } from '../api/storefront'
import { queryClient } from '../api/queryClient'
import { useProductMetadata } from '../api/productMetadata'
import { getCartPendingAction, updateCart, useCart } from '../api/cart'
import { productAvailability } from '../components/productAvailability'
import { ProductGrid } from '../components/ProductGrid'
import { Box } from '../components/mui/Box'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'
import { Dialog } from '../components/mui/Dialog'
import { DialogContent } from '../components/mui/DialogContent'
import { IconButton } from '../components/mui/IconButton'

type ReviewMedia = { id: string; url: string }

function PencilIcon() {
  return (
    <svg
      className="size-4 shrink-0 fill-none stroke-current [stroke-width:1.7] [stroke-linecap:round] [stroke-linejoin:round]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m4 16.5-.8 3.8 3.8-.8L18.3 8.2l-3.5-3.5L4 16.5Z" />
      <path d="m13.5 6 3.5 3.5M4 20.3h16" />
    </svg>
  )
}

function ReviewAttachments({ media }: { media: ReviewMedia[] }) {
  if (!media.length) return null
  return (
    <div className="review-attachments mt-4 flex flex-wrap items-start gap-3" aria-label="Review photos and videos">
      {media.map((item, index) =>
        /\.(mp4|webm)(?:[?#]|$)/i.test(item.url) ? (
          <video
            key={item.id}
            src={item.url}
            className="h-40 w-60 max-w-full rounded-md bg-[var(--ink)] object-contain"
            controls
            playsInline
            preload="metadata"
            aria-label={`Review video ${index + 1}`}
          />
        ) : (
          <a
            key={item.id}
            className="block size-[120px] overflow-hidden rounded-md border border-[var(--line)]"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open review photo ${index + 1}`}
          >
            <img className="block size-full object-cover" src={item.url} alt={`Review photo ${index + 1}`} loading="lazy" />
          </a>
        ),
      )}
    </div>
  )
}

type Props = {
  storefront: StorefrontApiResponse
  productId: string
  onAdd: (productId: string) => Promise<void>
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenProduct: (id: string) => void
}

export function ProductDetailPage({ storefront, productId, onAdd, onNavigate, onOpenProduct }: Props) {
  const cartQuery = useCart()
  const catalogProduct = storefront.products.find((item) => item.id === productId)
  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
    initialData: catalogProduct,
    initialDataUpdatedAt: 0,
  })
  const productLoading = !catalogProduct && productQuery.isLoading
  const productError = !catalogProduct && productQuery.isError
  const product = productQuery.data ?? null
  useProductMetadata(product, productQuery.isFetching, productQuery.isError)
  const [showAll, setShowAll] = useState(false)
  const [limit, setLimit] = useState(4)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [reviewSaving, setReviewSaving] = useState(false)
  const reviewSavingRef = useRef(false)
  const notify = useNotification()
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const zoomImageRef = useRef<HTMLImageElement>(null)
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`)
      if (!response.ok) throw new Error('Unable to load reviews')
      const body = (await response.json()) as {
        reviews?: Array<{
          id: string
          rating: number
          body?: string | null
          createdAt: string
          media?: ReviewMedia[]
          user?: { name?: string | null }
        }>
      }
      return (body.reviews ?? []).map((review) => ({
        id: review.id,
        rating: review.rating,
        text: review.body ?? '',
        author: review.user?.name ?? 'Customer',
        date: new Date(review.createdAt).toLocaleDateString(),
        media: review.media ?? [],
      }))
    },
    staleTime: 30_000,
  })
  const myReviewQuery = useQuery({
    queryKey: privateKey('my-review', productId),
    enabled: Boolean(sessionUser()),
    queryFn: async () => {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews/mine`)
      if (response.status === 401 || response.status === 404) return null
      if (!response.ok) throw new Error('Unable to load your review')
      const body = (await response.json()) as {
        review?: { id: string; rating: number; body?: string | null } | null
      }
      return body.review ?? null
    },
    staleTime: 30_000,
  })
  const [selected, setSelected] = useState<{ type: 'image'; id: string } | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    document.body.style.overflow = showAll ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [showAll])

  const mediaItems = [
    ...(product?.media.images ?? []).map((item) => ({
      type: 'image' as const,
      id: item.id,
      url: item.url,
      alt: item.alt,
    })),
    ...(product?.media.videos ?? []).map((item) => ({
      type: 'video' as const,
      id: item.id,
      url: item.url,
      posterUrl: item.posterUrl,
      alt: item.alt,
    })),
  ]
  const availableMediaItems = mediaItems.filter(
    (item) => item.type !== 'image' || !failedImageIds.has(item.id),
  )
  const markImageFailed = (id: string) => {
    if (failedImageIds.has(id)) return
    const activeLightboxItem = lightboxIndex === null ? null : availableMediaItems[lightboxIndex]
    const nextFailedIds = new Set(failedImageIds).add(id)
    const nextMediaItems = mediaItems.filter(
      (item) => item.type !== 'image' || !nextFailedIds.has(item.id),
    )
    setFailedImageIds(nextFailedIds)
    if (activeLightboxItem?.id === id) setLightboxIndex(null)
    else if (activeLightboxItem) {
      const nextIndex = nextMediaItems.findIndex((item) => item.id === activeLightboxItem.id)
      setLightboxIndex(nextIndex >= 0 ? nextIndex : null)
    }
  }
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowLeft')
        setLightboxIndex((current) =>
          current === null ? null : (current - 1 + availableMediaItems.length) % availableMediaItems.length,
        )
      if (event.key === 'ArrowRight')
        setLightboxIndex((current) => (current === null ? null : (current + 1) % availableMediaItems.length))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxIndex, availableMediaItems.length])

  const reviews = reviewsQuery.data ?? []

  if (productLoading)
    return (
      <section className="page-section state-panel" aria-busy="true">
        <p className="eyebrow">{storefront.content.ui.loadingLabel}</p>
        <span className="loading-spinner" aria-hidden="true" />
        <p role="status">Loading product...</p>
      </section>
    )
  if (!product)
    return (
      <section className="page-section state-panel product-unavailable" aria-live="polite">
        <p className="eyebrow">{productError ? 'Connection problem' : 'Product unavailable'}</p>
        <h1>{productError ? 'Unable to load this product.' : 'Product not found.'}</h1>
        <p className="hero-text">
          {productError
            ? 'We could not reach the store. Please try again in a moment.'
            : 'This product may have been removed or the link may be incorrect.'}
        </p>
        <div className="error-actions">
          {productError && (
            <Button
              variant="contained"
              type="button"
              onClick={() => {
                void productQuery.refetch()
              }}
            >
              Try again
            </Button>
          )}
          <a className="secondary-button" href="/products" onClick={onNavigate('/products')}>
            Browse products
          </a>
        </div>
      </section>
    )

  const initialImage =
    product.media.images.find((image) => image.isPrimary) ?? product.media.images[0]
  const initialVideo = product.media.videos[0]
  const cartItem = cartQuery.data?.find((item) => item.product.id === product.id)
  const cartQuantity = cartItem?.quantity ?? 0
  const isCartLoading = Boolean(sessionUser() && cartQuery.isPending)
  const signedIn = Boolean(sessionUser())

  const selectedImage =
    selected
      ? product.media.images.find((item) => item.id === selected.id)
      : initialImage
  const selectedVideo = !selected && !initialImage ? initialVideo : undefined
  const total = reviews.length || 1
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((item) => item.rating === rating).length,
  }))
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  const relatedProducts = storefront.products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4)
  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (reviewSavingRef.current || !reviewComment.trim()) return
    reviewSavingRef.current = true
    setReviewSaving(true)
    const generation = sessionGeneration()
    try {
      const urls: string[] = []
      for (const file of reviewFiles) {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        assertCurrentSession(generation)
        const upload = await fetch(`/api/products/${encodeURIComponent(productId)}/review-upload`, {
          timeoutMs: LONG_RUNNING_API_TIMEOUT_MS,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, filename: file.name, contentType: file.type }),
        })
        if (!upload.ok) {
          const failure = (await upload.json().catch(() => null)) as {
            error?: { message?: string }
          } | null
          throw new Error(failure?.error?.message ?? 'Review media could not be uploaded.')
        }
        urls.push(((await upload.json()) as { url: string }).url)
      }
      assertCurrentSession(generation)
      const endpoint = editingReviewId
        ? `/api/products/${encodeURIComponent(productId)}/reviews/mine`
        : `/api/products/${encodeURIComponent(productId)}/reviews`
      const response = await fetch(endpoint, {
        method: editingReviewId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, body: reviewComment.trim(), media: urls }),
      })
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as {
          error?: { message?: string }
        } | null
        throw new Error(
          failure?.error?.message ??
            (response.status === 401
              ? 'Please sign in to submit a review.'
              : 'Your review could not be saved. Please try again.'),
        )
      }
      const body = (await response.json()) as {
        review?: {
          id: string
          rating: number
          body?: string | null
          createdAt: string
          media?: ReviewMedia[]
        }
      }
      if (body.review) {
        const nextReview = {
          id: body.review.id,
          rating: body.review.rating,
          text: body.review.body ?? '',
          author: 'You',
          date: new Date(body.review.createdAt).toLocaleDateString(),
          media: body.review.media ?? urls.map((url) => ({ id: url, url })),
        }
        queryClient.setQueryData<
          Array<{
            id: string
            rating: number
            text: string
            author: string
            date: string
            media: ReviewMedia[]
          }>
        >(['product-reviews', productId], (current = []) =>
          current.some((item) => item.id === nextReview.id)
            ? current.map((item) => (item.id === nextReview.id ? nextReview : item))
            : [nextReview, ...current],
        )
        queryClient.setQueryData(privateKey('my-review', productId), {
          id: nextReview.id,
          rating: nextReview.rating,
          body: nextReview.text,
        })
      }
      setReviewFiles([])
      if (!editingReviewId) {
        setReviewComment('')
        setReviewRating(5)
      }
      notify(storefront.content.reviews.successLabel, 'success')
    } catch (error) {
      notify(error instanceof Error ? error : 'Your review could not be saved. Please try again.')
    } finally {
      reviewSavingRef.current = false
      setReviewSaving(false)
    }
  }

  return (
    <Box component="div" sx={{ width: '100%' }}>
      <Box
        component="section"
        aria-labelledby="product-title"
        sx={{
          display: 'grid',
          width: '100%',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, .92fr)' },
          alignItems: 'center',
          gap: { xs: 3, md: 5, lg: 7 },
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, md: 5 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box className="detail-gallery" sx={{ minWidth: 0, width: '100%', maxWidth: { md: 560 }, justifySelf: 'center' }}>
          <div className="detail-art relative aspect-square overflow-hidden rounded-2xl bg-[var(--surface)] shadow-sm">
            <div className="detail-media-viewport relative h-full w-full overflow-hidden">
              {selectedVideo ? (
                <video
                  className="product-primary-video"
                  src={selectedVideo.url}
                  poster={selectedVideo.posterUrl}
                  controls
                  playsInline
                  onClick={() =>
                    setLightboxIndex(
                      availableMediaItems.findIndex(
                        (item) => item.type === 'video' && item.id === selectedVideo.id,
                      ),
                    )
                  }
                />
              ) : selectedImage && !failedImageIds.has(selectedImage.id) ? (
                <Button
                  variant="text"
                  type="button"
                  className="h-full w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)]"
                  sx={{ display: 'block', minWidth: 0, minHeight: 0, width: '100%', height: '100%', p: 0, borderRadius: 0 }}
                  aria-label={`View larger image: ${selectedImage.alt}`}
                  onClick={() =>
                    setLightboxIndex(
                      availableMediaItems.findIndex(
                        (item) => item.type === 'image' && item.id === selectedImage.id,
                      ),
                    )
                  }
                >
                  <img
                    className="product-primary-image h-full w-full cursor-zoom-in object-contain transition-transform duration-100 ease-out"
                    src={selectedImage.url}
                    alt={selectedImage.alt}
                    draggable={false}
                    ref={zoomImageRef}
                    onError={() => markImageFailed(selectedImage.id)}
                    onPointerMove={(event) => {
                      if (event.pointerType !== 'mouse') return
                      const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
                      if (!bounds) return
                      const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
                      const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))
                      event.currentTarget.style.transform = 'scale(2.2)'
                      event.currentTarget.style.transformOrigin = `${x}% ${y}%`
                      event.currentTarget.style.cursor = 'zoom-out'
                    }}
                    onPointerLeave={() => {
                      if (!zoomImageRef.current) return
                      zoomImageRef.current.style.transform = ''
                      zoomImageRef.current.style.transformOrigin = ''
                      zoomImageRef.current.style.cursor = ''
                    }}
                  />
                </Button>
              ) : (
                <>
                  <div className="product-shape" aria-hidden="true" />
                  {selectedImage && failedImageIds.has(selectedImage.id) && (
                    <span
                      className="absolute inset-x-4 bottom-4 rounded-md bg-[var(--surface)]/90 px-3 py-2 text-center text-sm text-[var(--muted)]"
                      role="status"
                    >
                      Product image unavailable
                    </span>
                  )}
                </>
              )}
              {selectedImage && !failedImageIds.has(selectedImage.id) && (
                <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-medium text-[var(--ink)] shadow-sm">
                  <span className="hidden md:inline">Hover to zoom | Click to view</span>
                  <span className="md:hidden">Tap to enlarge</span>
                </span>
              )}
            </div>
          </div>
          {(product.media.images.length > 0 || product.media.videos.length > 0) && (
            <div
              className="mt-3 flex gap-2 overflow-x-auto pb-1"
              aria-label={`${storefront.content.detail.imagesLabel} and ${storefront.content.detail.videosLabel}`}
            >
              {product.media.images.map((item) => (
                <Button
                  variant="outlined"
                  className={`grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border bg-[var(--surface)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 ${selectedImage?.id === item.id ? 'border-[var(--ink)] ring-2 ring-[var(--ink)]' : 'border-[var(--line)] hover:border-[var(--ink)]'}`}
                  sx={{ minWidth: 64, width: 64, minHeight: 64, height: 64, p: 0, overflow: 'hidden', flexShrink: 0 }}
                  type="button"
                  disabled={failedImageIds.has(item.id)}
                  key={item.id}
                  onClick={() => {
                    setSelected({ type: 'image', id: item.id })
                    setLightboxIndex(availableMediaItems.findIndex((media) => media.id === item.id))
                  }}
                >
                  {failedImageIds.has(item.id) ? (
                    <span className="grid h-full w-full place-items-center text-xs text-[var(--muted)]">
                      Unavailable
                    </span>
                  ) : (
                    <img className="h-full w-full object-cover" src={item.url} alt={item.alt} onError={() => markImageFailed(item.id)} />
                  )}
                </Button>
              ))}
              {product.media.videos.map((item) => (
                <Button
                  variant="outlined"
                  className={`media-video relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border bg-[var(--surface)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] ${selectedVideo?.id === item.id ? 'border-[var(--ink)] ring-2 ring-[var(--ink)]' : 'border-[var(--line)] hover:border-[var(--ink)]'}`}
                  sx={{ minWidth: 64, width: 64, minHeight: 64, height: 64, p: 0, overflow: 'hidden', flexShrink: 0 }}
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setLightboxIndex(
                      availableMediaItems.findIndex((media) => media.type === 'video' && media.id === item.id),
                    )
                  }}
                  aria-label={item.alt || storefront.content.detail.videosLabel}
                >
                  <video
                    className="h-full w-full object-cover"
                    src={item.url}
                    poster={item.posterUrl}
                    muted
                    playsInline
                    preload="metadata"
                  />
                </Button>
              ))}
            </div>
          )}
          {product.media.images.length === 0 && product.media.videos.length === 0 && (
            <p className="mt-3 text-sm text-[var(--muted)]">{storefront.content.detail.noMediaLabel}</p>
          )}
        </Box>
        <Stack className="detail-copy" spacing={{ xs: 2.5, md: 3 }} sx={{ width: '100%', maxWidth: 620, alignItems: 'flex-start', justifySelf: 'center' }}>
          <Typography component="p" variant="overline" color="success.main" sx={{ m: 0, fontWeight: 700, letterSpacing: '.12em' }}>{product.category}</Typography>
          <Typography component="h1" id="product-title" sx={{ m: 0, fontSize: 'clamp(2rem, 4.2vw, 3.75rem)', fontWeight: 500, lineHeight: 1.06, letterSpacing: '-.045em', overflowWrap: 'anywhere' }}>{product.name}</Typography>
          <Stack component="div" role="group" direction="row" spacing={1} sx={{ minHeight: 40, alignItems: 'center', flexWrap: 'wrap' }} aria-label={product.reviewCount > 0 ? `${product.rating.toFixed(1)} out of 5 from ${product.reviewCount} reviews` : 'No reviews yet'}>
            {product.reviewCount > 0 ? <>
              <RatingStars rating={product.rating} size="medium" />
              <Typography component="strong" sx={{ color: 'text.primary', fontWeight: 700 }}>{product.rating.toFixed(1)}</Typography>
            </> : <Typography variant="body2" color="text.secondary">No reviews yet</Typography>}
            <Button variant="text" href="#product-reviews" onClick={(event) => { event.preventDefault(); document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} sx={{ minHeight: 40, px: 0.5, fontSize: 13 }}>{product.reviewCount > 0 ? `Read ${product.reviewCount} reviews` : 'Be the first to review'}</Button>
          </Stack>
          <Box sx={{ width: '100%', p: { xs: 2, sm: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
              <Stack spacing={0.75}>
                <Typography component="span" variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Price</Typography>
                <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <Typography component="strong" sx={{ color: 'text.primary', fontSize: { xs: 26, md: 30 }, fontWeight: 800, lineHeight: 1.1 }}>{currency.format(product.price)}</Typography>
                  {product.compareAtPriceMinor != null && product.priceMinor != null && product.compareAtPriceMinor > product.priceMinor && <>
                    <Typography component="del" color="text.secondary" sx={{ fontSize: 15 }}>{currency.format(product.compareAtPriceMinor / 100)}</Typography>
                    <Chip label={`${Math.round(((product.compareAtPriceMinor - product.priceMinor) / product.compareAtPriceMinor) * 100)}% off`} size="small" color="success" />
                  </>}
                </Stack>
              </Stack>
              {typeof product.stock === 'number' && <Chip {...(product.stock <= 0 ? productAvailability(product.stock) : product.purchase?.available === false && product.seller && !product.seller.isPlatform ? { label: 'Offer pending', color: 'warning' as const } : productAvailability(product.stock))} size="small" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, height: 26, fontWeight: 650 }} />}
            </Stack>
          </Box>
          {product.description?.trim() && <Stack spacing={0.75}>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 750 }}>About this product</Typography>
            <Typography component="p" sx={{ m: 0, maxWidth: 600, color: 'text.secondary', fontSize: { xs: 15, md: 16 }, lineHeight: 1.65, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{product.description.trim()}</Typography>
          </Stack>}
          {product.colors && product.colors.length > 0 && (
            <Stack spacing={1.5}>
              <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 750 }}>Available colors</Typography>
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                {product.colors.map((color) => (
                  <span
                    className="size-6 shrink-0 rounded-full border-2 border-[var(--surface)] outline outline-1 outline-[var(--line)]"
                    style={{ backgroundColor: product.colorValues?.[color] ?? color.toLowerCase() }}
                    title={color}
                    aria-label={color}
                    key={color}
                  />
                ))}
              </Stack>
            </Stack>
          )}
          <AddToCartButton
            unavailableReason={typeof product.stock === 'number' && product.stock <= 0 ? 'Out of stock' : product.purchase?.available === false ? product.purchase.reason ?? 'Currently unavailable' : undefined}
            productId={product.id}
            onAdd={onAdd}
            onDecrease={() => updateCart(
              cartItem?.product ?? {
                id: product.id,
                name: product.name,
                category: product.category,
                priceMinor: product.priceMinor ?? Math.round(product.price * 100),
              },
              Math.max(0, cartQuantity - 1),
              'set',
            )}
            label={storefront.content.collection.addToCartLabel}
            quantity={cartQuantity}
            isCartLoading={isCartLoading}
            isUpdating={cartQuery.pending.has(product.id)}
            pendingAction={getCartPendingAction(product.id)}
            sx={{ width: 'fit-content', minWidth: 196, maxWidth: '100%' }}
            quantityControlSx={{ width: 220, maxWidth: '100%' }}
          />
        </Stack>
      </Box>
      <section className="mx-auto w-full max-w-[90rem] border-t border-[var(--line)] px-4 py-10 md:px-8 md:py-14" id="product-reviews">
        <div className="mb-8 flex flex-col gap-2">
          <p className="eyebrow mb-0">Customer feedback</p>
          <h2 className="mb-0 text-3xl text-[var(--ink)] md:text-4xl">Product ratings &amp; reviews</h2>
          <p className="mb-0 text-sm text-[var(--muted)]">Ratings and reviews shared by shoppers.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:grid-cols-[minmax(12rem,0.7fr)_2fr] md:gap-10 md:p-8">
          <div className="flex flex-col items-start justify-center gap-2">
            <strong className="text-5xl font-semibold leading-none text-[var(--ink)]">
              {product.reviewCount > 0 ? product.rating.toFixed(1) : '0.0'}
            </strong>
            <RatingStars rating={product.rating} size="medium" />
            <p className="m-0 text-sm text-[var(--muted)]">
              {product.reviewCount} ratings
              <br />
              {reviews.length} reviews
            </p>
          </div>
          <div className="grid content-center gap-3" aria-label="Review rating distribution">
            {reviewsQuery.isLoading ? (
              <p className="m-0 text-sm text-[var(--muted)]" role="status">Loading rating breakdown...</p>
            ) : reviewsQuery.isError ? (
              <p className="m-0 text-sm text-[var(--muted)]">Rating breakdown unavailable.</p>
            ) : distribution.map(({ rating, count }) => (
              <div className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm text-[var(--muted)]" key={rating}>
                <RatingStars rating={rating} size="small" label={`${rating} stars`} />
                <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
                  <i className="block h-full rounded-full bg-[var(--yellow)]" style={{ width: `${count ? Math.max((count / total) * 100, 8) : 0}%` }} />
                </div>
                <b className="text-right font-medium text-[var(--ink)]">{count}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-5 border-t border-[var(--line)] pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
            <h3 className="m-0 text-2xl text-[var(--ink)]">Latest reviews</h3>
            {reviews.length > 3 && (
              <Button variant="outlined" type="button" onClick={() => setShowAll(true)}>
                View all reviews
              </Button>
            )}
          </div>
          {reviewsQuery.isLoading && <p className="m-0 text-sm text-[var(--muted)]" role="status">Loading reviews...</p>}
          {reviewsQuery.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4" role="alert">
              <p className="m-0 text-sm text-[var(--muted)]">Reviews could not be loaded.</p>
              <Button variant="outlined" type="button" onClick={() => void reviewsQuery.refetch()}>
                Try again
              </Button>
            </div>
          )}
          {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.slice(0, 3).map((review) => (
            <article className="border-b border-[var(--line)] py-5 last:border-0" key={review.id}>
              <div className="flex flex-wrap items-center gap-3">
                <RatingStars rating={review.rating} label={`${review.rating} out of 5 stars`} />
                <span className="text-sm text-[var(--muted)]">
                  {review.author} | {review.date}
                </span>
              </div>
              <p className="mb-0 mt-3 max-w-3xl whitespace-pre-wrap leading-relaxed text-[var(--ink)]">{review.text}</p>
              {myReviewQuery.data?.id === review.id && (
                <Button
                  variant="outlined"
                  type="button"
                  onClick={() => {
                    setEditingReviewId(review.id)
                    setReviewRating(review.rating)
                    setReviewComment(review.text)
                    document
                      .getElementById('review-form')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  <PencilIcon />
                  <span>Edit review</span>
                </Button>
              )}
              <ReviewAttachments media={review.media} />
            </article>
          ))}
          {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
            <p className="m-0 rounded-xl bg-[var(--surface)] px-4 py-5 text-sm text-[var(--muted)]">
              No reviews yet. Be the first to share your experience.
            </p>
          )}
        </div>
      </section>
      {showAll && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAll(false)
          }}
        >
          <aside
            className="relative h-dvh w-full max-w-lg overflow-y-auto bg-[var(--paper)] px-5 pb-8 pt-16 shadow-2xl sm:px-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-reviews-title"
          >
            <Button
              variant="outlined"
              sx={{ position: 'absolute', right: 2, top: 2, minWidth: 44, width: 44, height: 44, borderRadius: '50%', fontSize: 22 }}
              type="button"
              onClick={() => setShowAll(false)}
              aria-label="Close reviews"
            >
              {'\u00d7'}
            </Button>
            <h2 className="mb-5 text-3xl text-[var(--ink)]" id="all-reviews-title">All reviews</h2>
            {reviews.slice(0, limit).map((review) => (
              <article className="border-b border-[var(--line)] py-5 last:border-0" key={review.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <RatingStars rating={review.rating} label={`${review.rating} out of 5 stars`} />
                  <span className="text-sm text-[var(--muted)]">
                    {review.author} | {review.date}
                  </span>
                </div>
                <p className="mb-0 mt-3 max-w-3xl whitespace-pre-wrap leading-relaxed text-[var(--ink)]">{review.text}</p>
                {myReviewQuery.data?.id === review.id && (
                  <Button
                    variant="outlined"
                    type="button"
                    onClick={() => {
                      setEditingReviewId(review.id)
                      setReviewRating(review.rating)
                      setReviewComment(review.text)
                      document
                        .getElementById('review-form')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                  >
                    <PencilIcon />
                    <span>Edit review</span>
                  </Button>
                )}
                <ReviewAttachments media={review.media} />
              </article>
            ))}
            {limit < reviews.length && (
              <Button
                variant="outlined"
                type="button"
                onClick={() => setLimit((value) => value + 4)}
              >
                Load more reviews
              </Button>
            )}
          </aside>
        </div>
      )}
      <section className="mx-auto w-full max-w-[90rem] scroll-mt-28 border-t border-[var(--line)] px-4 py-10 md:px-8 md:py-14" id="review-form">
        <div className="w-full">
        <p className="eyebrow mb-2">{storefront.content.collection.reviewsLabel}</p>
        <h2 className="mb-3 text-3xl text-[var(--ink)] md:text-4xl">{storefront.content.reviews.title}</h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">Tell other shoppers what stood out. Your review helps people choose with confidence.</p>
        {signedIn ? (
        <form className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm md:p-8" onSubmit={submitReview}>
          <TextField
              select
              label={storefront.content.reviews.ratingLabel}
              disabled={reviewSaving}
              value={reviewRating}
              onChange={(event) => setReviewRating(Number(event.target.value))}
            >
              {[5, 4, 3, 2, 1].map((rating) => <MenuItem value={rating} key={rating}>{rating} / 5</MenuItem>)}
          </TextField>
          <TextField
              label={storefront.content.reviews.commentLabel}
              multiline
              minRows={5}
              maxRows={12}
              disabled={reviewSaving}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              required
              placeholder={storefront.content.reviews.commentPlaceholder}
              fullWidth
            />
          <TextField
              type="file"
              label="Photos or video"
              helperText="Up to 4 files, 1 MB each."
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { accept: 'image/jpeg,image/png,image/webp,video/mp4,video/webm', multiple: true } }}
              disabled={reviewSaving}
              onChange={(event) => {
                const input = event.target as HTMLInputElement
                const files = Array.from(input.files ?? [])
                  .filter((file) => file.size <= 1_000_000)
                  .slice(0, 4)
                setReviewFiles(files)
                if (files.length < (input.files?.length ?? 0))
                  notify(
                    'Some files were skipped. Each image or video must be under 1 MB, with up to 4 files.',
                  )
                input.value = ''
              }}
            />
          {reviewFiles.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Selected review files">
              {reviewFiles.map((file) => <li className="rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs text-[var(--muted)]" key={`${file.name}-${file.size}`}>{file.name}</li>)}
            </ul>
          )}
          <Button
            variant="contained"
            type="submit"
            fullWidth
            disabled={reviewSaving || !reviewComment.trim()}
            sx={{ alignSelf: 'flex-start', width: { sm: 'auto' }, minWidth: { sm: 224 } }}
          >
            {reviewSaving
              ? editingReviewId
                ? 'Updating...'
                : 'Saving...'
              : editingReviewId
                ? 'Update review'
                : storefront.content.reviews.submitLabel}
          </Button>
        </form>
        ) : (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm md:p-8">
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">Sign in to share a review after your purchase.</p>
            <Button component="a" variant="contained" fullWidth href="/login" onClick={onNavigate('/login')} sx={{ width: { sm: 'auto' }, minWidth: { sm: 224 } }}>
              Sign in to write a review
            </Button>
          </div>
        )}
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <Box component="section" aria-labelledby="related-products-title" sx={{ width: '100%', borderTop: '1px solid', borderColor: 'divider', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 4, md: 6 } }}>
          <Stack spacing={0.75} sx={{ mb: 3 }}>
            <Typography component="p" variant="overline" color="success.main" sx={{ m: 0, fontWeight: 700, letterSpacing: '.12em' }}>More to explore</Typography>
            <Typography component="h2" id="related-products-title" sx={{ m: 0, fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 500, letterSpacing: '-.035em' }}>More from {product.category}</Typography>
            <Typography color="text.secondary" variant="body2">A few more products from this category.</Typography>
          </Stack>
          <ProductGrid
            products={relatedProducts}
            currency={currency}
            addToCartLabel={storefront.content.collection.addToCartLabel}
            ratingLabel={storefront.content.collection.ratingLabel}
            reviewsLabel={storefront.content.collection.reviewsLabel}
            onAdd={onAdd}
            onOpenProduct={onOpenProduct}
          />
        </Box>
      )}
      {lightboxIndex !== null && availableMediaItems[lightboxIndex] && (
        <Dialog
          open
          onClose={() => setLightboxIndex(null)}
          maxWidth="xl"
          fullWidth
          aria-labelledby="product-media-title"
          sx={{
            '& .MuiDialog-paper': {
              width: 'min(1320px, calc(100% - 48px))',
              maxWidth: '1320px',
              height: 'min(900px, calc(100% - 48px))',
              maxHeight: '900px',
              overflow: 'hidden',
              '@media (max-width: 600px)': {
                width: '100%', maxWidth: '100%', height: '100dvh', maxHeight: '100dvh', margin: 0, borderRadius: 0,
              },
            },
          }}
        >
          <IconButton aria-label="Close product gallery" onClick={() => setLightboxIndex(null)} sx={{ position: 'absolute', zIndex: 2, top: 12, right: 12, width: 44, height: 44, bgcolor: 'background.paper' }}>{'\u00d7'}</IconButton>
          <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', height: '100%', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) 320px' }, gridTemplateRows: { xs: 'minmax(0,1fr) auto', md: 'minmax(0,1fr)' }, minHeight: 0 }}>
              <Box sx={{ display: 'flex', minWidth: 0, minHeight: 0, flexDirection: 'column', p: { xs: 2, sm: 3, md: 4 }, pr: { md: 3 }, gap: 2, overflowY: 'auto' }}>
                <Box sx={{ display: 'grid', flex: '1 1 auto', minHeight: { xs: 240, md: 360 }, placeItems: 'center', overflow: 'hidden', borderRadius: 2, bgcolor: '#17191b' }}>
                  {availableMediaItems[lightboxIndex].type === 'video' ? (
                    <video src={availableMediaItems[lightboxIndex].url} poster={availableMediaItems[lightboxIndex].posterUrl} controls autoPlay playsInline style={{ display: 'block', width: 'auto', height: 'min(62vh, 680px)', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <img src={availableMediaItems[lightboxIndex].url} alt={availableMediaItems[lightboxIndex].alt} onError={() => markImageFailed(availableMediaItems[lightboxIndex].id)} style={{ display: 'block', width: '100%', height: '100%', maxHeight: 'min(62vh, 680px)', objectFit: 'contain' }} />
                  )}
                </Box>
                <Stack spacing={1} sx={{ pr: { xs: 5, md: 0 } }}>
                  <Typography id="product-media-title" component="h2" sx={{ m: 0, fontSize: { xs: 20, md: 25 }, fontWeight: 700, lineHeight: 1.25 }}>{product.name}</Typography>
                  {product.description?.trim() && <Typography color="text.secondary" sx={{ m: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{product.description.trim()}</Typography>}
                </Stack>
              </Box>
              <Box sx={{ display: 'flex', minHeight: 0, flexDirection: 'column', borderLeft: { md: '1px solid' }, borderTop: { xs: '1px solid', md: 0 }, borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Stack direction="row" sx={{ pl: 2, pr: 8, py: 1.5, alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Typography component="h3" sx={{ m: 0, fontSize: 15, fontWeight: 750 }}>Product media</Typography>
                  <Typography variant="caption" color="text.secondary">{lightboxIndex + 1} / {availableMediaItems.length}</Typography>
                </Stack>
                <Stack role="list" aria-label="Product images and videos" spacing={1} sx={{ minHeight: 0, overflowY: { xs: 'hidden', md: 'auto' }, overflowX: { xs: 'auto', md: 'hidden' }, p: 1.5, pt: 0, flexDirection: { xs: 'row', md: 'column' } }}>
                  {availableMediaItems.map((item, index) => (
                    <Button key={item.id} role="listitem" variant={index === lightboxIndex ? 'contained' : 'text'} onClick={() => setLightboxIndex(index)} aria-label={`Show ${item.type === 'video' ? 'video' : 'image'} ${index + 1}: ${item.alt || product.name}`} aria-current={index === lightboxIndex ? 'true' : undefined} sx={{ display: 'grid', flex: { xs: '0 0 112px', md: '0 0 auto' }, gridTemplateColumns: { xs: '1fr', md: '104px minmax(0,1fr)' }, gap: 1.25, alignItems: 'center', minWidth: { xs: 112, md: 0 }, minHeight: { xs: 100, md: 84 }, p: 1, textAlign: 'left', justifyContent: 'stretch', color: 'text.primary', bgcolor: index === lightboxIndex ? 'action.selected' : 'background.paper', border: '1px solid', borderColor: index === lightboxIndex ? 'primary.main' : 'divider' }}>
                      {item.type === 'video' ? <video src={item.url} poster={item.posterUrl} muted playsInline preload="metadata" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 6, background: '#17191b' }} /> : <img src={item.url} alt="" loading="lazy" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 6, background: '#f3f0e9' }} />}
                      <Typography component="span" variant="caption" sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: index === lightboxIndex ? 700 : 500 }}>{item.type === 'video' ? 'Video' : 'Image'} {index + 1} / {item.alt || product.name}</Typography>
                    </Button>
                  ))}
                </Stack>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}
