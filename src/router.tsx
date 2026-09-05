import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from './api/storefront'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { SupportPage } from './pages/SupportPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { BagPage } from './pages/BagPage'
import { PolicyPage } from './pages/PolicyPage'
import { PaymentPage } from './pages/PaymentPage'
import { TrackOrderPage } from './pages/TrackOrderPage'
import { AuthPage } from './pages/AuthPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'

type RouteProps = {
  path: string
  storefront: StorefrontApiResponse
  onAdd: () => void
  isAuthenticated: boolean
  onLogin: () => void
}

const navigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
  navigateTo(path)
}

const navigateTo = (path: string) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function StorefrontRoute({ path, storefront, onAdd, isAuthenticated, onLogin }: RouteProps) {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path
  switch (normalizedPath) {
    case '/bag':
      return <BagPage storefront={storefront} onNavigate={navigate} />
    case '/checkout':
      return isAuthenticated ? <PaymentPage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="login" onNavigate={navigate} onLogin={onLogin} />
    case '/track-order':
      return <TrackOrderPage storefront={storefront} onNavigate={navigate} />
    case '/login':
      return isAuthenticated ? <HomePage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="login" onNavigate={navigate} onLogin={onLogin} />
    case '/signup':
      return isAuthenticated ? <HomePage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="signup" onNavigate={navigate} onLogin={onLogin} />
    case '/orders':
      return isAuthenticated ? <OrdersPage storefront={storefront} onNavigate={navigate} /> : <AuthPage mode="login" onNavigate={navigate} onLogin={onLogin} />
    case '/privacy':
      return <PolicyPage storefront={storefront} policy="privacy" onNavigate={navigate} />
    case '/returns':
      return <PolicyPage storefront={storefront} policy="returns" onNavigate={navigate} />
    case '/shop':
      return <ShopPage storefront={storefront} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} />
    case '/support':
      return <SupportPage storefront={storefront} />
    default:
      if (normalizedPath.startsWith('/orders/')) return isAuthenticated ? <OrderDetailPage storefront={storefront} orderId={decodeURIComponent(normalizedPath.slice('/orders/'.length))} onNavigate={navigate} /> : <AuthPage mode="login" onNavigate={navigate} onLogin={onLogin} />
      if (normalizedPath.startsWith('/product/')) return <ProductDetailPage key={normalizedPath} storefront={storefront} productId={decodeURIComponent(normalizedPath.slice('/product/'.length))} onAdd={onAdd} onNavigate={navigate} />
      return <HomePage storefront={storefront} onNavigate={navigate} />
  }
}
