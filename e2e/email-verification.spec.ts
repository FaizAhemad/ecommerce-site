import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin
const emailToken = 'e'.repeat(64)
const customer = { id: 'e2e-email-customer', email: 'customer@example.test', role: 'CUSTOMER', emailVerified: false }

async function mockVerification(page: Page, options: { authenticated?: boolean; failResend?: boolean; hasEmail?: boolean } = {}) {
  const writes: string[] = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (request.method() !== 'GET') writes.push(url.pathname)
    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: [] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [] } })
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { csrfToken: 'f'.repeat(64) } })
    if (url.pathname === '/api/auth/me') {
      return options.authenticated
        ? route.fulfill({ json: { user: { ...customer, email: options.hasEmail === false ? null : customer.email } } })
        : route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    }
    if (url.pathname === '/api/auth/verify-email') return route.fulfill({ json: { verified: true } })
    if (url.pathname === '/api/auth/email-verification-request') {
      return options.failResend
        ? route.fulfill({ status: 503, json: { error: { code: 'EMAIL_UNAVAILABLE', message: 'Email verification is temporarily unavailable.' } } })
        : route.fulfill({ status: 202, json: { accepted: true } })
    }
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: { items: [] } } })
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
  return writes
}

test.describe('Email verification', () => {
  test('guest confirms a one-time link explicitly and token is removed from the URL', async ({ page }) => {
    const writes = await mockVerification(page)
    await page.goto(`/verify-email#token=${emailToken}`)
    await expect(page).toHaveURL(`${localOrigin}/verify-email`)
    await expect(page.getByRole('button', { name: 'Verify email' })).toBeVisible()
    await page.getByRole('button', { name: 'Verify email' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'is now verified' })).toBeVisible()
    expect(writes).toContain('/api/auth/verify-email')
    await expect(page.getByRole('link', { name: /Sign in to view/i })).toBeVisible()
  })

  test('signed-in customer sees email status and receives neutral resend confirmation', async ({ page }) => {
    const writes = await mockVerification(page, { authenticated: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/verify-email')
    await expect(page.getByText('Account email: customer@example.test')).toBeVisible()
    await expect(page.getByText('Email not verified')).toBeVisible()
    await page.getByRole('button', { name: 'Send a new verification link' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Check your inbox and spam folder' })).toBeVisible()
    expect(writes.filter((path) => path === '/api/auth/email-verification-request')).toHaveLength(1)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/email-verification-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('resend failures retain a safe inline error and do not claim email delivery', async ({ page }) => {
    await mockVerification(page, { authenticated: true, failResend: true })
    await page.goto('/verify-email')
    await expect(page.getByText('Account email: customer@example.test')).toBeVisible()
    await page.getByRole('button', { name: 'Send a new verification link' }).click()
    await expect(page.getByRole('alert')).toContainText('Email verification is temporarily unavailable.')
    await expect(page.getByText('Email not verified')).toBeVisible()
  })

  test('mobile-only account is told email verification is unavailable', async ({ page }) => {
    await mockVerification(page, { authenticated: true, hasEmail: false })
    await page.goto('/verify-email')
    await expect(page.getByText('This account has no email address. Email verification is unavailable.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send a new verification link' })).toHaveCount(0)
  })
})

