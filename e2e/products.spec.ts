import { expect, test } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin

const products = Array.from({ length: 8 }, (_, index) => ({
  id: `e2e-products-${index + 1}`,
  name: `Synthetic useful product ${index + 1}`,
  category: index % 2 ? 'Accessories' : 'Home & Kitchen',
  price: 245 + index,
  priceMinor: (245 + index) * 100,
  rating: index % 2 === 0 ? 5 : 4,
  reviewCount: 0,
  colors: index % 2 === 0 ? ['Sage'] : ['Rose'],
  colorValues: index % 2 === 0 ? { Sage: '#7b8d75' } : { Rose: '#bf7777' },
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
  await expect(page.getByRole('heading', { level: 1, name: 'Made for the daily ritual' })).toBeVisible({ timeout: 15_000 })
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

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const positions = await loadingGrid.locator('article').evaluateAll((cards) => cards.slice(0, 2).map((card) => {
      const { x, y } = card.getBoundingClientRect()
      return { x, y }
    }))
    expect(positions[1].x).toBeGreaterThan(positions[0].x)
    expect(Math.abs(positions[1].y - positions[0].y)).toBeLessThan(1)
  }

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

  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'artifacts/page-review/products-loaded-desktop.png', fullPage: true, animations: 'disabled' })
})

test('Products sends no default filters and applies/clears combined server filters', async ({ page }) => {
  const productQueries: URLSearchParams[] = []
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
    if (url.pathname === '/api/products') {
      const query = new URLSearchParams(url.searchParams)
      productQueries.push(query)
      const selectedColors = query.get('colors')?.split(',') ?? []
      const selectedRatings = query.get('ratings')?.split(',').map(Number) ?? []
      let result = products.filter((product) =>
        (!query.has('search') || `${product.name} ${product.category}`.toLowerCase().includes(query.get('search')!.toLowerCase())) &&
        (!query.has('category') || product.category === query.get('category')) &&
        (!selectedColors.length || selectedColors.some((color) => product.colors?.includes(color))) &&
        (!selectedRatings.length || selectedRatings.some((rating) => product.rating >= rating)),
      )
      if (query.get('sort') === 'price-low') result = [...result].sort((left, right) => left.price - right.price)
      if (query.get('sort') === 'price-high') result = [...result].sort((left, right) => right.price - left.price)
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products: result, nextCursor: null }) })
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
  await expect(page.getByRole('heading', { level: 1, name: 'Made for the daily ritual' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('article')).toHaveCount(8)
  await expect.poll(() => productQueries.length).toBeGreaterThan(0)
  const defaults = productQueries[0]
  expect(defaults.get('sort')).toBe('newest')
  for (const key of ['search', 'category', 'colors', 'ratings', 'cursor']) expect(defaults.has(key)).toBe(false)

  await page.getByRole('button', { name: /^Filter/ }).click()
  const categoryOnly = page.waitForResponse((response) => {
    const query = new URL(response.url()).searchParams
    return new URL(response.url()).pathname === '/api/products' && query.get('category') === 'Accessories' && !query.has('colors') && !query.has('ratings')
  })
  await page.getByRole('combobox', { name: 'All categories' }).click()
  await page.getByRole('option', { name: 'Accessories' }).click()
  await categoryOnly
  await expect(page.getByRole('article')).toHaveCount(4)

  const colorOnly = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('category') === 'Accessories' && url.searchParams.get('colors') === 'Rose' && !url.searchParams.has('ratings')
  })
  await page.getByRole('checkbox', { name: 'Rose' }).check()
  await colorOnly
  await expect(page.getByRole('article')).toHaveCount(4)

  const resetBeforeRating = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('sort') === 'newest' && !url.searchParams.has('category') && !url.searchParams.has('colors') && !url.searchParams.has('ratings')
  })
  await page.getByRole('button', { name: 'Clear filters' }).first().click()
  await resetBeforeRating

  const ratingOnly = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('ratings') === '5' && !url.searchParams.has('category') && !url.searchParams.has('colors')
  })
  await page.getByRole('checkbox', { name: '5 stars' }).check()
  await ratingOnly
  await expect(page.getByRole('article')).toHaveCount(4)

  const resetResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('sort') === 'newest' && !url.searchParams.has('search') && !url.searchParams.has('category') && !url.searchParams.has('colors') && !url.searchParams.has('ratings')
  })
  await page.getByRole('button', { name: 'Clear filters' }).first().click()
  await resetResponse
  await expect(page.getByRole('article')).toHaveCount(8)

  const combinedResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('search') === 'product 1' && url.searchParams.get('category') === 'Home & Kitchen' && url.searchParams.get('colors') === 'Sage,Rose' && url.searchParams.get('ratings') === '5,4' && url.searchParams.get('sort') === 'price-high'
  })
  await page.getByRole('combobox', { name: 'All categories' }).click()
  await page.getByRole('option', { name: 'Home & Kitchen' }).click()
  await page.getByRole('checkbox', { name: 'Sage' }).check()
  await page.getByRole('checkbox', { name: 'Rose' }).check()
  await page.getByRole('checkbox', { name: '5 stars' }).check()
  await page.getByRole('checkbox', { name: '4 to under 5 stars' }).check()
  await page.getByRole('combobox', { name: 'Sort products' }).click()
  await page.getByRole('option', { name: 'Price: high to low' }).click()
  await page.getByRole('searchbox', { name: 'Search the collection' }).fill('product 1')
  await combinedResponse
  await expect(page.getByRole('article')).toHaveCount(1)
  expect(new URL(page.url()).searchParams.get('category')).toBe('Home & Kitchen')

  const resetCombinedResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('sort') === 'newest' && !url.searchParams.has('search') && !url.searchParams.has('category') && !url.searchParams.has('colors') && !url.searchParams.has('ratings')
  })
  await page.getByRole('button', { name: 'Clear filters' }).first().click()
  await resetCombinedResponse
  await expect(page.getByRole('article')).toHaveCount(8)
  expect(new URL(page.url()).searchParams.has('category')).toBe(false)

  const emptyResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/products' && url.searchParams.get('search') === 'nothing matches'
  })
  await page.getByRole('searchbox', { name: 'Search the collection' }).fill('nothing matches')
  await emptyResponse
  await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' }).first()).toBeVisible()
})

test('Products hides the color filter when the catalog has no color values', async ({ page }) => {
  const productsWithoutColors = products.map((product) => ({ ...product, colors: undefined, colorValues: undefined }))
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/categories') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ categories: ['Home & Kitchen', 'Accessories'] }) })
    }
    if (url.pathname === '/api/products') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products: productsWithoutColors, nextCursor: null }) })
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
  await expect(page.getByRole('heading', { level: 1, name: 'Made for the daily ritual' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('article')).toHaveCount(8)
  await page.getByRole('button', { name: /^Filter/ }).click()
  await expect(page.getByText('Color', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: /stars/ })).toHaveCount(5)
  await page.getByRole('button', { name: 'Close filters' }).click()

  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.getByRole('complementary', { name: 'Catalog filters' })).toBeVisible()
  await expect(page.getByText('Color', { exact: true })).toHaveCount(0)
})
