import { useEffect, useState } from 'react'
type Promo = { eyebrow: string; title: string; description: string; artwork: string }
export function PromoCarousel({ promos, previousLabel, nextLabel }: { promos: readonly Promo[]; previousLabel: string; nextLabel: string }) {
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false)
  useEffect(() => { if (paused || promos.length < 2) return; const timer = window.setInterval(() => setActive((value) => (value + 1) % promos.length), 5000); return () => window.clearInterval(timer) }, [paused, promos.length])
  const move = (amount: number) => setActive((value) => (value + amount + promos.length) % promos.length); const promo = promos[active]; if (!promo) return null
  return <section className="promo-carousel" aria-label="Featured offers" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}><div className={`promo-art promo-art-${promo.artwork}`} aria-hidden="true"><span>FEATURED / {String(active + 1).padStart(2, '0')}</span></div><div className="promo-copy"><p className="eyebrow">{promo.eyebrow}</p><h2>{promo.title}</h2><p>{promo.description}</p><div className="promo-actions"><button type="button" onClick={() => move(-1)} aria-label={previousLabel}>←</button><button type="button" onClick={() => move(1)} aria-label={nextLabel}>→</button><span className="promo-count" aria-live="polite">{active + 1} / {promos.length}</span></div></div></section>
}
