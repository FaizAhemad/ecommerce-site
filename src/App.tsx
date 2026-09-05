import { useEffect, useState } from 'react'
import { getStorefront, type StorefrontApiResponse } from './api/storefront'
import { SiteLayout } from './components/SiteLayout'
import { StorefrontRoute } from './router'
import './App.css'

function App() {
  const [storefront, setStorefront] = useState<StorefrontApiResponse | null>(null)
  const [requestFailed, setRequestFailed] = useState(false)
  const [path, setPath] = useState(window.location.pathname)
  const [cartCount, setCartCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    getStorefront().then(setStorefront).catch(() => setRequestFailed(true))
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!storefront) return
    document.documentElement.style.setProperty('--brand-primary', storefront.branding.primary)
    document.documentElement.style.setProperty('--brand-accent', storefront.branding.accent)
  }, [storefront])

  if (requestFailed) return <p className="state-message">Storefront unavailable</p>
  if (!storefront) return <p className="state-message">Loading storefront</p>

  return <SiteLayout storefront={storefront} cartCount={cartCount} isAuthenticated={isAuthenticated} onLogout={() => setIsAuthenticated(false)}><StorefrontRoute path={path} storefront={storefront} onAdd={() => setCartCount((count) => count + 1)} isAuthenticated={isAuthenticated} onLogin={() => setIsAuthenticated(true)} /></SiteLayout>
}

export default App
