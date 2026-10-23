import { readWishlist, toggleWishlistItem, wishlistPending } from '../api/wishlistState'
import type { StorefrontApiResponse } from '../api/storefront'
import { Copy, Facebook, Heart, Instagram, MoreVertical, Share2, Youtube } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AddToCartButton } from './AddToCartButton'
import { RatingStars } from './RatingStars'
import { useNotification } from './NotificationProvider'
import { updateCart } from '../api/cart'
import { Box } from './mui/Box'
import { Card } from './mui/Card'
import { CardContent } from './mui/CardContent'
import { Chip } from './mui/Chip'
import { IconButton } from './mui/IconButton'
import { Menu } from './mui/Menu'
import { MenuItem } from './mui/MenuItem'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'
import { productAvailability } from './productAvailability'
import { copyProductLink, facebookProductShareUrl, productPublicUrl, shareProductLink } from '../api/productSharing'

type ProductCardProps = {
  product: StorefrontApiResponse['products'][number]
  currency: Intl.NumberFormat
  addToCartLabel: string
  ratingLabel: string
  reviewsLabel: string
  onAdd: (productId: string) => Promise<void>
  onOpen: () => void
  quantity?: number
  isCartLoading?: boolean
  isCartUpdating?: boolean
  cartPendingAction?: 'adding' | 'removing' | 'updating'
}

export function ProductCard({
  product,
  currency,
  addToCartLabel,
  ratingLabel,
  reviewsLabel,
  onAdd,
  onOpen,
  quantity = 0,
  isCartLoading = false,
  isCartUpdating = false,
  cartPendingAction,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(() => readWishlist().includes(product.id))
  const [actionLocked, setActionLocked] = useState(() => wishlistPending(product.id))
  const [shareAnchor, setShareAnchor] = useState<HTMLElement | null>(null)
  const { t } = useTranslation('common')

  useEffect(() => {
    const sync = () => {
      setWishlisted(readWishlist().includes(product.id))
      setActionLocked(wishlistPending(product.id))
    }
    window.addEventListener('wishlistchange', sync)
    return () => window.removeEventListener('wishlistchange', sync)
  }, [product.id])

  const notify = useNotification()
  const shareUrl = productPublicUrl(product.id)
  const copyLink = async (platform?: string) => {
    setShareAnchor(null)
    const copied = await copyProductLink(shareUrl)
    if (!copied) {
      notify(t('productLinkCopyFailed'))
      return
    }
    notify(platform ? t('productLinkCopiedForPlatform', { platform }) : t('productLinkCopied'), 'success')
  }
  const shareWithApps = async () => {
    setShareAnchor(null)
    const result = await shareProductLink({ id: product.id, name: product.name })
    if (result === 'copied') notify(t('productLinkCopied'), 'success')
    if (result === 'failed') notify(t('productLinkCopyFailed'))
  }
  const shareOnFacebook = () => {
    setShareAnchor(null)
    window.open(facebookProductShareUrl(shareUrl), '_blank', 'noopener,noreferrer')
  }
  const toggleWishlist = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try {
      await toggleWishlistItem(product.id)
    } catch (error) {
      notify(error instanceof Error ? error : 'Unable to update your wishlist.')
    }
  }

  const primaryImage = product.media.images.find((image) => image.isPrimary)
  const shortDescription = product.description?.trim()
  const displayColors = product.colors?.filter(
    (color) => color.trim() && color.trim().toLowerCase() !== 'default',
  ) ?? []
  const decreaseQuantity = () =>
    updateCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        priceMinor: product.priceMinor ?? Math.round(product.price * 100),
      },
      Math.max(0, quantity - 1),
      'set',
    )

  return (
    <Card
      component="article"
      tabIndex={0}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('[data-product-open]')) onOpen()
      }}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onOpen()
        }
      }}
      sx={{
        display: 'flex',
        width: '100%',
        maxWidth: 280,
        minWidth: 0,
        height: '100%',
        flexDirection: 'column',
        justifySelf: 'center',
        p: 1,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': { transform: 'translateY(-2px)', borderColor: 'rgba(40,49,59,.3)', boxShadow: '0 12px 28px rgba(37,40,33,.1)' },
        '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.dark', outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 1.25, backgroundColor: '#e7eadf' }}>
        {product.badge?.trim() && (
          <Chip
            label={product.badge}
            size="small"
            sx={{ position: 'absolute', zIndex: 1, top: 1, left: 1, maxWidth: '90%', height: 28, backgroundColor: 'rgba(255,254,250,.94)', color: 'text.primary', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', boxShadow: '0 1px 4px rgba(37,40,33,.12)' }}
          />
        )}
        {primaryImage ? (
          <Box
            data-product-open
            component="img"
            src={primaryImage.url}
            alt={primaryImage.alt}
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
          />
        ) : (
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', width: '42%', height: '52%', top: '24%', left: '29%', borderRadius: '48% 48% 18% 18%', backgroundColor: '#ebeee4', boxShadow: '23px 18px 0 rgba(36,92,75,.26)', transform: 'rotate(-7deg)' }}
          />
        )}
        <IconButton
          aria-label={t('shareProduct')}
          aria-haspopup="menu"
          aria-expanded={Boolean(shareAnchor)}
          onClick={(event) => {
            event.stopPropagation()
            setShareAnchor(event.currentTarget)
          }}
          sx={{
            position: 'absolute',
            zIndex: 2,
            top: 8,
            right: 8,
            border: '1px solid rgba(37,40,33,.12)',
            backgroundColor: 'rgba(255,254,250,.96)',
            color: 'text.primary',
            boxShadow: '0 2px 8px rgba(37,40,33,.16)',
            '&:hover': { backgroundColor: '#fff' },
          }}
        >
          <MoreVertical aria-hidden="true" size={20} />
        </IconButton>
        <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={() => setShareAnchor(null)}>
          <MenuItem onClick={shareOnFacebook}><Facebook aria-hidden="true" size={18} />{t('shareOnFacebook')}</MenuItem>
          <MenuItem onClick={() => void copyLink('Instagram')}><Instagram aria-hidden="true" size={18} />{t('copyForInstagram')}</MenuItem>
          <MenuItem onClick={() => void copyLink('YouTube')}><Youtube aria-hidden="true" size={18} />{t('copyForYouTube')}</MenuItem>
          <MenuItem onClick={() => void shareWithApps()}><Share2 aria-hidden="true" size={18} />{t('moreShareOptions')}</MenuItem>
          <MenuItem onClick={() => void copyLink()}><Copy aria-hidden="true" size={18} />{t('copyLink')}</MenuItem>
        </Menu>
      </Box>

      <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 1, px: 1, pt: 1.5, pb: 1, '&:last-child': { pb: 1 } }}>
        <Typography component="p" noWrap sx={{ m: 0, color: 'text.secondary', fontSize: 12, fontWeight: 700, lineHeight: 1.35, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          {product.category}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ minHeight: 48, alignItems: 'flex-start' }}>
          <Typography
            data-product-open
            component="h3"
            title={product.name}
            sx={{
              display: '-webkit-box',
              minWidth: 0,
              flex: 1,
              m: 0,
              overflow: 'hidden',
              color: 'success.dark',
              fontSize: { xs: 16, sm: 17 },
              fontWeight: 650,
              lineHeight: 1.35,
              overflowWrap: 'anywhere',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              cursor: 'pointer',
            }}
          >
            {product.name}
          </Typography>
          <IconButton
            aria-label={actionLocked ? 'Updating wishlist' : wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
            aria-busy={actionLocked}
            disabled={actionLocked}
            onClick={toggleWishlist}
            sx={{ flexShrink: 0, mt: -0.75, color: wishlisted ? 'error.main' : 'text.secondary', border: '1px solid', borderColor: wishlisted ? 'rgba(180,35,24,.24)' : 'divider', backgroundColor: wishlisted ? 'rgba(180,35,24,.05)' : 'transparent', '&:hover': { color: 'error.main', backgroundColor: 'rgba(180,35,24,.06)' }, '&:disabled': { animation: 'pulse 1.4s ease-in-out infinite' } }}
          >
            <Heart aria-hidden="true" size={17} fill={wishlisted ? 'currentColor' : 'none'} />
          </IconButton>
        </Stack>
        {shortDescription && (
          <Typography
            component="p"
            title={shortDescription}
            sx={{
              display: '-webkit-box',
              m: 0,
              minHeight: 40,
              overflow: 'hidden',
              color: 'text.secondary',
              fontSize: 14,
              lineHeight: 1.5,
              overflowWrap: 'anywhere',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {shortDescription}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ minHeight: 44, alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
          <Box sx={{ display: 'grid', minWidth: 0, flex: 1, alignContent: 'center', gap: 0.5 }}>
            <Typography component="strong" sx={{ color: 'text.primary', fontSize: 'clamp(20px,1.5vw,23px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-.025em', overflowWrap: 'anywhere' }}>
              {currency.format(product.price)}
            </Typography>
            {product.compareAtPriceMinor != null && product.priceMinor != null && product.compareAtPriceMinor > product.priceMinor && (
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography component="del" sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {currency.format(product.compareAtPriceMinor / 100)}
                </Typography>
                <Chip
                  label={`${Math.round(((product.compareAtPriceMinor - product.priceMinor) / product.compareAtPriceMinor) * 100)}% off`}
                  size="small"
                  color="success"
                  sx={{ height: 24, fontSize: 12 }}
                />
              </Stack>
            )}
          </Box>
          {typeof product.stock === 'number' && (
            <Chip {...(product.stock <= 0 ? productAvailability(product.stock) : product.purchase?.available === false && product.seller && !product.seller.isPlatform ? { label: 'Offer pending', color: 'warning' as const } : productAvailability(product.stock))} size="small" sx={{ flexShrink: 0, minHeight: 28, height: 'auto', fontSize: 12, fontWeight: 650, '& .MuiChip-label': { px: 1.25, py: 0.5 } }} />
          )}
        </Stack>
        <Box
          aria-label={product.reviewCount > 0 ? `${ratingLabel}: ${product.rating}, ${product.reviewCount} ${reviewsLabel}` : 'No reviews yet'}
          sx={{ display: 'flex', width: 'fit-content', maxWidth: '100%', minHeight: 32, alignItems: 'center', gap: 0.75, borderRadius: 999, px: 1, py: 0.5, backgroundColor: 'rgba(215,225,208,.42)', fontSize: 12, lineHeight: 1.3 }}
        >
          {product.reviewCount > 0 ? (
            <>
              <RatingStars rating={product.rating} />
              <Typography component="b" sx={{ flexShrink: 0, fontSize: 12, fontWeight: 700 }}>{product.rating.toFixed(1)}</Typography>
              <Typography component="span" noWrap sx={{ color: 'text.secondary', fontSize: 12 }}>
                ({product.reviewCount} {reviewsLabel})
              </Typography>
            </>
          ) : (
            <Typography component="span" sx={{ color: 'text.secondary', fontSize: 12 }}>No reviews yet</Typography>
          )}
        </Box>
        {displayColors.length > 0 && (
          <Stack direction="row" spacing={1} aria-label={`Available colors: ${displayColors.join(', ')}`} sx={{ minHeight: 24, alignItems: 'center', pb: 0.5 }}>
            {displayColors.map((color) => (
              <Box
                component="span"
                sx={{ width: 18, height: 18, flexShrink: 0, border: '1px solid rgba(37,40,33,.2)', borderRadius: '50%' }}
                style={{ backgroundColor: product.colorValues?.[color] ?? color.toLowerCase() }}
                key={color}
                title={color}
                aria-label={color}
              />
            ))}
          </Stack>
        )}
        <Box sx={{ mt: 'auto', pt: 0.5 }}>
          <AddToCartButton
            unavailableReason={typeof product.stock === 'number' && product.stock <= 0 ? 'Out of stock' : product.purchase?.available === false ? product.purchase.reason ?? 'Currently unavailable' : undefined}
            productId={product.id}
            onAdd={onAdd}
            label={addToCartLabel}
            quantity={quantity}
            isCartLoading={isCartLoading}
            isUpdating={isCartUpdating}
            pendingAction={cartPendingAction}
            onDecrease={decreaseQuantity}
            fullWidth
          />
        </Box>
      </CardContent>
    </Card>
  )
}
