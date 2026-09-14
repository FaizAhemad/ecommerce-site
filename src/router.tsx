import type { SessionUser } from './api/sessionScope'
import { useEffect, type MouseEvent } from 'react'
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
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage'
import { ProfilePage } from './pages/ProfilePage'
import { safeRouteId } from './routePaths'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { AdminPage } from './pages/AdminPage'

type RouteProps = {
  path: string
  storefront: StorefrontApiResponse
  onAdd: (productId: string) => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  onLogin: (user: SessionUser) => void
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

function WishlistRedirect() {
  useEffect(() => {
    window.history.replaceState({}, '', '/products')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])
  return null
}
function AdminRedirect() {
  useEffect(() => {
    window.history.replaceState({}, '', '/admin')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])
  return <p role="status">Opening dashboard…</p>
}
function NotFoundPage() {
  return (
    <section className="page-section">
      <h1>Page not found</h1>
      <p>This link is unavailable.</p>
      <a href="/" onClick={navigate('/')}>
        Back to home
      </a>
    </section>
  )
}

function DebugErrorPage() {
  if (import.meta.env.DEV) throw new Error('Intentional error-boundary preview')
  return <p className="state-message">Debug route is available in development only.</p>
}

export function StorefrontRoute({
  path,
  storefront,
  onAdd,
  isAuthenticated,
  isAdmin,
  onLogin,
}: RouteProps) {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path
  switch (normalizedPath) {
    case '/profile':
      return isAuthenticated ? (
        <ProfilePage onNavigate={navigate} />
      ) : (
        <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      )
    case '/verify-email':
      return <EmailVerificationPage isAuthenticated={isAuthenticated} onNavigate={navigate} />
    case '/forgot-password':
      return <PasswordRecoveryPage key="forgot" mode="forgot" onNavigate={navigate} />
    case '/reset-password':
      return <PasswordRecoveryPage key="reset" mode="reset" onNavigate={navigate} />
    case '/debug-error':
      return <DebugErrorPage />
    case '/cart':
      return isAuthenticated ? (
        <CartPage storefront={storefront} onNavigate={navigate} />
      ) : (
        <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      )
    case '/wishlist':
      return <WishlistRedirect />
    case '/checkout':
      return isAuthenticated ? (
        <PaymentPage storefront={storefront} onNavigate={navigate} />
      ) : (
        <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      )
    case '/track-order':
      return <TrackOrderPage storefront={storefront} onNavigate={navigate} />
    case '/login':
      return isAuthenticated ? (
        <HomePage
          storefront={storefront}
          onNavigate={navigate}
          onAdd={onAdd}
          onOpenProduct={(id) => navigateTo(`/product/${id}`)}
        />
      ) : (
        <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      )
    case '/signup':
      return isAuthenticated ? (
        <HomePage
          storefront={storefront}
          onNavigate={navigate}
          onAdd={onAdd}
          onOpenProduct={(id) => navigateTo(`/product/${id}`)}
        />
      ) : (
        <AuthPage mode="signup" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      )
    case '/orders':
      return isAuthenticated ? (
        <OrdersPage storefront={storefront} onNavigate={navigate} />
      ) : (
        <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      )
    case '/admin':
      return !isAuthenticated ? (
        <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
      ) : isAdmin ? (
        <AdminPage storefront={storefront} onNavigate={navigate} />
      ) : (
        <p className="state-message">Administrator access is required.</p>
      )
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
      return (
        <ShopPage
          key={window.location.search}
          storefront={storefront}
          onAdd={onAdd}
          onOpenProduct={(id) => navigateTo(`/product/${id}`)}
        />
      )
    case '/support':
      return (
        <SupportPage
          key="create-support"
          storefront={storefront}
          isAuthenticated={isAuthenticated}
        />
      )
    case '/support-requests':
      return (
        <SupportPage
          key="list-support"
          storefront={storefront}
          isAuthenticated={isAuthenticated}
          mode="list"
        />
      )
    case '/admin/support':
      return isAuthenticated && isAdmin ? (
        <SupportPage key="admin-support" storefront={storefront} isAuthenticated mode="admin" />
      ) : (
        <p className="state-message">Administrator access is required.</p>
      )
    default:
      if (normalizedPath.startsWith('/admin/')) return <AdminRedirect />
      if (
        (normalizedPath.startsWith('/orders/') &&
          !safeRouteId(normalizedPath.slice('/orders/'.length))) ||
        (normalizedPath.startsWith('/product/') &&
          !safeRouteId(normalizedPath.slice('/product/'.length)))
      )
        return <NotFoundPage />
      if (normalizedPath.startsWith('/orders/'))
        return isAuthenticated ? (
          <OrderDetailPage
            storefront={storefront}
            orderId={safeRouteId(normalizedPath.slice('/orders/'.length))!}
            onNavigate={navigate}
          />
        ) : (
          <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
        )
      if (normalizedPath.startsWith('/product/'))
        return (
          <ProductDetailPage
            key={normalizedPath}
            storefront={storefront}
            productId={safeRouteId(normalizedPath.slice('/product/'.length))!}
            onAdd={onAdd}
            onNavigate={navigate}
          />
        )
      if (normalizedPath !== '/') return <NotFoundPage />
      return (
        <HomePage
          storefront={storefront}
          onNavigate={navigate}
          onAdd={onAdd}
          onOpenProduct={(id) => navigateTo(`/product/${id}`)}
        />
      )
  }
}
