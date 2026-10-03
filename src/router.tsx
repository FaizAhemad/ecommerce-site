import type { SessionUser } from './api/sessionScope'
import { lazy, Suspense, useEffect, type MouseEvent } from 'react'
import { Box } from './components/mui/Box'
import { CircularProgress } from './components/mui/CircularProgress'
import { Typography } from './components/mui/Typography'
import type { StorefrontApiResponse } from './api/storefront'
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })))
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })))
const PolicyPage = lazy(() => import('./pages/PolicyPage').then((module) => ({ default: module.PolicyPage })))
const PaymentPage = lazy(() => import('./pages/PaymentPage').then((module) => ({ default: module.PaymentPage })))
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((module) => ({ default: module.TrackOrderPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const PasswordRecoveryPage = lazy(() => import('./pages/PasswordRecoveryPage').then((module) => ({ default: module.PasswordRecoveryPage })))
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage').then((module) => ({ default: module.EmailVerificationPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const SellerPage = lazy(() => import('./pages/SellerPage').then((module) => ({ default: module.SellerPage })))
const SellerCatalogPage = lazy(() => import('./pages/SellerCatalogPage').then((module) => ({ default: module.SellerCatalogPage })))
const FulfillmentPage = lazy(() => import('./pages/FulfillmentPage').then((module) => ({ default: module.FulfillmentPage })))
const ShopsPage = lazy(() => import('./pages/ShopsPage').then((module) => ({ default: module.ShopsPage })))
import { safeRouteId } from './routePaths'
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((module) => ({ default: module.OrdersPage })))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))
import { usePageMetadata } from './api/pageMetadata'

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

function AdminAccessRequired({ isAuthenticated, onNavigate }: { isAuthenticated: boolean; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <section className="page-section" aria-labelledby="admin-access-title">
      <h1 id="admin-access-title">{isAuthenticated ? 'Administrator access required' : 'Sign in to continue'}</h1>
      <p>{isAuthenticated ? 'This area is available to authorized administrators.' : 'Sign in with an administrator account to open this page.'}</p>
      <a href={isAuthenticated ? '/' : '/login'} onClick={onNavigate(isAuthenticated ? '/' : '/login')}>
        {isAuthenticated ? 'Return to the storefront' : 'Sign in'}
      </a>
    </section>
  )
}

function DebugErrorPage() {
  if (import.meta.env.DEV) throw new Error('Intentional error-boundary preview')
  return <p className="state-message">Debug route is available in development only.</p>
}

function RouteContent({
  path,
  storefront,
  onAdd,
  isAuthenticated,
  isAdmin,
  onLogin,
}: RouteProps) {
  usePageMetadata(path, storefront.identity.businessName)
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path
  if (normalizedPath.startsWith('/shops/')) {
    const slug = safeRouteId(normalizedPath.slice('/shops/'.length))
    return slug && /^[a-z0-9-]{1,100}$/.test(slug) ? <ShopsPage key={slug} slug={slug} /> : <NotFoundPage />
  }
  switch (normalizedPath) {
    case '/shops': return <ShopsPage key="directory" />
    case '/seller/products':
      return isAuthenticated ? <SellerCatalogPage key="seller-catalog" onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/seller/orders':
      return isAuthenticated ? <FulfillmentPage key="seller-fulfillment" audience="seller" onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/orders/shipments':
      return isAuthenticated ? <FulfillmentPage key="customer-fulfillment" audience="customer" onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/admin/fulfillment':
      return isAdmin ? <FulfillmentPage key="admin-fulfillment" audience="admin" onNavigate={navigate} /> : <AdminAccessRequired isAuthenticated={isAuthenticated} onNavigate={navigate} />
    case '/admin/seller-products':
      return isAdmin ? <SellerCatalogPage key="admin-catalog" admin onNavigate={navigate} /> : <AdminAccessRequired isAuthenticated={isAuthenticated} onNavigate={navigate} />
    case '/seller':
      return isAuthenticated ? <SellerPage key="seller" onNavigate={navigate} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
    case '/admin/sellers':
      return isAdmin ? <SellerPage key="seller-review" admin onNavigate={navigate} /> : <AdminAccessRequired isAuthenticated={isAuthenticated} onNavigate={navigate} />
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
      return <TrackOrderPage storefront={storefront} isAuthenticated={isAuthenticated} onNavigate={navigate} />
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
        <AdminAccessRequired isAuthenticated onNavigate={navigate} />
      )
    case '/privacy':
      return <PolicyPage storefront={storefront} policy="privacy" onNavigate={navigate} />
    case '/shipping':
      return <PolicyPage storefront={storefront} policy="shipping" onNavigate={navigate} />
    case '/cancellation':
      return <PolicyPage storefront={storefront} policy="cancellation" onNavigate={navigate} />
    case '/cookies':
      return <PolicyPage storefront={storefront} policy="cookies" onNavigate={navigate} />
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
          onNavigate={navigate}
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
        <AdminAccessRequired isAuthenticated={isAuthenticated} onNavigate={navigate} />
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

/** Load only the selected page; the surrounding site shell stays mounted. */
export function StorefrontRoute(props: RouteProps) {
  return (
    <Suspense fallback={<Box role="status" aria-live="polite" sx={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}><CircularProgress size={24} aria-hidden="true" /><Typography color="text.secondary">Loading page...</Typography></Box>}>
      <RouteContent {...props} />
    </Suspense>
  )
}
