import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
type Promo = { eyebrow: string; title: string; description: string; artwork: string }

const artworkColors: Record<string, string> = {
  sage: 'bg-[#d9ded0]',
  clay: 'bg-[#e5d2c0]',
  oak: 'bg-[#d7c19b]',
}
export function PromoCarousel({
  promos,
  previousLabel,
  nextLabel,
}: {
  promos: readonly Promo[]
  previousLabel: string
  nextLabel: string
}) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || promos.length < 2) return
    const timer = window.setInterval(() => setActive((value) => (value + 1) % promos.length), 5000)
    return () => window.clearInterval(timer)
  }, [paused, promos.length])
  const move = (amount: number) =>
    setActive((value) => (value + amount + promos.length) % promos.length)
  const promo = promos[active]
  if (!promo) return null
  return (
    <section
      className="mb-[52px] grid min-h-[250px] grid-cols-1 bg-[var(--surface)] md:grid-cols-2"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={`relative min-h-[180px] overflow-hidden md:min-h-[250px] ${artworkColors[promo.artwork] ?? 'bg-[var(--skeleton-base)]'}`}
        aria-hidden="true"
      >
        <span className="absolute left-[22px] top-5 z-10 font-sans text-[10px] tracking-[0.12em] text-[var(--ink)]">
          FEATURED / {String(active + 1).padStart(2, '0')}
        </span>
        <span className="absolute -bottom-[35px] right-[18%] size-[170px] rounded-full bg-white/45" />
      </div>
      <div className="flex flex-col justify-center px-[22px] py-[26px] md:px-[42px] md:py-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
          {promo.eyebrow}
        </p>
        <h2 className="mb-3 max-w-[390px] font-[var(--font-display)] text-[clamp(2rem,4vw,3.25rem)] font-normal leading-none tracking-[-0.045em] text-[var(--ink)]">
          {promo.title}
        </h2>
        <p className="mb-0 max-w-[330px] text-sm leading-6 text-[var(--muted)]">
          {promo.description}
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            className="grid size-11 place-items-center border border-[var(--line)] bg-transparent text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            type="button"
            onClick={() => move(-1)}
            aria-label={previousLabel}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            className="grid size-11 place-items-center border border-[var(--line)] bg-transparent text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            type="button"
            onClick={() => move(1)}
            aria-label={nextLabel}
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
          <span className="ml-2 font-sans text-[10px] tracking-[0.08em] text-[var(--muted)]" aria-live="polite">
            {active + 1} / {promos.length}
          </span>
        </div>
      </div>
    </section>
  )
}
