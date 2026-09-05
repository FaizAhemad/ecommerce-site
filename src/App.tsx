import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import { getStorefront, type StorefrontApiResponse } from './api/storefront'
import { SiteLayout } from './components/SiteLayout'
import { StorefrontRoute } from './router'
import './App.css'

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
  const [storefront, setStorefront] = useState<StorefrontApiResponse | null>(null)
  const [requestFailed, setRequestFailed] = useState(false)
  const [path, setPath] = useState(window.location.pathname)
  const [cartCount, setCartCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadStorefront = () => { setRequestFailed(false); setStorefront(null); getStorefront().then(setStorefront).catch(() => setRequestFailed(true)) }
  useEffect(() => {
    loadStorefront()
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!storefront) return
    document.documentElement.style.setProperty('--brand-primary', storefront.branding.primary)
    document.documentElement.style.setProperty('--brand-accent', storefront.branding.accent)
  }, [storefront])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [path])

  if (requestFailed) return <div className="state-message"><p>We could not load the storefront.</p><button className="primary-button" type="button" onClick={loadStorefront}>Try again</button></div>
  if (!storefront) return <p className="state-message">Loading storefront</p>

  return <AppErrorBoundary><SiteLayout storefront={storefront} cartCount={cartCount} isAuthenticated={isAuthenticated} onLogout={() => setIsAuthenticated(false)}><StorefrontRoute path={path} storefront={storefront} onAdd={() => setCartCount((count) => count + 1)} isAuthenticated={isAuthenticated} onLogin={() => setIsAuthenticated(true)} /></SiteLayout></AppErrorBoundary>
}

export default App
