import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin
const csrf = 'b'.repeat(64)

async function mockLogin(page: Page, outcome: 'invalid' | 'rate-limit' | 'success' | 'admin-success' | 'signup-success' | 'signup-conflict' = 'invalid') {
  const writes: Array<{ path: string; body?: unknown }> = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    const method = request.method()
    const body = method === 'GET' ? undefined : request.postDataJSON()
    if (method !== 'GET') writes.push({ path: url.pathname, body })
    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: [] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [] } })
    if (url.pathname === '/api/auth/me') return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { csrfToken: csrf } })
    if (url.pathname === '/api/auth/signup') {
      if (outcome === 'signup-conflict') return route.fulfill({ status: 409, json: { error: { code: 'CONFLICT', message: 'An account with this contact already exists.' } } })
      if (outcome === 'signup-success') return route.fulfill({ status: 201, json: { user: { id: 'e2e-signup-customer', role: 'CUSTOMER' } } })
    }
    if (url.pathname === '/api/auth/login') {
      if (outcome === 'rate-limit') return route.fulfill({ status: 429, headers: { 'Retry-After': '30' }, json: { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } } })
      if (outcome === 'success' || outcome === 'admin-success') return route.fulfill({ json: { user: { id: outcome === 'admin-success' ? 'e2e-login-admin' : 'e2e-login-customer', role: outcome === 'admin-success' ? 'ADMIN' : 'CUSTOMER' } } })
      return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHORIZED', message: 'Email or password is incorrect.' } } })
    }
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: { items: [] } } })
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
  return writes
}

test.describe('Login', () => {
  test('keeps the shared guest sign-in card the same width from Login and protected Cart routes', async ({ page }) => {
    await mockLogin(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/login')
    const loginCard = await page.locator('.auth-card').boundingBox()
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    const cartCard = await page.locator('.auth-card').boundingBox()
    expect(loginCard?.width).toBe(cartCard?.width)
    expect(loginCard?.width).toBeGreaterThan(500)
  })

  test('renders secure sign-in guidance and responsive controls', async ({ page }) => {
    await mockLogin(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login?passwordReset=success')
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Your password has been reset')
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password')
    await expect(page.getByRole('button', { name: 'Email' })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/login-phone.png', fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/login-desktop.png', fullPage: true, animations: 'disabled' })
  })

  test('wrong credentials show a safe message and preserve the draft', async ({ page }) => {
    const writes = await mockLogin(page, 'invalid')
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('customer@example.test')
    await page.getByLabel('Password').fill('synthetic-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.')
    await expect(page.getByRole('textbox', { name: /email/i })).toHaveValue('customer@example.test')
    await expect(page.getByLabel('Password')).toHaveValue('synthetic-password')
    expect(writes.filter((item) => item.path === '/api/auth/login')).toHaveLength(1)
  })

  test('mobile contact choice validates and submits a mobile identifier', async ({ page }) => {
    const writes = await mockLogin(page, 'invalid')
    await page.goto('/login')
    await page.getByRole('button', { name: 'Mobile' }).click()
    const mobile = page.getByRole('textbox', { name: 'Mobile number' })
    await expect(mobile).toHaveAttribute('type', 'tel')
    await mobile.fill('+919876543210')
    await page.getByLabel('Password').fill('synthetic-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    expect(writes.find((item) => item.path === '/api/auth/login')?.body).toMatchObject({ identifier: '+919876543210', password: 'synthetic-password' })
  })

  test('rate limiting is explained without clearing credentials', async ({ page }) => {
    await mockLogin(page, 'rate-limit')
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('customer@example.test')
    await page.getByLabel('Password').fill('synthetic-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toContainText('Too many requests. Please try again in 30 seconds.')
    await expect(page.getByLabel('Password')).toHaveValue('synthetic-password')
  })

  test('successful customer login returns to the storefront', async ({ page }) => {
    await mockLogin(page, 'success')
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('customer@example.test')
    await page.getByLabel('Password').fill('synthetic-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(`${localOrigin}/`)
    await expect(page.getByRole('heading', { level: 1, name: 'Good finds for everyday life.' })).toBeVisible()
  })
})

test('successful administrator login goes to the protected admin workspace', async ({ page }) => {
  await mockLogin(page, 'admin-success')
  await page.goto('/login')
  await page.getByRole('textbox', { name: /email/i }).fill('admin@example.test')
  await page.getByLabel('Password').fill('synthetic-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(`${localOrigin}/admin`)
  await expect(page.getByRole('heading', { name: /admin/i }).first()).toBeVisible()
})

test('signup bounds profile input and sends the selected email contact', async ({ page }) => {
  const writes = await mockLogin(page, 'signup-success')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/signup')
  await expect(page.getByRole('heading', { level: 1, name: 'Create your account' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Full name' }).fill('Synthetic Customer')
  await page.getByRole('textbox', { name: 'Email address' }).fill('customer@example.test')
  await page.getByLabel('Password').fill('synthetic-password')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page).toHaveURL(`${localOrigin}/`)
  expect(writes.find((item) => item.path === '/api/auth/signup')?.body).toMatchObject({ name: 'Synthetic Customer', email: 'customer@example.test', verificationMethod: 'email' })
})

test('signup duplicate contact message is safe and retains entered values', async ({ page }) => {
  await mockLogin(page, 'signup-conflict')
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Full name' }).fill('Synthetic Customer')
  await page.getByRole('textbox', { name: 'Email address' }).fill('customer@example.test')
  await page.getByLabel('Password').fill('synthetic-password')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page.getByRole('alert')).toHaveText('An account with this contact already exists.')
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue('Synthetic Customer')
  await expect(page.getByLabel('Password')).toHaveValue('synthetic-password')
})

