import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { SocialLinks } from './SocialLinks'

type SiteLayoutProps = {
  storefront: StorefrontApiResponse
  cartCount: number
  wishlistCount: number
  isAuthenticated: boolean
  onLogout: () => void
  children: ReactNode
}

export function SiteLayout({ storefront, cartCount, wishlistCount, children, isAuthenticated, onLogout }: SiteLayoutProps) {
  const { content, identity, contact } = storefront
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const headerActionsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => { setShowStickyHeader(window.scrollY > 180); setShowBackToTop(window.scrollY > 600) }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onRouteChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onRouteChange)
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('popstate', onRouteChange) }
  }, [])
  useEffect(() => {
    if (!searchOpen) return
    const closeOnOutside = (event: PointerEvent) => { if (!headerActionsRef.current?.contains(event.target as Node)) setSearchOpen(false) }
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
    window.history.pushState({}, '', query ? `/products?search=${encodeURIComponent(query)}` : '/products')
    window.dispatchEvent(new PopStateEvent('popstate'))
    setSearchOpen(false)
  }

  return (
    <div className="site-shell">
      <header className={showStickyHeader ? 'site-header is-sticky' : 'site-header'}>
        <a className="brand" href="/" onClick={navigate('/')} aria-label={`${identity.appName} ${content.ui.homeLabel}`}>
          <span className="brand-mark">{identity.mark}</span><span>{identity.businessName}</span>
        </a>
        <nav aria-label="Primary navigation">
          <a className={currentPath==='/'?'is-active':''} href="/" onClick={navigate('/')}>{content.ui.homeLabel}</a>
          <a className={currentPath==='/products'||currentPath.startsWith('/product/')?'is-active':''} href="/products" onClick={navigate('/products')}>{content.navigation.products}</a>
          <a className={currentPath==='/support'?'is-active':''} href="/support" onClick={navigate('/support')}>{content.navigation.support}</a>
          {isAuthenticated ? <button className="header-link-button" type="button" onClick={() => { onLogout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) }}>{content.ui.logOutLabel}</button> : <a className={currentPath==='/login'||currentPath==='/signup'?'is-active':''} href="/login" onClick={navigate('/login')}>{content.ui.signInLabel}</a>}
        </nav>
        <div className="header-actions" ref={headerActionsRef}>
          <button className="search-button" type="button" onClick={() => setSearchOpen((open) => !open)} aria-label={searchOpen ? 'Close search' : 'Search products'}>{searchOpen ? 'Ã—' : 'âŒ•'}</button>{searchOpen && <form className="header-search" onSubmit={submitSearch}><input autoFocus autoComplete="off" spellCheck={false} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={content.ui.searchProductsLabel} aria-label={content.ui.searchProductsLabel} /></form>}<button className="wishlist-button-header" type="button" onClick={() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); window.history.pushState({}, '', '/wishlist'); window.dispatchEvent(new PopStateEvent('popstate')) }} aria-label={`${content.ui.wishlistLabel}, ${wishlistCount} items`}><span className="nav-action-icon" aria-hidden="true">♥</span><span className="nav-action-label">{content.ui.wishlistLabel}</span><b>{wishlistCount}</b></button>
          
          <button className="cart-button" type="button" onClick={openCart} aria-label={`${content.ui.cartLabel}, ${cartCount} ${content.ui.cartItemLabel}`}>
            <span className="nav-action-icon cart-icon" aria-hidden="true">🛒</span><span className="nav-action-label">{content.ui.cartLabel}</span><span>{cartCount}</span>
          </button>
                  {isAuthenticated ? <button className="header-auth-link" type="button" onClick={() => { onLogout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) }}>{content.ui.logOutLabel}</button> : <a className="header-auth-link" href="/login" onClick={navigate('/login')}>{content.ui.signInLabel}</a>}</div>
      </header>
      <main>{children}</main>
      <SocialLinks storefront={storefront} placement="rail" /><footer className="site-footer" id="footer">
        <div><span className="brand-mark">{identity.mark}</span><p>{identity.businessName}<br />{identity.tagline}</p></div>
        <div><p className="footer-label">{content.footer.customerCareLabel}</p><a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a><a href={`tel:${contact.phone}`}>{contact.phone}</a></div>
        <div><p className="footer-label">{content.footer.policiesLabel}</p><a href="/privacy" onClick={navigate('/privacy')}>{content.footer.privacyLabel}</a><a href="/returns" onClick={navigate('/returns')}>{content.footer.returnsLabel}</a></div>
        <div><p className="footer-label">Explore</p><a href="/" onClick={navigate('/')}>{content.ui.homeLabel}</a><a href="/products" onClick={navigate('/products')}>{content.navigation.products}</a><a href="/support" onClick={navigate('/support')}>{content.navigation.support}</a><a href="/orders" onClick={navigate('/orders')}>Orders</a><a href="/track-order" onClick={navigate('/track-order')}>Track order</a><a href="/cart" onClick={navigate('/cart')}>{content.ui.cartLabel}</a></div>
        <p className="copyright">{content.ui.copyrightPrefix} {content.footer.copyrightYear} {identity.businessName}</p>
      </footer>
      {showBackToTop && <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><span aria-hidden="true">↑</span></button>}
    </div>
  )
}
