import { useEffect, useRef, useState } from 'react'

const tourSteps = [
  { path: '/products', title: 'Find a product', text: 'Browse products and use search, category, rating and colour filters. Open a product to see its details and reviews.' },
  { path: '/cart', title: 'Review your cart', text: 'Sign in to manage your cart. Check quantities and the subtotal before checkout; delivery and tax are confirmed separately.' },
  { path: '/profile', title: 'Manage your account', text: 'Sign in to update your profile, verify your email or manage saved delivery addresses. Password recovery is available from login.' },
  { path: '/orders', title: 'Follow your orders', text: 'Your signed-in order history shows recorded order and payment status. Open an order for details and tracking. An interrupted payment is not confirmation.' },
  { path: '/support', title: 'Get assistance', text: 'Create a support request while signed in. Follow its status in Support requests. Do not include passwords or payment-card details.' },
] as const

export function SiteTour({ path }: { path: string }) {
  const [step, setStep] = useState<number | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (step !== null) heading.current?.focus(); else start.current?.focus() }, [step])
  function navigate(destination: string) {
    window.history.pushState({}, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'auto' })
  }
  function go(index: number) { setStep(index); navigate(tourSteps[index].path) }
  function stop() { setStep(null); navigate('/help') }
  if (step === null) return path === '/help' ? <button ref={start} className="secondary-button" onClick={() => go(0)}>Take a website tour</button> : null
  const current = tourSteps[step]
  return <section className="state-message" aria-labelledby="tour-title" onKeyDown={event => { if (event.key === 'Escape') stop() }}>
    <p>Website tour · Step {step + 1} of {tourSteps.length}</p>
    <h2 id="tour-title" tabIndex={-1} ref={heading}>{current.title}</h2>
    <p>{current.text}</p>
    <div className="profile-actions">
      <button className="secondary-button" disabled={step === 0} onClick={() => go(step - 1)}>Previous</button>
      {path !== current.path && <button className="secondary-button" onClick={() => navigate(current.path)}>Open this step</button>}
      <button className="primary-button" onClick={() => step === tourSteps.length - 1 ? stop() : go(step + 1)}>{step === tourSteps.length - 1 ? 'Finish tour' : 'Next'}</button>
      <button className="secondary-button" onClick={stop}>Exit tour</button>
    </div>
  </section>
}
