import { useNotification } from './NotificationProvider'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { SocialLinks } from './SocialLinks'
import { PageContainer } from './PageContainer'
import { useTranslation } from 'react-i18next'

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
  const { content, identity, contact } = storefront
  const { t } = useTranslation()
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const headerActionsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      setShowStickyHeader(window.scrollY > 180)
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
        className={`${showStickyHeader ? 'site-header is-sticky' : 'site-header'}${isAuthenticated ? '' : ' guest-header'}`}
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
          <a className={currentPath === '/' ? 'is-active' : ''} href="/" onClick={navigate('/')}>
            {content.ui.homeLabel}
          </a>
          <a
            className={
              currentPath === '/products' || currentPath.startsWith('/product/') ? 'is-active' : ''
            }
            href="/products"
            onClick={navigate('/products')}
          >
            {content.navigation.products}
          </a>
          <a
            className={currentPath === '/support' ? 'is-active' : ''}
            href="/support"
            onClick={navigate('/support')}
          >
            {content.navigation.support}
          </a>
          {isAuthenticated && (
            <a
              className={
                currentPath === '/orders' || currentPath.startsWith('/orders/') ? 'is-active' : ''
              }
              href="/orders"
              onClick={navigate('/orders')}
            >
              Orders
            </a>
          )}

          {isAuthenticated && (
            <a
              className={currentPath === '/verify-email' ? 'is-active' : ''}
              href="/verify-email"
              onClick={navigate('/verify-email')}
            >
              Account email
            </a>
          )}
          {isAuthenticated && isAdmin && (
            <a
              className={currentPath === '/admin' ? 'is-active' : ''}
              href="/admin"
              onClick={navigate('/admin')}
            >
              Admin
            </a>
          )}
        </nav>
        <div className="header-actions" ref={headerActionsRef}>
          <button
            className="search-button"
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? 'Close search' : 'Search products'}
          >
            {searchOpen ? 'Ã—' : 'âŒ•'}
          </button>
          {searchOpen && (
            <form className="header-search" onSubmit={submitSearch}>
              <input
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('common:searchProducts')}
                aria-label={t('common:searchProducts')}
              />
            </form>
          )}

          <button
            className="cart-button"
            type="button"
            onClick={openCart}
            aria-label={`${t('common:cart')}, ${cartCount} ${t('common:items')}`}
          >
            <span className="nav-action-icon cart-icon" aria-hidden="true">
              🛒
            </span>
            <span className="nav-action-label">{t('common:cart')}</span>
            <span>{cartCount}</span>
          </button>
          {isAuthenticated ? (
            <button
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
              {loggingOut ? 'Logging out?' : t('common:logOut')}
            </button>
          ) : (
            <a className="header-auth-link" href="/login" onClick={navigate('/login')}>
              {t('common:signIn')}
            </a>
          )}
        </div>
      </header>
      <PageContainer path={currentPath}>{children}</PageContainer>
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
          <a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a>
          <a href={`tel:${contact.phone}`}>{contact.phone}</a>
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
          <a href="/orders" onClick={navigate('/orders')}>
            Orders
          </a>
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
        <button
          className="back-to-top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <span aria-hidden="true">↑</span>
        </button>
      )}
    </div>
  )
}
