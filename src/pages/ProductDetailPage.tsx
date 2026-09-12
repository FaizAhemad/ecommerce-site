import { useNotification } from '../components/NotificationProvider'
import { AddToCartButton } from '../components/AddToCartButton'
import { apiFetch as fetch, LONG_RUNNING_API_TIMEOUT_MS } from '../api/http'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { getProduct, type StorefrontApiResponse } from '../api/storefront'
import { queryClient } from '../api/queryClient'

type ReviewMedia = { id: string; url: string }

function PencilIcon() {
  return <svg className="review-edit-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5-.8 3.8 3.8-.8L18.3 8.2l-3.5-3.5L4 16.5Z" /><path d="m13.5 6 3.5 3.5M4 20.3h16" /></svg>
}

function ReviewAttachments({ media }: { media: ReviewMedia[] }) {
  if (!media.length) return null
  return <div className="review-attachments" aria-label="Review photos and videos">
    {media.map((item, index) => /\.(mp4|webm)(?:[?#]|$)/i.test(item.url)
      ? <video key={item.id} src={item.url} controls playsInline preload="metadata" aria-label={`Review video ${index + 1}`} />
      : <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Open review photo ${index + 1}`}><img src={item.url} alt={`Review photo ${index + 1}`} loading="lazy" /></a>)}
  </div>
}

type Props = {
  storefront: StorefrontApiResponse
  productId: string
  onAdd: (productId: string) => Promise<void>
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

const reviewCopy = ['Beautifully made and exactly as pictured.', 'A thoughtful product that fits perfectly into daily use.', 'The quality is excellent and delivery was smooth.', 'The quality is excellent and delivery was smooth.']

export function ProductDetailPage({ storefront, productId, onAdd, onNavigate }: Props) {
  const catalogProduct = storefront.products.find((item) => item.id === productId)
  const productQuery = useQuery({ queryKey: ['product', productId], queryFn: () => getProduct(productId), enabled: !catalogProduct })
  const productLoading = !catalogProduct && productQuery.isLoading
  const productError = !catalogProduct && productQuery.isError
  const product = catalogProduct ?? productQuery.data ?? null
  const [showAll, setShowAll] = useState(false)
  const [limit, setLimit] = useState(4)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [reviewSaving, setReviewSaving] = useState(false)
  const reviewSavingRef = useRef(false)
  const notify = useNotification()
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const reviewsQuery = useQuery({ queryKey: ['product-reviews', productId], queryFn: async () => { const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`); if (!response.ok) throw new Error('Unable to load reviews'); const body = await response.json() as { reviews?: Array<{ id: string; rating: number; body?: string | null; createdAt: string; media?: ReviewMedia[]; user?: { name?: string | null } }> }; return (body.reviews ?? []).map((review) => ({ id: review.id, rating: review.rating, text: review.body ?? '', author: review.user?.name ?? 'Customer', date: new Date(review.createdAt).toLocaleDateString(), media: review.media ?? [] })) }, staleTime: 30_000 })
  const myReviewQuery = useQuery({ queryKey: ['my-review', productId], queryFn: async () => { const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews/mine`); if (response.status === 401 || response.status === 404) return null; if (!response.ok) throw new Error('Unable to load your review'); const body = await response.json() as { review?: { id: string; rating: number; body?: string | null } | null }; return body.review ?? null }, staleTime: 30_000 })
  const [selected, setSelected] = useState<{ type: 'image' | 'video'; id: string } | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    document.body.style.overflow = showAll ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showAll])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowLeft') setLightboxIndex((current) => current === null ? null : (current - 1 + mediaItems.length) % mediaItems.length)
      if (event.key === 'ArrowRight') setLightboxIndex((current) => current === null ? null : (current + 1) % mediaItems.length)
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow }
  }, [lightboxIndex])

  const generatedReviews = useMemo(() => product ? Array.from({ length: Math.min(product.reviewCount, 12) }, (_, i) => ({
    id: `${product.id}-${i}`,
    rating: Math.max(1, Math.min(5, Math.round(product.rating + ((i % 3) - 1) * .3))),
    text: reviewCopy[i % reviewCopy.length],
    author: ['Aarav', 'Maya', 'Rohan', 'Isha'][i % 4],
    media: [] as ReviewMedia[],
    date: `${i + 1} ${i % 2 ? 'weeks' : 'months'} ago`,
  })) : [], [product])
  const serverReviews = reviewsQuery.data ?? []
  const reviews = serverReviews.length ? serverReviews : generatedReviews

  if (productLoading) return <section className="page-section state-panel" aria-busy="true"><p className="eyebrow">{storefront.content.ui.loadingLabel}</p><h1>Loading product…</h1></section>
  if (!product) return <section className="page-section state-panel product-unavailable" aria-live="polite">
    <p className="eyebrow">{productError ? 'Connection problem' : 'Product unavailable'}</p>
    <h1>{productError ? 'Unable to load this product.' : 'Product not found.'}</h1>
    <p className="hero-text">{productError ? 'We could not reach the store. Please try again in a moment.' : 'This product may have been removed or the link may be incorrect.'}</p>
    <div className="error-actions">
      {productError && <button className="primary-button" type="button" onClick={() => { void productQuery.refetch() }}>Try again</button>}
      <a className="secondary-button" href="/products" onClick={onNavigate('/products')}>Browse products</a>
    </div>
  </section>

  const initialImage = product.media.images.find((image) => image.isPrimary) ?? product.media.images[0]
  const initialVideo = product.media.videos[0]
  const mediaItems = [...product.media.images.map((item) => ({ type: 'image' as const, id: item.id, url: item.url, alt: item.alt })), ...product.media.videos.map((item) => ({ type: 'video' as const, id: item.id, url: item.url, posterUrl: item.posterUrl, alt: item.alt }))]
  const selectedImage = selected?.type === 'image' ? product.media.images.find((item) => item.id === selected.id) : selected ? undefined : initialImage
  const selectedVideo = selected?.type === 'video' ? product.media.videos.find((item) => item.id === selected.id) : !selected && !initialImage ? initialVideo : undefined
  const total = reviews.length || 1
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: reviews.filter((item) => item.rating === rating).length }))
  const currency = new Intl.NumberFormat(storefront.localization.locale, { style: 'currency', currency: storefront.localization.currency, maximumFractionDigits: 0 })
  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (reviewSavingRef.current || !reviewComment.trim()) return
    reviewSavingRef.current = true
    setReviewSaving(true)
    try {
      const urls: string[] = []
      for (const file of reviewFiles) {
        const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
        const upload = await fetch(`/api/products/${encodeURIComponent(productId)}/review-upload`, { timeoutMs: LONG_RUNNING_API_TIMEOUT_MS, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, filename: file.name, contentType: file.type }) })
        if (!upload.ok) { const failure = await upload.json().catch(() => null) as { error?: { message?: string } } | null; throw new Error(failure?.error?.message ?? 'Review media could not be uploaded.') }
        urls.push((await upload.json() as { url: string }).url)
      }
      const endpoint = editingReviewId ? `/api/products/${encodeURIComponent(productId)}/reviews/mine` : `/api/products/${encodeURIComponent(productId)}/reviews`; const response = await fetch(endpoint, { method: editingReviewId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: reviewRating, body: reviewComment.trim(), media: urls }) })
      if (!response.ok) { const failure = await response.json().catch(() => null) as { error?: { message?: string } } | null; throw new Error(failure?.error?.message ?? (response.status === 401 ? 'Please sign in to submit a review.' : 'Your review could not be saved. Please try again.')) }
      const body = await response.json() as { review?: { id: string; rating: number; body?: string | null; createdAt: string; media?: ReviewMedia[] } }
      if (body.review) { const nextReview = { id: body.review.id, rating: body.review.rating, text: body.review.body ?? '', author: 'You', date: new Date(body.review.createdAt).toLocaleDateString(), media: body.review.media ?? urls.map((url) => ({ id: url, url })) }; queryClient.setQueryData<Array<{ id: string; rating: number; text: string; author: string; date: string; media: ReviewMedia[] }>>(['product-reviews', productId], (current = []) => current.some((item) => item.id === nextReview.id) ? current.map((item) => item.id === nextReview.id ? nextReview : item) : [nextReview, ...current]); queryClient.setQueryData(['my-review', productId], { id: nextReview.id, rating: nextReview.rating, body: nextReview.text }) }
      setReviewFiles([]); if (!editingReviewId) { setReviewComment(''); setReviewRating(5) }; notify(storefront.content.reviews.successLabel, 'success')
    } catch (error) { notify(error instanceof Error ? error : 'Your review could not be saved. Please try again.') } finally { reviewSavingRef.current = false; setReviewSaving(false) }
  }

  return <>
    <section className="detail-section page-section">
      <div className="detail-gallery">
        <div className={`detail-art product-art ${product.tone}`}>
          <div className="detail-media-viewport">
            {selectedVideo ? <video className="product-primary-video" src={selectedVideo.url} poster={selectedVideo.posterUrl} controls playsInline onClick={() => setLightboxIndex(mediaItems.findIndex((item) => item.type === 'video' && item.id === selectedVideo.id))} /> : selectedImage ? <img className="product-primary-image" src={selectedImage.url} alt={selectedImage.alt} onClick={() => setLightboxIndex(mediaItems.findIndex((item) => item.type === 'image' && item.id === selectedImage.id))} /> : <div className="product-shape" />}
          </div>
        </div>
        {(product.media.images.length > 0 || product.media.videos.length > 0) && <div className="media-rail" aria-label={`${storefront.content.detail.imagesLabel} and ${storefront.content.detail.videosLabel}`}>
          {product.media.images.map((item, index) => <button className={`media-thumb${selectedImage?.id === item.id ? ' selected' : ''}`} type="button" key={item.id} onClick={() => { setSelected({ type: 'image', id: item.id }); setLightboxIndex(index) }}><img src={item.url} alt={item.alt} /></button>)}
          {product.media.videos.map((item, index) => <button className={`media-thumb media-video${selectedVideo?.id === item.id ? ' selected' : ''}`} type="button" key={item.id} onClick={() => { setSelected({ type: 'video', id: item.id }); setLightboxIndex(product.media.images.length + index) }} aria-label={item.alt || storefront.content.detail.videosLabel}><video src={item.url} poster={item.posterUrl} muted playsInline preload="metadata" /></button>)}
        </div>}
        {product.media.images.length === 0 && product.media.videos.length === 0 && <p className="detail-muted">{storefront.content.detail.noMediaLabel}</p>}
      </div>
      <div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><div className="detail-rating" aria-label={`${product.rating.toFixed(1)} out of 5 from ${product.reviewCount} reviews`}><span aria-hidden="true">★★★★★</span><strong>{product.rating.toFixed(1)}</strong><span>({product.reviewCount} reviews)</span></div><p className="detail-price">{currency.format(product.price)}</p><p className="detail-description">{storefront.identity.tagline} Designed for everyday use, with considered details and a finish that feels good to live with.</p>{product.colors && product.colors.length > 0 && <div className="detail-colors"><p className="detail-label">Available colors</p><div className="detail-color-list">{product.colors.map((color) => <span className={`color-swatch color-${color.toLowerCase()}`} style={{ backgroundColor: product.colorValues?.[color] ?? color.toLowerCase() }} title={color} aria-label={color} key={color} />)}</div></div>}<div className="detail-benefits"><p>✓ Carefully checked before dispatch</p><p>✓ Secure checkout and delivery support</p><p>✓ Easy help from our customer care team</p></div><AddToCartButton productId={product.id} onAdd={onAdd} label={storefront.content.collection.addToCartLabel} className="primary-button" /></div>
    </section>
    <section className="ratings-panel"><h2>Product ratings &amp; reviews</h2><div className="ratings-summary"><div className="average-rating"><strong>{product.rating.toFixed(1)}</strong><span>★</span><p>{product.reviewCount} ratings<br />{reviews.length} reviews</p></div><div className="rating-bars">{distribution.map(({ rating, count }) => <div className="rating-bar" key={rating}><span>{rating} ★</span><div><i style={{ width: `${count ? Math.max(count / total * 100, 8) : 0}%` }} /></div><b>{count}</b></div>)}</div></div><div className="latest-reviews"><div className="reviews-heading"><h3>Latest reviews</h3><button className="secondary-button" type="button" onClick={() => setShowAll(true)}>View all reviews</button></div>{reviews.slice(0, 3).map((review) => <article className="review-item" key={review.id}><div><strong>{'★'.repeat(review.rating)}</strong><span>{review.author} · {review.date}</span></div><p>{review.text}</p>{myReviewQuery.data?.id === review.id && <button className="secondary-button review-edit-button" type="button" aria-label="Edit review" title="Edit review" onClick={() => { setEditingReviewId(review.id); setReviewRating(review.rating); setReviewComment(review.text); document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><PencilIcon /></button>}<ReviewAttachments media={review.media} /></article>)}</div></section>
    {showAll && <div className="review-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAll(false) }}><aside className="review-drawer" role="dialog" aria-modal="true" aria-labelledby="all-reviews-title"><button className="drawer-close" type="button" onClick={() => setShowAll(false)} aria-label="Close reviews">×</button><h2 id="all-reviews-title">All reviews</h2>{reviews.slice(0, limit).map((review) => <article className="review-item" key={review.id}><div><strong>{'★'.repeat(review.rating)}</strong><span>{review.author} · {review.date}</span></div><p>{review.text}</p>{myReviewQuery.data?.id === review.id && <button className="secondary-button review-edit-button" type="button" aria-label="Edit review" title="Edit review" onClick={() => { setEditingReviewId(review.id); setReviewRating(review.rating); setReviewComment(review.text); document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><PencilIcon /></button>}<ReviewAttachments media={review.media} /></article>)}{limit < reviews.length && <button className="secondary-button" type="button" onClick={() => setLimit((value) => value + 4)}>Load more reviews</button>}</aside></div>}
    <section className="review-section" id="review-form"><p className="eyebrow">{storefront.content.collection.reviewsLabel}</p><h2>{storefront.content.reviews.title}</h2><form className="review-form" onSubmit={submitReview}><label>{storefront.content.reviews.ratingLabel}<select disabled={reviewSaving} value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}><option value="5">5 / 5</option><option value="4">4 / 5</option><option value="3">3 / 5</option><option value="2">2 / 5</option><option value="1">1 / 5</option></select></label><label>{storefront.content.reviews.commentLabel}<textarea disabled={reviewSaving} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} required rows={5} placeholder={storefront.content.reviews.commentPlaceholder} /></label><label className="review-upload-label">Photos or video <input disabled={reviewSaving} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 1_000_000).slice(0, 4); setReviewFiles(files); if (files.length < (event.target.files?.length ?? 0)) notify('Some files were skipped. Each image or video must be under 1 MB, with up to 4 files.'); event.currentTarget.value = '' }} /></label>{reviewFiles.length > 0 && <p className="review-file-list">{reviewFiles.map((file) => file.name).join(', ')}</p>}<button className="primary-button" type="submit" disabled={reviewSaving || !reviewComment.trim()}>{reviewSaving ? (editingReviewId ? 'Updating…' : 'Saving…') : (editingReviewId ? 'Update review' : storefront.content.reviews.submitLabel)}</button></form></section>
    {lightboxIndex !== null && mediaItems[lightboxIndex] && <div className="media-lightbox" role="dialog" aria-modal="true" aria-label="Product media preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxIndex(null) }}><button className="media-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close media preview">×</button><button className="media-lightbox-arrow media-lightbox-prev" type="button" onClick={() => setLightboxIndex((lightboxIndex - 1 + mediaItems.length) % mediaItems.length)} aria-label="Previous media">‹</button><div className="media-lightbox-content">{mediaItems[lightboxIndex].type === 'video' ? <video src={mediaItems[lightboxIndex].url} poster={mediaItems[lightboxIndex].posterUrl} controls autoPlay playsInline /> : <img src={mediaItems[lightboxIndex].url} alt={mediaItems[lightboxIndex].alt} />}<p>{lightboxIndex + 1} / {mediaItems.length}</p></div><button className="media-lightbox-arrow media-lightbox-next" type="button" onClick={() => setLightboxIndex((lightboxIndex + 1) % mediaItems.length)} aria-label="Next media">›</button></div>}
  </>
}

