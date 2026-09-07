import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from './api/storefront'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { SupportPage } from './pages/SupportPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { PolicyPage } from './pages/PolicyPage'
import { PaymentPage } from './pages/PaymentPage'
import { TrackOrderPage } from './pages/TrackOrderPage'
import { AuthPage } from './pages/AuthPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { WishlistPage } from './pages/WishlistPage'
import { AdminPage } from './pages/AdminPage'

type RouteProps = {
  path: string
  storefront: StorefrontApiResponse
  onAdd: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  onLogin: (role?: string) => void
}

const navigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  navigateTo(path)
}

const navigateTo = (path: string) => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function DebugErrorPage() {
  if (import.meta.env.DEV) throw new Error('Intentional error-boundary preview')
  return <p className="state-message">Debug route is available in development only.</p>
}

export function StorefrontRoute({ path, storefront, onAdd, isAuthenticated, isAdmin, onLogin }: RouteProps) {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path
  switch (normalizedPath) {
    case '/debug-error':
      return <DebugErrorPage />
    case '/cart':
      return isAuthenticated ? <CartPage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/wishlist':
      return isAuthenticated ? <WishlistPage storefront={storefront} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/checkout':
      return isAuthenticated ? <PaymentPage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/track-order':
      return <TrackOrderPage storefront={storefront} onNavigate={navigate} />
    case '/login':
      return isAuthenticated ? <HomePage storefront={storefront} onNavigate={navigate} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/signup':
      return isAuthenticated ? <HomePage storefront={storefront} onNavigate={navigate} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} /> : <AuthPage mode="signup" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/orders':
      return isAuthenticated ? <OrdersPage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/admin':
      return !isAuthenticated ? <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} /> : isAdmin ? <AdminPage storefront={storefront} onNavigate={navigate} /> : <p className="state-message">Administrator access is required.</p>
    case '/privacy':
      return <PolicyPage storefront={storefront} policy="privacy" onNavigate={navigate} />
    case '/returns':
      return <PolicyPage storefront={storefront} policy="returns" onNavigate={navigate} />
    case '/refund-policy':
      return <PolicyPage storefront={storefront} policy="refund" onNavigate={navigate} />
    case '/terms':
    case '/terms-and-conditions':
      return <PolicyPage storefront={storefront} policy="terms" onNavigate={navigate} />
    case '/products':
      return <ShopPage key={window.location.search} storefront={storefront} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} />
    case '/support':
      return <SupportPage storefront={storefront} />
    default:
      if (normalizedPath.startsWith('/orders/')) return isAuthenticated ? <OrderDetailPage storefront={storefront} orderId={decodeURIComponent(normalizedPath.slice('/orders/'.length))} onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      if (normalizedPath.startsWith('/product/')) return <ProductDetailPage key={normalizedPath} storefront={storefront} productId={decodeURIComponent(normalizedPath.slice('/product/'.length))} onAdd={onAdd} onNavigate={navigate} />
      return <HomePage storefront={storefront} onNavigate={navigate} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} />
  }
}
