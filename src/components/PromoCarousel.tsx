import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { MouseEvent } from 'react'
import { ArrowIcon } from './ArrowIcon'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { IconButton } from './mui/IconButton'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'

type Promo = { eyebrow: string; title: string; description: string; artwork: string }
const artworkImages: Record<string, string> = {
  homeKitchen: '/images/gadgify-home-kitchen.jpg',
  practicalGadgets: '/images/gadgify-practical-gadgets.jpg',
  playfulAccessories: '/images/gadgify-playful-accessories.jpg',
}
export function PromoCarousel({ promos, previousLabel, nextLabel, onExplore, exploreLabel }: { promos: readonly Promo[]; previousLabel: string; nextLabel: string; onExplore?: (event: MouseEvent<HTMLAnchorElement>) => void; exploreLabel?: string }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || promos.length < 2) return
    const timer = window.setInterval(() => setActive((value) => (value + 1) % promos.length), 5000)
    return () => window.clearInterval(timer)
  }, [paused, promos.length])
  const move = (amount: number) => setActive((value) => (value + amount + promos.length) % promos.length)
  const promo = promos[active]
  if (!promo) return null
  return <Box component="section" aria-label="Featured collections" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gridTemplateRows: { xs: '220px auto', md: '360px' }, overflow: 'hidden', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 3 }}>
    <Box sx={{ position: 'relative', height: { xs: 220, md: 360 }, bgcolor: 'action.hover' }} aria-hidden="true">
      <Box component="img" src={artworkImages[promo.artwork] ?? '/images/gadgify-curated-finds.jpg'} alt="" loading="eager" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <Typography variant="overline" sx={{ position: 'absolute', left: 2.5, top: 2, color: 'common.white', textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>GADGIFY / {String(active + 1).padStart(2, '0')}</Typography>
    </Box>
    <Stack sx={{ height: { xs: 'auto', md: 360 }, minHeight: { xs: 300, md: 0 }, justifyContent: 'center', alignItems: 'flex-start', px: { xs: 2.5, sm: 4, md: 5 }, py: { xs: 2.5, md: 3 }, overflow: 'hidden' }}>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>{promo.eyebrow}</Typography>
      <Typography component="h2" variant="h3" sx={{ mt: 0.5, mb: 1.5, maxWidth: 390, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.05 }}>{promo.title}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 360 }}>{promo.description}</Typography>
      {onExplore && exploreLabel && <Button component="a" href="/products" onClick={onExplore} variant="outlined" endIcon={<ArrowIcon direction="right" />} sx={{ mt: 2, minHeight: 44 }}>{exploreLabel}</Button>}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 2.5 }}>
        <IconButton aria-label={previousLabel} onClick={() => move(-1)} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, width: 44, height: 44 }}><ArrowLeft size={18} /></IconButton>
        <IconButton aria-label={nextLabel} onClick={() => move(1)} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, width: 44, height: 44 }}><ArrowRight size={18} /></IconButton>
        <Typography variant="caption" color="text.secondary" aria-live="polite" sx={{ pl: 1 }}>{active + 1} / {promos.length}</Typography>
        <Stack direction="row" spacing={0.25} role="group" aria-label="Choose featured collection" sx={{ pl: 1 }}>{promos.map((item, index) => <IconButton key={`${item.title}-${index}`} aria-label={`Show collection ${index + 1}`} aria-current={active === index ? 'true' : undefined} onClick={() => setActive(index)} sx={{ minWidth: 44, minHeight: 44, width: 44, height: 44, p: 0, borderRadius: '50%', bgcolor: 'transparent', '&::after': { content: '""', width: 10, height: 10, borderRadius: '50%', bgcolor: active === index ? 'primary.main' : 'divider' }, '&:hover': { bgcolor: 'action.hover' } }} />)}</Stack>
      </Stack>
    </Stack>
  </Box>
}
