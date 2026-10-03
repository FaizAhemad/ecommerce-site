import { expect, test } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin

const mainProduct = {
  id: 'pdp-main',
  name: 'Everyday kitchen towel set',
  description: 'Soft, absorbent cotton towels for everyday kitchen clean-up.',
  category: 'Home & Kitchen',
  price: 249,
  priceMinor: 24900,
  compareAtPriceMinor: 39900,
  rating: 4.5,
  reviewCount: 2,
  tone: 'sage',
  badge: '',
  stock: 8,
  purchase: { available: true, reason: null },
  seller: { isPlatform: true },
  colors: ['Sage'],
  colorValues: { Sage: '#86a578' },
  media: { images: [{ id: 'pdp-main-image', url: '/images/gadgify-home-kitchen.jpg', alt: 'Green kitchen towels', isPrimary: true }, { id: 'pdp-main-image-2', url: '/images/gadgify-home-kitchen.jpg', alt: 'Side view of kitchen towels', isPrimary: false }], videos: [] },
}

const relatedProduct = {
  ...mainProduct,
  id: 'pdp-related',
  name: 'Compact dish brush',
  description: 'A compact brush for daily dish washing.',
  compareAtPriceMinor: null,
  reviewCount: 0,
  media: { images: [{ id: 'pdp-related-image', url: '/images/gadgify-practical-gadgets.jpg', alt: 'Compact dish brush', isPrimary: true }], videos: [] },
}

test('Product Details matches catalog facts and links into related products', async ({ page }) => {
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()

    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: ['Home & Kitchen'] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [mainProduct, relatedProduct], nextCursor: null } })
    if (url.pathname === '/api/products/pdp-main' || url.pathname === '/api/products/pdp-related') {
      const product = url.pathname.endsWith('pdp-main') ? mainProduct : relatedProduct
      return route.fulfill({ json: { product } })
    }
    if (url.pathname === '/api/products/pdp-main/reviews') return route.fulfill({ json: { reviews: [
      { id: 'review-1', rating: 5, body: 'Useful towels.', createdAt: '2026-01-01T00:00:00.000Z', media: [], user: { name: 'Shopper One' } },
      { id: 'review-2', rating: 4, body: 'Good quality.', createdAt: '2026-01-02T00:00:00.000Z', media: [], user: { name: 'Shopper Two' } },
    ] } })
    if (url.pathname === '/api/auth/me') return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: { items: [] } } })
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/product/pdp-main')

  await expect(page.getByRole('heading', { level: 1, name: mainProduct.name })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'About this product' })).toBeVisible()
  await expect(page.getByText(mainProduct.description)).toBeVisible()
  await expect(page.getByText('38% off')).toBeVisible()
  await expect(page.getByText('Available')).toBeVisible()
  await expect(page.getByRole('img', { name: '5 stars' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'More from Home & Kitchen' })).toBeVisible()
  await page.getByRole('button', { name: /View larger image/ }).click()
  const gallery = page.getByRole('dialog', { name: mainProduct.name })
  await expect(gallery).toBeVisible()
  await expect(gallery.getByRole('heading', { name: mainProduct.name })).toBeVisible()
  await expect(gallery.getByText(mainProduct.description)).toBeVisible()
  const closeBounds = await gallery.getByRole('button', { name: 'Close product gallery' }).boundingBox()
  const countBounds = await gallery.getByText('1 / 2').boundingBox()
  expect(closeBounds).not.toBeNull()
  expect(countBounds).not.toBeNull()
  expect(closeBounds!.x).toBeGreaterThanOrEqual(countBounds!.x + countBounds!.width)
  await gallery.getByRole('button', { name: /Show image 2/ }).click()
  await page.screenshot({ path: 'artifacts/page-review/product-gallery-phone.png', fullPage: true, animations: 'disabled' })
  await page.keyboard.press('Escape')
  await page.screenshot({ path: 'artifacts/page-review/product-detail-phone.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: /View larger image/ }).click()
  await expect(page.getByRole('dialog', { name: mainProduct.name })).toBeVisible()
  await page.screenshot({ path: 'artifacts/page-review/product-gallery-desktop.png', fullPage: true, animations: 'disabled' })
  await page.getByRole('button', { name: 'Close product gallery' }).click()
  await page.screenshot({ path: 'artifacts/page-review/product-detail-desktop.png', fullPage: true, animations: 'disabled' })
  await page.getByRole('heading', { name: relatedProduct.name }).click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/product/pdp-related')
})
