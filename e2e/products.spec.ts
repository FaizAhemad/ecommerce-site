import { expect, test } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin

const products = Array.from({ length: 8 }, (_, index) => ({
  id: `e2e-products-${index + 1}`,
  name: `Synthetic useful product ${index + 1}`,
  category: index % 2 ? 'Accessories' : 'Home & Kitchen',
  price: 245 + index,
  priceMinor: (245 + index) * 100,
  rating: 0,
  reviewCount: 0,
  stock: 12,
  purchase: { available: true, reason: null },
  seller: { name: 'Gadgify', slug: 'gadgify', isPlatform: true },
  media: { images: [], videos: [] },
}))

test('Products mobile skeleton matches the loaded two-column grid', async ({ page }) => {
  let releaseProductQuery: (() => void) | undefined
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()

    if (url.pathname === '/api/categories') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ categories: ['Home & Kitchen', 'Accessories'] }) })
    }
    if (url.pathname === '/api/products' && !url.search) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products }) })
    }
    if (url.pathname === '/api/products' && url.searchParams.has('sort')) {
      await new Promise<void>((resolve) => { releaseProductQuery = resolve })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products, nextCursor: null }) })
    }
    if (url.pathname === '/api/auth/me') {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } }) })
    }
    if (url.pathname === '/api/cart' || url.pathname === '/api/wishlist') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ cart: { items: [] }, wishlist: { items: [] } }) })
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }) })
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/products')
  const loadingGrid = page.getByLabel('Loading products')
  await expect(loadingGrid).toBeVisible()
  await expect(loadingGrid.locator('article')).toHaveCount(8)

  const skeletonPositions = await loadingGrid.locator('article').evaluateAll((cards) => cards.slice(0, 2).map((card) => {
    const { x, y, width } = card.getBoundingClientRect()
    return { x, y, width }
  }))
  expect(skeletonPositions[1].x).toBeGreaterThan(skeletonPositions[0].x)
  expect(Math.abs(skeletonPositions[1].y - skeletonPositions[0].y)).toBeLessThan(1)
  await page.screenshot({ path: 'artifacts/page-review/products-loading-phone.png', fullPage: true, animations: 'disabled' })

  releaseProductQuery?.()
  await expect(page.getByRole('button', { name: 'Add to cart' }).first()).toBeVisible()
  const loadedCards = page.getByRole('article')
  await expect(loadedCards).toHaveCount(8)
  const loadedPositions = await loadedCards.evaluateAll((cards) => cards.slice(0, 2).map((card) => {
    const { x, y, width } = card.getBoundingClientRect()
    return { x, y, width }
  }))
  expect(loadedPositions[1].x).toBeGreaterThan(loadedPositions[0].x)
  expect(Math.abs(loadedPositions[1].y - loadedPositions[0].y)).toBeLessThan(1)
  await page.screenshot({ path: 'artifacts/page-review/products-loaded-phone.png', fullPage: true, animations: 'disabled' })

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const positions = await loadedCards.evaluateAll((cards) => cards.slice(0, 2).map((card) => {
      const { x, y } = card.getBoundingClientRect()
      return { x, y }
    }))
    expect(positions[1].x).toBeGreaterThan(positions[0].x)
    expect(Math.abs(positions[1].y - positions[0].y)).toBeLessThan(1)
  }
})
