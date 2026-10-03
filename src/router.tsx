import type { SessionUser } from './api/sessionScope'
import { lazy, Suspense, useEffect, type MouseEvent } from 'react'
import { BrandedPageLoader } from './components/mui/BrandedPageLoader'
import type { StorefrontApiResponse } from './api/storefront'
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })))
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })))
const PolicyPage = lazy(() => import('./pages/PolicyPage').then((module) => ({ default: module.PolicyPage })))
const HelpPage = lazy(() => import('./pages/HelpPage').then((module) => ({ default: module.HelpPage })))
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
const NotFoundPage = lazy(() => import('./components/RouteFallbacks').then((module) => ({ default: module.NotFoundPage })))
const AdminAccessRequired = lazy(() => import('./components/RouteFallbacks').then((module) => ({ default: module.AdminAccessRequired })))
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
  return <BrandedPageLoader message="Opening the admin workspace" />
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
    if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) return <NotFoundPage />
    return isAuthenticated ? <ShopsPage key={slug} slug={slug} admin={isAdmin} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
  }
  switch (normalizedPath) {
    case '/shops': return isAuthenticated ? <ShopsPage key="directory" admin={isAdmin} /> : <AuthPage mode="login" storefront={storefront} onNavigate={navigate} onLogin={onLogin} />
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
    case '/help':
      return <HelpPage />
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
            onOpenProduct={(id) => navigateTo(`/product/${id}`)}
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
    <Suspense fallback={<BrandedPageLoader />}>
      <RouteContent {...props} />
    </Suspense>
  )
}
