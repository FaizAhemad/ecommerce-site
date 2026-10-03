import { useNotification } from './NotificationProvider'
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { SocialLinks } from './SocialLinks'
import { PageContainer } from './PageContainer'
import { useTranslation } from 'react-i18next'
import { Button } from './mui/Button'
import { IconButton } from './mui/IconButton'
import { TextField } from './mui/TextField'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
const SiteTour = lazy(() => import('./SiteTour').then(module => ({ default: module.SiteTour })))

function SearchIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15.5 15.5 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

type SiteLayoutProps = {
  storefront: StorefrontApiResponse
  cartCount: number
  wishlistCount: number
  isAuthenticated: boolean
  isAdmin: boolean
  onLogout: () => Promise<void>
  children: ReactNode
}

export function SiteLayout({
  storefront,
  cartCount,
  children,
  isAuthenticated,
  isAdmin,
  onLogout,
}: SiteLayoutProps) {
  const notify = useNotification()
  const logoutLock = useRef(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { content, identity } = storefront
  const { t } = useTranslation()
  const shopAccess = useQuery({
    queryKey: privateKey('shops-access'),
    enabled: isAuthenticated && !isAdmin,
    retry: false,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/shops/access', { signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Shop access unavailable')
      return await response.json() as { allowed: boolean }
    },
  })
  const canBrowseShops = isAdmin || shopAccess.data?.allowed === true
  const [showHeaderShadow, setShowHeaderShadow] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [tourActive, setTourActive] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const headerActionsRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const onScroll = () => {
      setShowHeaderShadow(window.scrollY > 8)
      setShowBackToTop(window.scrollY > 600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onRouteChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onRouteChange)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('popstate', onRouteChange)
    }
  }, [])
  useEffect(() => {
    if (!searchOpen) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!headerActionsRef.current?.contains(event.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [searchOpen])
  useEffect(() => {
    if (!searchOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setSearchOpen(false)
      searchButtonRef.current?.focus()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [searchOpen])
  const navigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  const openCart = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.history.pushState({}, '', '/cart')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.history.pushState(
      {},
      '',
      query ? `/products?search=${encodeURIComponent(query)}` : '/products',
    )
    window.dispatchEvent(new PopStateEvent('popstate'))
    setSearchOpen(false)
  }

  return (
    <div className="site-shell">
      <header
        className={`site-header${showHeaderShadow ? ' has-scroll-shadow' : ''}${isAuthenticated ? '' : ' guest-header'}`}
      >
        <a
          className="brand"
          href="/"
          onClick={navigate('/')}
          aria-label={`${identity.appName} ${content.ui.homeLabel}`}
        >
          <span className="brand-mark">{identity.mark}</span>
          <span>{identity.businessName}</span>
        </a>
        <nav aria-label="Primary navigation">
          <a
            aria-current={currentPath === '/' ? 'page' : undefined}
            className={currentPath === '/' ? 'is-active' : ''}
            href="/"
            onClick={navigate('/')}
          >
            {content.ui.homeLabel}
          </a>
          <a
            aria-current={
              currentPath === '/products' || currentPath.startsWith('/product/')
                ? 'page'
                : undefined
            }
            className={
              currentPath === '/products' || currentPath.startsWith('/product/') ? 'is-active' : ''
            }
            href="/products"
            onClick={navigate('/products')}
          >
            {content.navigation.products}
          </a>
          {canBrowseShops && <a
            aria-current={
              currentPath === '/shops' || currentPath.startsWith('/shops/') ? 'page' : undefined
            }
            className={
              currentPath === '/shops' || currentPath.startsWith('/shops/') ? 'is-active' : ''
            }
            href="/shops"
            onClick={navigate('/shops')}
          >
            Shops
          </a>}
          <a
            aria-current={
              currentPath === '/seller' || currentPath.startsWith('/seller/') ? 'page' : undefined
            }
            className={
              currentPath === '/seller' || currentPath.startsWith('/seller/') ? 'is-active' : ''
            }
            href="/seller"
            onClick={navigate('/seller')}
          >
            {isAuthenticated ? 'Seller workspace' : 'Sell with us'}
          </a>
          {isAuthenticated && (
            <a
              aria-current={
                currentPath === '/orders' || currentPath.startsWith('/orders/')
                  ? 'page'
                  : undefined
              }
              className={
                currentPath === '/orders' || currentPath.startsWith('/orders/') ? 'is-active' : ''
              }
              href="/orders"
              onClick={navigate('/orders')}
            >
              Orders
            </a>
          )}
          <a
            aria-current={
              currentPath === '/support' || currentPath === '/support-requests' ? 'page' : undefined
            }
            className={
              currentPath === '/support' || currentPath === '/support-requests' ? 'is-active' : ''
            }
            href="/support"
            onClick={navigate('/support')}
          >
            {content.navigation.support}
          </a>
          {isAuthenticated && (
            <a
              aria-current={currentPath === '/profile' ? 'page' : undefined}
              className={currentPath === '/profile' ? 'is-active' : ''}
              href="/profile"
              onClick={navigate('/profile')}
            >
              Profile
            </a>
          )}
          {isAdmin && (
            <a
              aria-current={currentPath.startsWith('/admin') ? 'page' : undefined}
              className={currentPath.startsWith('/admin') ? 'is-active' : ''}
              href="/admin"
              onClick={navigate('/admin')}
            >
              Admin
            </a>
          )}
        </nav>
        <div className="header-actions" ref={headerActionsRef}>
          <IconButton
            className="search-button"
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? 'Close search' : 'Search products'}
            aria-expanded={searchOpen}
            aria-controls="site-header-search"
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
          {searchOpen && (
            <form className="header-search" id="site-header-search" role="search" onSubmit={submitSearch}>
              <TextField
                className="header-search-field"
                autoFocus
                type="search"
                size="small"
                sx={{ flex: '1 1 auto', minWidth: 0, '& .MuiOutlinedInput-root': { minHeight: 44, bgcolor: 'background.paper' } }}
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('common:searchProducts')}
                aria-label={t('common:searchProducts')}
                variant="outlined"
                fullWidth
              />
              <Button
                variant="contained"
                className="header-search-submit"
                type="submit"
              >
                {t('common:search')}
              </Button>
              <IconButton
                className="header-search-close"
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  searchButtonRef.current?.focus()
                }}
                aria-label="Close search"
              >
                <CloseIcon />
              </IconButton>
            </form>
          )}

          <Button
            variant="outlined"
            className="cart-button"
            type="button"
            onClick={openCart}
            aria-label={`${t('common:cart')}, ${cartCount} ${t('common:items')}`}
          >
            <span className="nav-action-icon cart-icon" aria-hidden="true">
              🛒
            </span>
            <span className="nav-action-label">{t('common:cart')}</span>
            <span className="header-cart-count">{cartCount}</span>
          </Button>
          {isAuthenticated ? (
            <Button
              variant="outlined"
              className="header-auth-link"
              type="button"
              disabled={loggingOut}
              aria-busy={loggingOut}
              onClick={async () => {
                if (logoutLock.current) return
                logoutLock.current = true
                setLoggingOut(true)
                try {
                  await onLogout()
                  window.history.pushState({}, '', '/')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                } catch {
                  notify('Unable to log out. Please try again.')
                } finally {
                  logoutLock.current = false
                  setLoggingOut(false)
                }
              }}
            >
              {loggingOut ? 'Logging out...' : t('common:logOut')}
            </Button>
          ) : (
            <Button component="a" variant="outlined" className="header-auth-link" href="/login" onClick={navigate('/login')}>
              {t('common:signIn')}
            </Button>
          )}
        </div>
      </header>
      <PageContainer path={currentPath}>
        <div className="px-[var(--page-gutter)]">
            {(currentPath === '/support' || tourActive) && <Suspense fallback={null}><SiteTour path={currentPath} isAuthenticated={isAuthenticated} onActiveChange={setTourActive} /></Suspense>}
        </div>
        {children}
      </PageContainer>
      <SocialLinks storefront={storefront} placement="rail" />
      <footer className="site-footer" id="footer">
        <div>
          <span className="brand-mark">{identity.mark}</span>
          <p>
            {identity.businessName}
            <br />
            {identity.tagline}
          </p>
          <SocialLinks storefront={storefront} placement="footer" />
        </div>
        <div>
          <p className="footer-label">{content.footer.customerCareLabel}</p>
          <a href="/support" onClick={navigate('/support')}>
            Contact support
          </a>
          <p>{storefront.contact.supportEmail}</p>
        </div>
        <div>
          <p className="footer-label">{content.footer.policiesLabel}</p>
          <a href="/privacy" onClick={navigate('/privacy')}>
            {content.footer.privacyLabel}
          </a>
          <a href="/returns" onClick={navigate('/returns')}>
            {content.footer.returnsLabel}
          </a>
          <a href="/refund-policy" onClick={navigate('/refund-policy')}>
            Refund Policy
          </a>
          <a href="/terms" onClick={navigate('/terms')}>
            Terms &amp; Conditions
          </a>
          <a href="/shipping" onClick={navigate('/shipping')}>Shipping</a>
          <a href="/cancellation" onClick={navigate('/cancellation')}>Cancellation</a>
          <a href="/cookies" onClick={navigate('/cookies')}>Cookies</a>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <a href="/" onClick={navigate('/')}>
            {content.ui.homeLabel}
          </a>
          <a href="/products" onClick={navigate('/products')}>
            {content.navigation.products}
          </a>
          <a href="/support" onClick={navigate('/support')}>
            {content.navigation.support}
          </a>
          {isAuthenticated && <a href="/orders" onClick={navigate('/orders')}>Orders</a>}
          <a href="/track-order" onClick={navigate('/track-order')}>
            Track order
          </a>
          <a href="/cart" onClick={navigate('/cart')}>
            {t('common:cart')}
          </a>
        </div>
        <p className="copyright">
          {content.ui.copyrightPrefix} {content.footer.copyrightYear} {identity.businessName}
        </p>
      </footer>
      {showBackToTop && (
        <IconButton
          className="back-to-top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <span aria-hidden="true">↑</span>
        </IconButton>
      )}
    </div>
  )
}
