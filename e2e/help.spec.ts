import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin

async function installPublicMocks(page: Page) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/auth/me') return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: [] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [], nextCursor: null } })
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: { items: [] } } })
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
}

test('public help gives clear routes and the tour starts only when requested', async ({ page }) => {
  await installPublicMocks(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/help')
  await expect(page.getByRole('heading', { name: 'How can we help?' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open' }).nth(1)).toHaveAttribute('href', '/track-order')
  await expect(page.getByRole('dialog', { name: 'Website tour' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Open Support and start the website tour' }).click()
  await expect(page).toHaveURL(/\/support$/)
  await expect(page.getByRole('dialog', { name: 'Website tour' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start with Support' })).toBeFocused()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'artifacts/page-review/help-tour-phone.png', fullPage: true, animations: 'disabled' })
})

test('tour stays available between routes and exits without persistent state', async ({ page }) => {
  await installPublicMocks(page)
  await page.goto('/support')
  await page.getByRole('button', { name: 'Take a website tour' }).click()
  await page.getByRole('button', { name: 'Next: Home' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('dialog', { name: 'Website tour' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Visit the home page' })).toBeFocused()
  await page.getByRole('button', { name: 'Next: Products' }).click()
  await expect(page).toHaveURL(/\/products$/)
  await expect(page.getByRole('heading', { name: 'Explore products' })).toBeFocused()
  await page.getByRole('button', { name: 'Exit tour' }).click()
  await expect(page.getByRole('dialog', { name: 'Website tour' })).toHaveCount(0)
})
