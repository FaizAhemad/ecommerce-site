import { wishlistVersion, replaceWishlist, resetWishlist } from './api/wishlistState'
import { useQuery } from '@tanstack/react-query'
import { NotificationProvider } from './components/NotificationProvider'
import { apiFetch } from './api/http'
import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { getStorefront } from './api/storefront'
import { queryClient } from './api/queryClient'
import { SiteLayout } from './components/SiteLayout'
import { StorefrontRoute } from './router'
import './App.css'

const fetch = apiFetch

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('UI rendering error', error, info) }
  render() {
    if (this.state.hasError) return <main className="error-screen"><div className="error-orbit" aria-hidden="true"><span>!</span></div><p className="eyebrow">A SMALL DETOUR</p><h1>Something went wrong.</h1><p>We hit an unexpected snag while preparing this page. A quick reload should get you moving again.</p><div className="error-actions"><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload page</button><a className="secondary-button" href="/" onClick={(event)=>{event.preventDefault();window.location.href='/'}}>Back to home</a></div><small>Error boundary · Safe recovery</small></main>
    return this.props.children
  }
}

function App() {
  const storefrontQuery = useQuery({ queryKey: ['storefront'], queryFn: getStorefront })
  const storefront = storefrontQuery.data ?? null
  const requestFailed = storefrontQuery.isError
  const [path, setPath] = useState(window.location.pathname)
  const [, setRouteVersion] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const cartState = useRef({ confirmed: 0, pending: 0, version: 0, epoch: 0, tail: Promise.resolve(), products: new Set<string>() })
  const [wishlistCount, setWishlistCount] = useState(() => JSON.parse(window.localStorage.getItem('wishlist') ?? '[]').length)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const sessionVersion = useRef(0)

  const loadStorefront = () => { void storefrontQuery.refetch() }
  const applySession = (user?: { role?: string }) => {
    sessionVersion.current += 1
    setIsAuthenticated(Boolean(user))
    setIsAdmin(String(user?.role ?? '').trim().toUpperCase() === 'ADMIN')
  }

  useEffect(() => {
    loadStorefront()
    const requestVersion = sessionVersion.current
    fetch('/api/auth/me').then(async (response) => {
      if (sessionVersion.current !== requestVersion) return
      if (!response.ok) { applySession(); return }
      const body = await response.json() as { user?: { role?: string } }
      if (sessionVersion.current === requestVersion) applySession(body.user)
    }).catch(() => { if (sessionVersion.current === requestVersion) applySession() })
    const onPopState = () => { setPath(window.location.pathname); setRouteVersion((version) => version + 1) }
    const onWishlistChange = () => setWishlistCount(JSON.parse(window.localStorage.getItem('wishlist') ?? '[]').length)
    window.addEventListener('popstate', onPopState)
    window.addEventListener('wishlistchange', onWishlistChange)
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('wishlistchange', onWishlistChange) }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { cartState.current = { confirmed: 0, pending: 0, version: 0, epoch: cartState.current.epoch + 1, tail: Promise.resolve(), products: new Set() }; setCartCount(0); return }
    let cancelled = false
    const refreshCart = () => { const state = cartState.current; const version = ++state.version; if (state.pending) return; void fetch('/api/cart').then(async (response) => {
      if (!response.ok) return
      const body = await response.json() as { cart: { items: { quantity: number }[] } }
      if (!cancelled && state === cartState.current && version === state.version && !state.pending) { state.confirmed = body.cart.items.reduce((total, item) => total + item.quantity, 0); setCartCount(state.confirmed) }
    }).catch(() => undefined) }
    refreshCart()
    window.addEventListener('cartchange', refreshCart)
    return () => { cancelled = true; window.removeEventListener('cartchange', refreshCart) }
  }, [isAuthenticated])

  // Confirm admin access from a protected endpoint as a fallback when an older
  // session response does not include the role field.
  useEffect(() => {
    if (!isAuthenticated) return
    fetch('/api/admin/analytics').then((response) => { if (response.ok) setIsAdmin(true) }).catch(() => undefined)
  }, [isAuthenticated])

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      resetWishlist()
      return
    }
    const version = wishlistVersion()
    void fetch('/api/wishlist').then(async (response) => {
      if (!response.ok) return
      const body = await response.json() as { wishlist: { items: { productId: string }[] } }
      if (cancelled) return
      replaceWishlist(body.wishlist.items.map((item) => item.productId), version)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [isAuthenticated])

  const addToCart = (productId: string): Promise<void> => {
    if (!isAuthenticated) return Promise.reject(new Error('Please sign in to add items to your cart.'))
    const state = cartState.current
    if (state.products.has(productId)) return Promise.resolve()
    state.products.add(productId)
    state.pending += 1
    state.version += 1
    setCartCount(state.confirmed + state.pending)
    // Serialize writes so every response is an authoritative base for remaining optimistic additions.
    const request = state.tail.then(async () => {
      if (state !== cartState.current) throw new Error('Your session changed. Please try again.')
      const response = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: 1 }) })
      if (response.status === 401) throw new Error('Please sign in to add items to your cart.')
      if (response.status === 404) throw new Error('This product is no longer available.')
      if (!response.ok) throw new Error('Unable to add to cart. Please try again.')
      const body = await response.json() as { cart: { items: { quantity: number }[] } }
      state.confirmed = body.cart.items.reduce((total, item) => total + item.quantity, 0)
    }).catch((error: unknown) => {
      if (error instanceof TypeError || error instanceof DOMException) throw new Error('Could not reach the store. Check your cart before trying again.')
      throw error
    }).finally(() => {
      state.pending -= 1
      state.products.delete(productId)
      if (state === cartState.current) { setCartCount(state.confirmed + state.pending); if (!state.pending) window.dispatchEvent(new Event('cartchange')) }
    })
    state.tail = request.catch(() => undefined)
    return request
  }

  const logout = () => { void fetch('/api/auth/logout', { method: 'POST' }); queryClient.clear(); setIsAuthenticated(false); setIsAdmin(false) }

  useEffect(() => {
    if (!storefront) return
    document.documentElement.style.setProperty('--brand-primary', storefront.branding.primary)
    document.documentElement.style.setProperty('--brand-accent', storefront.branding.accent)
  }, [storefront])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [path])

  if (requestFailed) return <div className="state-message"><p>We could not load the storefront.</p><button className="primary-button" type="button" onClick={loadStorefront}>Try again</button></div>
  if (!storefront) return <main className="app-loading" aria-busy="true" aria-label="Loading Gadgify"><div className="app-loading-mark">G</div><p className="eyebrow">GADGIFY</p><h1>Preparing your everyday.</h1><div className="app-loading-bar"><span /></div><p className="app-loading-note">Loading products, collections, and store details…</p></main>

  const handleLogin = (role?: string) => { applySession({ role }); const destination = String(role ?? '').toUpperCase() === 'ADMIN' ? '/admin' : '/'; window.history.pushState({}, '', destination); setPath(destination); window.dispatchEvent(new PopStateEvent('popstate')) }
  return <AppErrorBoundary><NotificationProvider><SiteLayout storefront={storefront} cartCount={cartCount} wishlistCount={wishlistCount} isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={logout}><StorefrontRoute path={path} storefront={storefront} onAdd={addToCart} isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogin={handleLogin} /></SiteLayout></NotificationProvider></AppErrorBoundary>
}

export default App
