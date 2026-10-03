import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin
const customer = { id: 'e2e-cart-customer', role: 'CUSTOMER' }
const product = { id: 'e2e-cart-product', name: 'Synthetic travel cup', category: 'Home & Kitchen', priceMinor: 24500, images: [] }
const savedItem = { id: 'e2e-cart-row', quantity: 1, product }

async function mockCart(page: Page, options: { authenticated?: boolean; empty?: boolean; failUpdate?: boolean } = {}) {
  const writes: Array<{ method: string; body?: Record<string, unknown> }> = []
  let items = options.empty ? [] : [savedItem]
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    const method = request.method()
    const body = method === 'GET' ? undefined : request.postDataJSON()
    if (method !== 'GET') writes.push({ method, body })
    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: [] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [] } })
    if (url.pathname === '/api/auth/me') return options.authenticated
      ? route.fulfill({ json: { user: customer } })
      : route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { csrfToken: 'a'.repeat(64) } })
    if (url.pathname === '/api/cart') {
      if (method === 'PATCH' || method === 'POST' || method === 'DELETE') {
        if (options.failUpdate) return route.fulfill({ status: 503, json: { error: { code: 'CART_UNAVAILABLE', message: 'Cart is temporarily unavailable.' } } })
        if (method === 'DELETE') items = []
        else items = [{ ...savedItem, quantity: Number(body?.quantity ?? 1) }]
      }
      return route.fulfill({ json: { cart: { items } } })
    }
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
  return writes
}

test.describe('Cart', () => {
  test('guest route requires sign-in and makes no cart writes', async ({ page }) => {
    const writes = await mockCart(page)
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    expect(writes.filter((item) => item.method !== 'GET')).toHaveLength(0)
  })

  test('empty cart offers a clear way back to products', async ({ page }) => {
    await mockCart(page, { authenticated: true, empty: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/cart')
    await expect(page.getByText('Your selected products will appear here.')).toBeVisible()
    await expect(page.getByRole('link', { name: /continue shopping/i }).first()).toHaveAttribute('href', '/products')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/cart-empty-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('saved cart shows the server-backed total and responsive controls', async ({ page }) => {
    await mockCart(page, { authenticated: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: 'Synthetic travel cup' })).toBeVisible()
    await expect(page.getByText('₹245')).toBeVisible()
    await expect(page.getByRole('link', { name: /Proceed to checkout/i })).toHaveAttribute('href', '/checkout')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/cart-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('failed quantity update rolls back to the saved cart quantity', async ({ page }) => {
    const writes = await mockCart(page, { authenticated: true, failUpdate: true })
    await page.goto('/cart')
    await page.getByRole('button', { name: 'Increase quantity' }).click()
    await expect(page.getByRole('group', { name: '1 item in cart' })).toBeVisible()
    expect(writes.filter((item) => item.method === 'PATCH')).toHaveLength(1)
  })
})

