import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { ArrowIcon } from '../components/ArrowIcon'
import { PromoCarousel } from '../components/PromoCarousel'
import { ProductGrid } from '../components/ProductGrid'
import { SubscribeSection } from '../components/SubscribeSection'
import { Box } from '../components/mui/Box'
import { Button } from '../components/mui/Button'
import { Card } from '../components/mui/Card'
import { CardContent } from '../components/mui/CardContent'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

type HomePageProps = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
  onAdd: (productId: string) => Promise<void>
  onOpenProduct: (id: string) => void
}

const pageSx = {
  width: '100%',
  maxWidth: '90rem',
  mx: 'auto',
  px: { xs: 2, md: 4 },
}

const overlineSx = {
  mb: 1,
  color: 'text.secondary',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  lineHeight: 1.4,
  textTransform: 'uppercase' as const,
}

const sectionTitleSx = {
  m: 0,
  fontSize: 'clamp(1.7rem, 3vw, 2.35rem)',
  fontWeight: 500,
  lineHeight: 1.12,
  letterSpacing: '-0.04em',
}

const categoryCardTones = [
  { background: '#F0F6EC', border: '#D9E6D0', hover: '#E9F1E2' },
  { background: '#EDF4FA', border: '#D4E2EF', hover: '#E5EFF8' },
  { background: '#F3F0F8', border: '#E0D9EC', hover: '#ECE7F4' },
  { background: '#FFF4E8', border: '#F1E0C9', hover: '#FCEBD8' },
  { background: '#FBEFF0', border: '#EED9DC', hover: '#F7E6E8' },
]

export function HomePage({ storefront, onNavigate, onAdd, onOpenProduct }: HomePageProps) {
  const { hero, collection, story } = storefront.content
  const currency = new Intl.NumberFormat(storefront.localization.locale, {
    style: 'currency',
    currency: storefront.localization.currency,
    maximumFractionDigits: 0,
  })
  const featured = storefront.products.slice(0, 8)
  const moreProducts = storefront.products.slice(8, 16)
  const hasProducts = storefront.products.length > 0
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
    <Stack component="main" spacing={{ xs: 5, md: 8 }} sx={{ pb: { xs: 6, md: 10 } }}>
      <Box
        component="section"
        aria-labelledby="hero-title"
        sx={{
          ...pageSx,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, .95fr) minmax(0, 1.05fr)' },
          alignItems: 'center',
          gap: { xs: 3, md: 6 },
          pt: { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ alignItems: 'flex-start', py: { md: 4 } }}>
          <Typography component="p" sx={{ ...overlineSx, color: 'success.main', mb: 0 }}>
            {hero.eyebrow}
          </Typography>
          <Typography
            component="h1"
            id="hero-title"
            sx={{
              m: 0,
              maxWidth: 620,
              fontSize: 'clamp(2.65rem, 6.5vw, 5.6rem)',
              fontWeight: 500,
              lineHeight: 0.98,
              letterSpacing: '-0.065em',
              textWrap: 'balance',
            }}
          >
            {hero.title}
          </Typography>
          <Typography sx={{ maxWidth: 520, color: 'text.secondary', fontSize: { xs: 16, md: 18 } }}>
            {storefront.identity.tagline} {hero.description}
          </Typography>
          <Button
            component="a"
            href="/products"
            onClick={onNavigate('/products')}
            variant="contained"
            size="large"
            endIcon={<ArrowIcon direction="right" />}
            sx={{ minHeight: 48, px: 2.5 }}
          >
            {hero.actionLabel}
          </Button>
        </Stack>
        <Box
          sx={{
            position: 'relative',
            minWidth: 0,
            aspectRatio: { xs: '1.42', md: '1.6' },
            maxHeight: { xs: 320, sm: 380, md: 440 },
            width: '100%',
            maxWidth: { xs: 560, md: 'none' },
            justifySelf: { xs: 'center', md: 'stretch' },
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: { xs: 3, md: 4 },
            backgroundColor: '#e7eadf',
            boxShadow: '0 18px 48px rgba(37,40,33,.09)',
          }}
        >
          <Box
            component="img"
            src="/images/gadgify-curated-finds.jpg"
            alt={hero.artworkDescription}
            fetchPriority="high"
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 'auto 0 0',
              height: '22%',
              background: 'linear-gradient(transparent, rgba(37,40,33,.16))',
            }}
          />
        </Box>
      </Box>

      {categories.length > 0 && (
        <Box component="section" aria-labelledby="home-categories-title" sx={pageSx}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 2.5 }}
          >
            <Box>
              <Typography component="p" sx={{ ...overlineSx, color: 'success.main' }}>
                Find your kind of useful
              </Typography>
              <Typography component="h2" id="home-categories-title" sx={sectionTitleSx}>
                Shop by category
              </Typography>
            </Box>
            <Button
              component="a"
              href="/products"
              onClick={onNavigate('/products')}
              variant="text"
              endIcon={<ArrowIcon direction="right" />}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, px: 1 }}
            >
              View all products
            </Button>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: { xs: 1.5, md: 2 },
              '@media (min-width:600px)': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
              '@media (min-width:1000px)': { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
            }}
          >
            {categories.map((category, index) => {
              const path = `/products?category=${encodeURIComponent(category)}`
              const tone = categoryCardTones[index % categoryCardTones.length]
              return (
                <Card
                  component="a"
                  href={path}
                  onClick={onNavigate(path)}
                  key={category}
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    minHeight: { xs: 132, sm: 148 },
                    color: 'text.primary',
                    backgroundColor: tone.background,
                    borderColor: tone.border,
                    textDecoration: 'none',
                    transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
                    '&:hover': { borderColor: 'secondary.dark', backgroundColor: tone.hover, transform: 'translateY(-2px)' },
                    '&:focus-visible': { outline: '3px solid', outlineColor: 'secondary.dark', outlineOffset: 2 },
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
                  }}
                >
                  <CardContent sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography component="span" sx={{ ...overlineSx, display: 'block', mb: 1, fontSize: 9 }}>
                        {`0${index + 1} / CATEGORY`}
                      </Typography>
                      <Typography component="span" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.35 }}>
                        {category}
                      </Typography>
                      <Typography component="span" sx={{ display: 'block', mt: 0.75, color: 'text.secondary', fontSize: 12, lineHeight: 1.5 }}>
                        {categoryDescriptions[category] ?? 'Explore useful everyday finds.'}
                      </Typography>
                    </Box>
                    <Typography component="span" aria-hidden="true" sx={{ flexShrink: 0, color: 'text.secondary', fontSize: 22, transition: 'transform 160ms ease', 'a:hover &': { transform: 'translateX(4px)' } }}>
                      →
                    </Typography>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Box>
      )}

      {storefront.content.promotions.length > 0 && (
        <Box sx={pageSx}>
          <PromoCarousel
            promos={storefront.content.promotions}
            previousLabel={collection.carouselPreviousLabel}
            nextLabel={collection.carouselNextLabel}
            exploreLabel={hero.actionLabel}
            onExplore={onNavigate('/products')}
          />
        </Box>
      )}

      <Box component="section" aria-labelledby="featured-products-title" sx={pageSx}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography component="p" sx={{ ...overlineSx, color: 'success.main' }}>Everyday essentials</Typography>
            <Typography component="h2" id="featured-products-title" sx={sectionTitleSx}>A few good finds</Typography>
          </Box>
          <Typography sx={{ maxWidth: 420, color: 'text.secondary', fontSize: 14 }}>
            Useful pieces to make everyday tasks a little easier.
          </Typography>
        </Stack>
        {hasProducts ? (
          <>
            <ProductGrid
              products={featured}
              currency={currency}
              addToCartLabel={collection.addToCartLabel}
              ratingLabel={collection.ratingLabel}
              reviewsLabel={collection.reviewsLabel}
              onAdd={onAdd}
              onOpenProduct={onOpenProduct}
            />
            <Button component="a" href="/products" onClick={onNavigate('/products')} variant="contained" endIcon={<ArrowIcon direction="right" />} sx={{ mt: 3, minHeight: 48 }}>
              Explore all products
            </Button>
          </>
        ) : (
          <Card variant="outlined" role="status" sx={{ p: { xs: 2.5, md: 4 }, textAlign: 'center', backgroundColor: 'background.paper' }}>
            <Typography component="h3" sx={{ mb: 0.75, fontSize: 18, fontWeight: 650 }}>
              Our collection is being refreshed
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              There are no products to browse right now. Please check back soon.
            </Typography>
          </Card>
        )}
      </Box>

      <Card
        component="section"
        aria-labelledby="home-story-title"
        sx={{
          ...pageSx,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'center',
          gap: { xs: 1.5, md: 5 },
          py: { xs: 3, md: 5 },
          background: 'linear-gradient(110deg, #eff1e8, #fffefa 76%)',
          boxShadow: 'none',
        }}
      >
        <Box>
          <Typography component="p" sx={{ ...overlineSx, color: 'success.main' }}>{story.eyebrow}</Typography>
          <Typography component="h2" id="home-story-title" sx={sectionTitleSx}>{story.title}</Typography>
        </Box>
        <Typography sx={{ maxWidth: 590, color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
          {story.description}
        </Typography>
      </Card>

      {hasProducts && moreProducts.length > 0 && (
        <Box component="section" aria-labelledby="more-products-title" sx={pageSx}>
          <Box sx={{ mb: 2.5 }}>
            <Typography component="p" sx={{ ...overlineSx, color: 'success.main' }}>More to explore</Typography>
            <Typography component="h2" id="more-products-title" sx={sectionTitleSx}>More useful finds</Typography>
          </Box>
          <ProductGrid
            products={moreProducts}
            currency={currency}
            addToCartLabel={collection.addToCartLabel}
            ratingLabel={collection.ratingLabel}
            reviewsLabel={collection.reviewsLabel}
            onAdd={onAdd}
            onOpenProduct={onOpenProduct}
          />
          <Button component="a" href="/products" onClick={onNavigate('/products')} variant="contained" endIcon={<ArrowIcon direction="right" />} sx={{ mt: 3, minHeight: 48 }}>
            View the full collection
          </Button>
        </Box>
      )}

      <Box sx={pageSx}><SubscribeSection /></Box>
    </Stack>
  )
}
