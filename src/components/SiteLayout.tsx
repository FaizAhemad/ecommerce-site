import { useNotification } from './NotificationProvider'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { SocialLinks } from './SocialLinks'
import { PageContainer } from './PageContainer'
import { SiteTour } from './SiteTour'
import { useTranslation } from 'react-i18next'

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
  onLogout: () => Promise<void>
  children: ReactNode
}

export function SiteLayout({
  storefront,
  cartCount,
  children,
  isAuthenticated,
  onLogout,
}: SiteLayoutProps) {
  const notify = useNotification()
  const logoutLock = useRef(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { content, identity } = storefront
  const { t } = useTranslation()
  const [showHeaderShadow, setShowHeaderShadow] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
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
            className={
              currentPath === '/orders' || currentPath.startsWith('/orders/') ? 'is-active' : ''
            }
            href="/orders"
            onClick={navigate('/orders')}
          >
            Orders
          </a>
          <a
            className={currentPath === '/support' ? 'is-active' : ''}
            href="/support"
            onClick={navigate('/support')}
          >
            {content.navigation.support}
          </a>
        </nav>
        <div className="header-actions" ref={headerActionsRef}>
          <button
            className="search-button inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-white"
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? 'Close search' : 'Search products'}
            aria-expanded={searchOpen}
            aria-controls="site-header-search"
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>
          {searchOpen && (
            <form className="header-search" id="site-header-search" role="search" onSubmit={submitSearch}>
              <input
                className="min-h-11 flex-1"
                autoFocus
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('common:searchProducts')}
                aria-label={t('common:searchProducts')}
              />
              <button
                className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[var(--ink)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                type="submit"
              >
                {t('common:search')}
              </button>
              <button
                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md border border-transparent bg-transparent text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  searchButtonRef.current?.focus()
                }}
                aria-label="Close search"
              >
                <CloseIcon />
              </button>
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
              {loggingOut ? 'Logging out...' : t('common:logOut')}
            </button>
          ) : (
            <a className="header-auth-link" href="/login" onClick={navigate('/login')}>
              {t('common:signIn')}
            </a>
          )}
        </div>
      </header>
      <PageContainer path={currentPath}>
        <div className="px-[var(--page-gutter)]">
            <SiteTour path={currentPath} isAuthenticated={isAuthenticated} />
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
