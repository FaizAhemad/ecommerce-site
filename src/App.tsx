import { wishlistVersion, replaceWishlist, resetWishlist } from './api/wishlistState'
import { useQuery } from '@tanstack/react-query'
import { NotificationProvider } from './components/NotificationProvider'
import { apiFetch } from './api/http'
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { getStorefront, getProduct } from './api/storefront'
import { queryClient } from './api/queryClient'
import {
  changeSession,
  sessionUser,
  sessionGeneration,
  assertCurrentSession,
  type SessionUser,
} from './api/sessionScope'
import { useCart, updateCart, resetCart } from './api/cart'
import { SiteLayout } from './components/SiteLayout'
import { StorefrontRoute } from './router'
import './App.css'
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI rendering error', error, info)
  }
  render() {
    if (this.state.hasError)
      return (
        <main className="error-screen">
          <div className="error-orbit" aria-hidden="true">
            <span>!</span>
          </div>
          <p className="eyebrow">A SMALL DETOUR</p>
          <h1>Something went wrong.</h1>
          <p>
            We hit an unexpected snag while preparing this page. A quick reload should get you
            moving again.
          </p>
          <div className="error-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <a
              className="secondary-button"
              href="/"
              onClick={(event) => {
                event.preventDefault()
                window.location.href = '/'
              }}
            >
              Back to home
            </a>
          </div>
          <small>Error boundary · Safe recovery</small>
        </main>
      )
    return this.props.children
  }
}

function App() {
  const storefrontQuery = useQuery({ queryKey: ['storefront'], queryFn: getStorefront })
  const storefront = storefrontQuery.data
  const [path, setPath] = useState(window.location.pathname)
  const [, setRouteVersion] = useState(0)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState(false)
  const probe = useRef(0)
  const channel = useRef<BroadcastChannel | null>(null)
  const applySession = useCallback((next: SessionUser | null, force = false) => {
    probe.current += 1
    if (force || next?.id !== sessionUser()?.id || next?.role !== sessionUser()?.role) {
      changeSession(next)
      void queryClient.cancelQueries({ queryKey: ['private'] })
      queryClient.removeQueries({ queryKey: ['private'] })
      resetWishlist()
      resetCart()
    }
    setUser(next)
    setLoading(false)
    setSessionError(false)
  }, [])
  const checkSession = useCallback(async () => {
    const version = ++probe.current
    setSessionError(false)
    try {
      const response = await apiFetch('/api/auth/me', { cache: 'no-store' })
      if (version !== probe.current) return
      if (response.status === 401) {
        applySession(null)
        return
      }
      if (!response.ok) throw new Error('Session unavailable')
      const body = (await response.json()) as { user?: SessionUser }
      if (!body.user?.id) throw new Error('Invalid session response')
      if (version === probe.current) applySession(body.user)
    } catch {
      if (version === probe.current) {
        setSessionError(true)
        setLoading(false)
      }
    }
  }, [applySession])
  useEffect(() => {
    resetWishlist()
    let active = true
    queueMicrotask(() => {
      if (active) void checkSession()
    })
    const onRoute = () => {
      setPath(window.location.pathname)
      setRouteVersion((value) => value + 1)
    }
    const expired = () => applySession(null, true)
    const recheck = () => {
      if (document.visibilityState !== 'visible') return
      void checkSession()
    }
    // Only an invalidation message is broadcast; no identity, credential or customer data.
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('gadgify-session')
      channel.current.onmessage = () => {
        applySession(null, true)
        setLoading(true)
        void checkSession()
      }
    }
    window.addEventListener('popstate', onRoute)
    window.addEventListener('sessionexpired', expired)
    document.addEventListener('visibilitychange', recheck)
    return () => {
      active = false
      probe.current += 1
      channel.current?.close()
      window.removeEventListener('popstate', onRoute)
      window.removeEventListener('sessionexpired', expired)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [applySession, checkSession])
  const cart = useCart()
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    const version = wishlistVersion()
    void apiFetch('/api/wishlist', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return
        const body = (await response.json()) as { wishlist: { items: { productId: string }[] } }
        if (!controller.signal.aborted)
          replaceWishlist(
            body.wishlist.items.map((item) => item.productId),
            version,
          )
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [userId])
  useEffect(() => {
    if (!storefront) return
    document.documentElement.style.setProperty('--brand-primary', storefront.branding.primary)
    document.documentElement.style.setProperty('--brand-accent', storefront.branding.accent)
  }, [storefront])
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [path])
  const logout = async () => {
    const response = await apiFetch('/api/auth/logout', { method: 'POST' })
    if (!response.ok) throw new Error('Unable to log out. Please try again.')
    applySession(null, true)
    channel.current?.postMessage('changed')
  }
  const handleLogin = (next: SessionUser) => {
    applySession(next, true)
    channel.current?.postMessage('changed')
    const destination = next.role === 'ADMIN' ? '/admin' : '/'
    window.history.pushState({}, '', destination)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  if (storefrontQuery.isError || sessionError)
    return (
      <main className="state-panel" role="alert">
        <p>
          {sessionError
            ? 'We could not verify your session. Please check your connection and retry.'
            : 'We could not load the storefront.'}
        </p>
        <button
          className="primary-button"
          onClick={() => {
            if (sessionError) void checkSession()
            else void storefrontQuery.refetch()
          }}
        >
          Try again
        </button>
      </main>
    )
  if (!storefront || loading)
    return (
      <main className="app-loading" aria-busy="true">
        <span className="loading-spinner" aria-hidden="true" />
        <p role="status">{loading ? 'Checking your session...' : 'Loading the store...'}</p>
      </main>
    )
  const addToCart = async (id: string) => {
    if (!sessionUser()) throw new Error('Please sign in to update your cart.')
    const generation = sessionGeneration()
    const selected = storefront.products.find((item) => item.id === id) ?? (await getProduct(id))
    assertCurrentSession(generation)
    if (!selected) throw new Error('This product is unavailable.')
    await updateCart(
      {
        id,
        name: selected.name,
        category: selected.category,
        priceMinor: Math.round(selected.price * 100),
      },
      1,
      'add',
    )
  }
  return (
    <AppErrorBoundary>
      <NotificationProvider key={sessionGeneration()}>
        <SiteLayout
          storefront={storefront}
          cartCount={(cart.data ?? []).reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={0}
          isAuthenticated={Boolean(user)}
          isAdmin={user?.role === 'ADMIN'}
          onLogout={logout}
        >
          <StorefrontRoute
            path={path}
            storefront={storefront}
            onAdd={addToCart}
            isAuthenticated={Boolean(user)}
            isAdmin={user?.role === 'ADMIN'}
            onLogin={handleLogin}
          />
        </SiteLayout>
      </NotificationProvider>
    </AppErrorBoundary>
  )
}
export default App
