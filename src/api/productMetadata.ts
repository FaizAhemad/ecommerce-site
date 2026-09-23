import { useEffect } from 'react'
import { canonicalOrigin, productMetadata, safeJson } from '../../server/api/_lib/seo'
import type { CatalogProduct } from '../config'
export function useProductMetadata(product: CatalogProduct | null, loading: boolean, failed: boolean) {
  useEffect(() => {
    const set = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
      if (!element) { element = document.createElement('meta'); element.setAttribute(attr, name); document.head.append(element) }
      element.content = content
    }
    document.getElementById('product-structured-data')?.remove()
    document.head.querySelectorAll('meta[property="og:image"],meta[property="og:url"],link[rel="canonical"]').forEach((element) => element.remove())
    if (!product || product.stock === undefined || product.priceMinor === undefined || failed) {
      document.title = `${loading ? 'Loading product' : failed ? 'Product unavailable' : 'Product not found'} | Gadgify`
      set('description', 'Browse Gadgify products.')
      set('robots', 'noindex, nofollow')
      set('og:title', document.title, true); set('og:description', 'Browse Gadgify products.', true)
      return
    }
    const origin = canonicalOrigin(import.meta.env.VITE_SITE_URL)
    const meta = productMetadata({ id: product.id, name: product.name, description: product.description ?? null,
      stock: product.stock, priceMinor: product.priceMinor, images: [...product.media.images], purchasable: product.purchase?.available }, origin)
    document.title = meta.title
    set('description', meta.description); set('og:title', meta.title, true); set('og:description', meta.description, true)
    set('og:type', 'product', true)
    set('robots', origin === window.location.origin ? 'index, follow' : 'noindex, nofollow')
    set('twitter:card', meta.images.length ? 'summary_large_image' : 'summary')
    if (meta.images[0]) set('og:image', meta.images[0], true)
    if (meta.url) { const link = document.createElement('link'); link.rel = 'canonical'; link.href = meta.url; document.head.append(link); set('og:url', meta.url, true) }
    if (meta.structuredData) { const script = document.createElement('script'); script.type = 'application/ld+json'; script.id = 'product-structured-data'; script.textContent = safeJson(meta.structuredData); document.head.append(script) }
  }, [product, loading, failed])
}
