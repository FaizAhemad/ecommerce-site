import { useEffect, useState, type ReactNode } from 'react'
import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { SocialLinks } from './SocialLinks'

type SiteLayoutProps = {
  storefront: StorefrontApiResponse
  cartCount: number
  isAuthenticated: boolean
  onLogout: () => void
  children: ReactNode
}

export function SiteLayout({ storefront, cartCount, children, isAuthenticated, onLogout }: SiteLayoutProps) {
  const { content, identity, contact } = storefront
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    const onScroll = () => { setShowStickyHeader(window.scrollY > 180); setShowBackToTop(window.scrollY > 600) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const navigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  const openBag = () => {
    window.history.pushState({}, '', '/bag')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="site-shell">
      <header className={showStickyHeader ? 'site-header is-sticky' : 'site-header'}>
        <a className="brand" href="/" onClick={navigate('/')} aria-label={`${identity.appName} ${content.ui.homeLabel}`}>
          <span className="brand-mark">{identity.mark}</span><span>{identity.businessName}</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/shop" onClick={navigate('/shop')}>{content.navigation.shop}</a>
          <a href="/support" onClick={navigate('/support')}>{content.navigation.support}</a>
          {isAuthenticated ? <button className="header-link-button" type="button" onClick={() => { onLogout(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) }}>Log out</button> : <a href="/login" onClick={navigate('/login')}>Sign in</a>}
        </nav>
        <div className="header-actions">
          <button className="cart-button" type="button" onClick={openBag} aria-label={`${content.ui.bagLabel}, ${cartCount} ${content.ui.bagItemLabel}`}>
            {content.ui.bagLabel} <span>{cartCount}</span>
          </button>
        </div>
      </header>
      <main>{children}</main>
      <SocialLinks storefront={storefront} placement="rail" /><footer className="site-footer" id="footer">
        <div><span className="brand-mark">{identity.mark}</span><p>{identity.businessName}<br />{identity.tagline}</p></div>
        <div><p className="footer-label">{content.footer.customerCareLabel}</p><a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a><a href={`tel:${contact.phone}`}>{contact.phone}</a></div>
        <div><p className="footer-label">{content.footer.policiesLabel}</p><a href="/privacy" onClick={navigate('/privacy')}>{content.footer.privacyLabel}</a><a href="/returns" onClick={navigate('/returns')}>{content.footer.returnsLabel}</a></div>
        <div><p className="footer-label">Explore</p><a href="/" onClick={navigate('/')}>{content.ui.homeLabel}</a><a href="/shop" onClick={navigate('/shop')}>{content.navigation.shop}</a><a href="/support" onClick={navigate('/support')}>{content.navigation.support}</a><a href="/orders" onClick={navigate('/orders')}>Orders</a><a href="/track-order" onClick={navigate('/track-order')}>Track order</a><a href="/bag" onClick={navigate('/bag')}>{content.ui.bagLabel}</a></div>
        <p className="copyright">{content.ui.copyrightPrefix} {content.footer.copyrightYear} {identity.businessName}</p>
      </footer>
      {showBackToTop && <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><span aria-hidden="true">↑</span></button>}
    </div>
  )
}
