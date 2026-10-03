import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './mui/Button'
import { Paper } from './mui/Paper'

type TourStep = {
  path: string
  nextPath?: string
  selector?: string
  title: string
  text: string
}

const supportStep: TourStep = {
  path: '/support',
  selector: 'nav a[href="/support"]',
  title: 'Start with Support',
  text: 'Browse common answers, track an order or contact our team. The tour will show you the main areas of the store.',
}

const sharedSteps: TourStep[] = [
  {
    path: '/',
    selector: 'nav a[href="/"]',
    title: 'Visit the home page',
    text: 'See featured collections and discover what is new.',
  },
  {
    path: '/products',
    selector: 'nav a[href="/products"]',
    title: 'Explore products',
    text: 'Search and filter products by category, rating and colour, then open an item to see its details.',
  },
]

type TargetRect = { top: number; left: number; width: number; height: number }

export function SiteTour({ path, isAuthenticated, onActiveChange }: { path: string; isAuthenticated: boolean; onActiveChange: (active: boolean) => void }) {
  const [stepIndex, setStepIndex] = useState<number | null>(null)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  const steps = useMemo(
    () =>
      [
        supportStep,
        ...sharedSteps,
        ...(isAuthenticated
          ? [
              {
                path: '/orders',
                selector: 'nav a[href="/orders"]',
                title: 'Follow your orders',
                text: 'Review recorded order and payment status, then open an order for details and tracking.',
              },
            ]
          : []),
      ].map((step, index, allSteps) => ({
        ...step,
        nextPath: allSteps[index + 1]?.path,
      })),
    [isAuthenticated],
  )
  const isComplete = stepIndex !== null && stepIndex >= steps.length
  const current = stepIndex === null || isComplete ? null : steps[stepIndex]

  useEffect(() => {
    if (path !== '/support' || window.location.hash !== '#website-tour') return
    window.history.replaceState(window.history.state, '', '/support')
    setStepIndex(0)
    onActiveChange(true)
  }, [onActiveChange, path])

  useEffect(() => {
    if (stepIndex !== null) heading.current?.focus()
    else start.current?.focus()
  }, [stepIndex])

  useEffect(() => {
    if (!current?.selector) {
      setTargetRect(null)
      return
    }

    const target = document.querySelector<HTMLElement>(current.selector)
    if (!target) {
      setTargetRect(null)
      return
    }

    target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const originalOutline = target.style.outline
    const originalOutlineOffset = target.style.outlineOffset
    const originalBorderRadius = target.style.borderRadius
    const originalTourUnderline = target.style.getPropertyValue('--tour-active-underline')
    if (target.matches('.site-header nav a.is-active')) {
      target.style.setProperty('--tour-active-underline', 'none')
    }
    target.style.outline = '3px solid var(--green)'
    target.style.outlineOffset = '4px'
    target.style.borderRadius = '0.5rem'
    const update = () => {
      const rect = target.getBoundingClientRect()
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }

    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(target)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    document.addEventListener('scroll', update, true)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      document.removeEventListener('scroll', update, true)
      target.style.outline = originalOutline
      target.style.outlineOffset = originalOutlineOffset
      target.style.borderRadius = originalBorderRadius
      if (originalTourUnderline) target.style.setProperty('--tour-active-underline', originalTourUnderline)
      else target.style.removeProperty('--tour-active-underline')
    }
  }, [current, stepIndex])

  useEffect(() => {
    if (stepIndex === null || isComplete || !current?.nextPath || path !== current.nextPath) return
    setStepIndex(stepIndex + 1)
  }, [current, isComplete, path, stepIndex])

  function exitTour() {
    setStepIndex(null)
    setTargetRect(null)
    onActiveChange(false)
  }

  function navigate(destination: string) {
    window.history.pushState({}, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  function goNext() {
    if (current?.nextPath) navigate(current.nextPath)
    else if (isComplete) exitTour()
    else setStepIndex(steps.length)
  }

  function goPrevious() {
    if (stepIndex === null || stepIndex === 0) return
    if (isComplete) {
      setStepIndex(steps.length - 1)
      navigate(steps[steps.length - 1].path)
      return
    }
    const previousStep = steps[stepIndex - 1]
    setStepIndex(stepIndex - 1)
    navigate(previousStep.path)
  }

  if (stepIndex === null) {
    return path === '/support' ? (
      <Button
        ref={start}
        id="website-tour"
        variant="outlined"
        sx={{ mb: 2.5 }}
        onClick={() => { setStepIndex(0); onActiveChange(true) }}
      >
        Take a website tour
      </Button>
    ) : null
  }

  const pointerLeft = targetRect ? targetRect.left + targetRect.width / 2 - 22 : 0
  const pointerTop = targetRect ? targetRect.top + targetRect.height + 5 : 0
  const stepNumber = Math.min((stepIndex ?? 0) + 1, steps.length)
  const destinationLabels: Record<string, string> = {
    '/': 'Home',
    '/products': 'Products',
    '/orders': 'Orders',
    '/support': 'Support',
  }
  const nextLabel = current?.nextPath ? `Next: ${destinationLabels[current.nextPath]}` : 'Done'

  return (
    <>
      {targetRect && current && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[79] bg-[rgba(22,27,23,0.58)]"
          />
          <svg
              aria-hidden="true"
              className="pointer-events-none fixed z-[120] h-9 w-11 drop-shadow-sm"
              style={{ left: pointerLeft, top: pointerTop }}
              viewBox="0 0 44 36"
            >
              <path
                d="M22 33V8M12 18 22 8 32 18"
                fill="none"
                stroke="var(--ink)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
          </svg>
        </>
      )}

      <section
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[82] px-4"
        aria-label="Website tour"
        onKeyDown={event => {
          if (event.key === 'Escape') exitTour()
        }}
      >
        <Paper component="div" role="dialog" aria-label="Website tour" aria-modal={false} elevation={8} sx={{ pointerEvents: 'auto', mx: 'auto', maxHeight: 'calc(100dvh - 2rem)', width: '100%', maxWidth: 576, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 4, bgcolor: 'background.paper', p: { xs: 2, sm: 2.5 } }}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]" aria-live="polite" aria-atomic="true">
              {isComplete ? 'Website tour complete' : `Website tour · Step ${stepNumber} of ${steps.length}`}
            </p>
            <Button
              variant="text"
              onClick={exitTour}
            >
              {isComplete ? 'Close' : 'Exit tour'}
            </Button>
          </div>
          <h2
            id="tour-title"
            tabIndex={-1}
            ref={heading}
            className="mt-2 text-xl font-semibold leading-tight text-[var(--ink)] focus:outline-none sm:text-2xl"
          >
            {isComplete ? 'You’re all set' : current?.title}
          </h2>
          <p className="mt-4 max-w-prose text-sm leading-6 text-[var(--muted)]">
            {isComplete
              ? 'You have visited the key areas of Gadgify. Choose any link in the site navigation to continue browsing.'
              : current?.text}
          </p>
          {!isComplete && current?.selector && !targetRect && (
            <p className="mt-2 text-sm font-medium text-[var(--green)]">Use Next or choose the outlined link to continue.</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
            <Button variant="outlined" disabled={stepIndex === 0} onClick={goPrevious}>
              Previous
            </Button>
            <p className="min-w-0 flex-1 text-center text-xs text-[var(--muted)]">
              {isComplete
                ? 'Tour finished'
                : stepIndex === 0
                  ? 'Arrow = this page · Next = Products.'
                  : 'Arrow = this page · Next = the next page.'}
            </p>
            <Button
              variant="contained"
              onClick={goNext}
            >
              {nextLabel}
            </Button>
          </div>
        </Paper>
      </section>
    </>
  )
}
