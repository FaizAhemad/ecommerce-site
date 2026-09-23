import { useEffect } from 'react'
const pages: Record<string, [string, string]> = {
  '/': ['Home', 'Explore Gadgify household products and everyday essentials.'],
  '/products': ['Products', 'Browse products, compare details and find everyday essentials.'],
  '/help': ['Help', 'Get help with your account, orders, payments and support requests.'],
  '/support': ['Support', 'Contact the store and track your support requests securely.'],
  '/privacy': ['Privacy policy', 'Read the published privacy policy.'],
  '/returns': ['Returns policy', 'Read the published returns policy.'],
  '/refund-policy': ['Refund policy', 'Read the published refund policy.'],
  '/terms': ['Terms and conditions', 'Read the published terms and conditions.'],
  '/shipping': ['Shipping policy', 'Read the published shipping policy.'],
  '/cancellation': ['Cancellation policy', 'Read the published cancellation policy.'],
  '/cookies': ['Cookie policy', 'Read the published cookie policy.'],
}
export function usePageMetadata(path: string, business: string) {
  useEffect(() => {
    const normalized = path === '/terms-and-conditions' ? '/terms' : path.replace(/\/+$/, '') || '/'
    if (/^\/product\/[^/]+$/.test(normalized)) return
    document.getElementById('product-structured-data')?.remove()
    document.head.querySelectorAll('meta[property="og:image"],meta[name="twitter:card"]').forEach((element) => element.remove())
    const page = Object.hasOwn(pages, normalized) ? pages[normalized] : undefined
    // Only use an explicitly configured origin for canonical URLs.
    let origin: string | null = null
    try {
      const url = new URL(String(import.meta.env.VITE_SITE_URL ?? ''))
      if (url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) origin = url.origin
    } catch { /* No configured canonical origin. */ }
    const indexable = !!page && (!origin || origin === window.location.origin)
    const title = `${page?.[0] ?? 'Account'} | ${business}`
    document.title = title
    const meta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attr, name); document.head.append(element) }
      element.content = content
    }
    meta('description', page?.[1] ?? 'Secure account services.')
    meta('robots', indexable ? 'index, follow' : 'noindex, nofollow')
    meta('og:title', title, true)
    meta('og:description', page?.[1] ?? 'Secure account services.', true)
    meta('og:type', 'website', true)
    document.head.querySelector('link[rel="canonical"]')?.remove()
    document.head.querySelector('meta[property="og:url"]')?.remove()
    if (indexable && origin) {
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'; canonical.href = origin + normalized; document.head.append(canonical)
      meta('og:url', canonical.href, true)
    }
  }, [path, business])
}
