import type { MouseEvent } from 'react'
import type { StorefrontApiResponse } from './api/storefront'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { SupportPage } from './pages/SupportPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { BagPage } from './pages/BagPage'
import { PolicyPage } from './pages/PolicyPage'
import { PaymentPage } from './pages/PaymentPage'

type RouteProps = {
  path: string
  storefront: StorefrontApiResponse
  onAdd: () => void
}

const navigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
  navigateTo(path)
}

const navigateTo = (path: string) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function StorefrontRoute({ path, storefront, onAdd }: RouteProps) {
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, '') : path
  switch (normalizedPath) {
    case '/bag':
      return <BagPage storefront={storefront} onNavigate={navigate} />
    case '/checkout':
      return <PaymentPage storefront={storefront} onNavigate={navigate} />
    case '/privacy':
      return <PolicyPage storefront={storefront} policy="privacy" onNavigate={navigate} />
    case '/returns':
      return <PolicyPage storefront={storefront} policy="returns" onNavigate={navigate} />
    case '/shop':
      return <ShopPage storefront={storefront} onAdd={onAdd} onOpenProduct={(id) => navigateTo(`/product/${id}`)} />
    case '/support':
      return <SupportPage storefront={storefront} />
    default:
      if (normalizedPath.startsWith('/product/')) return <ProductDetailPage key={normalizedPath} storefront={storefront} productId={decodeURIComponent(normalizedPath.slice('/product/'.length))} onAdd={onAdd} onNavigate={navigate} />
      return <HomePage storefront={storefront} onNavigate={navigate} />
  }
}
