import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin
const token = 'c'.repeat(64)

async function mockRecovery(page: Page, outcome: 'success' | 'failure' | 'expired' = 'success') {
  const writes: string[] = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (request.method() !== 'GET') writes.push(url.pathname)
    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: [] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [] } })
    if (url.pathname === '/api/auth/me') return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { csrfToken: 'd'.repeat(64) } })
    if (url.pathname === '/api/auth/password-reset-request') {
      return outcome === 'failure'
        ? route.fulfill({ status: 503, json: { error: { code: 'RECOVERY_UNAVAILABLE', message: 'Password recovery is temporarily unavailable.' } } })
        : route.fulfill({ json: { accepted: true } })
    }
    if (url.pathname === '/api/auth/password-reset') {
      return outcome === 'expired'
        ? route.fulfill({ status: 400, json: { error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or expired. Request a new link.' } } })
        : route.fulfill({ json: { reset: true } })
    }
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
  return writes
}

test.describe('Password recovery', () => {
  test('forgot-password response is neutral and its page is responsive', async ({ page }) => {
    const writes = await mockRecovery(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/forgot-password')
    await page.getByRole('textbox', { name: 'Email address' }).fill('unknown@example.test')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByRole('status')).toContainText('If an account uses that email')
    expect(writes.filter((path) => path === '/api/auth/password-reset-request')).toHaveLength(1)
    await page.screenshot({ path: 'artifacts/page-review/forgot-password-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('forgot-password errors preserve the email draft', async ({ page }) => {
    await mockRecovery(page, 'failure')
    await page.goto('/forgot-password')
    await page.getByRole('textbox', { name: 'Email address' }).fill('customer@example.test')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByRole('alert')).toHaveText('Password recovery is temporarily unavailable.')
    await expect(page.getByRole('textbox', { name: 'Email address' })).toHaveValue('customer@example.test')
  })

  test('missing reset token offers a fresh recovery link and removes invalid token from URL', async ({ page }) => {
    await mockRecovery(page)
    await page.goto('/reset-password?token=invalid')
    await expect(page.getByRole('heading', { level: 1, name: 'Reset your password' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Request a reset link' })).toHaveAttribute('href', '/forgot-password')
    await expect(page).toHaveURL(`${localOrigin}/reset-password`)
  })

  test('reset password validates confirmation and preserves the form', async ({ page }) => {
    const writes = await mockRecovery(page)
    await page.goto(`/reset-password#token=${token}`)
    await expect(page).toHaveURL(`${localOrigin}/reset-password`)
    await page.getByRole('textbox', { name: 'New password' }).fill('synthetic-password')
    await page.getByRole('textbox', { name: 'Confirm new password' }).fill('different-password')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page.getByRole('alert')).toHaveText('The passwords do not match.')
    await expect(page.getByRole('textbox', { name: 'New password' })).toHaveValue('synthetic-password')
    expect(writes.filter((path) => path === '/api/auth/password-reset')).toHaveLength(0)
    await page.screenshot({ path: 'artifacts/page-review/reset-password-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('expired reset token keeps the draft and never leaves the token in the address bar', async ({ page }) => {
    await mockRecovery(page, 'expired')
    await page.goto(`/reset-password#token=${token}`)
    await page.getByRole('textbox', { name: 'New password' }).fill('synthetic-password')
    await page.getByRole('textbox', { name: 'Confirm new password' }).fill('synthetic-password')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page.getByRole('alert')).toContainText('invalid or expired')
    await expect(page.getByRole('textbox', { name: 'New password' })).toHaveValue('synthetic-password')
    await expect(page).toHaveURL(`${localOrigin}/reset-password`)
  })

  test('successful reset navigates to regular login with a confirmation message', async ({ page }) => {
    await mockRecovery(page)
    await page.goto(`/reset-password#token=${token}`)
    await page.getByRole('textbox', { name: 'New password' }).fill('synthetic-password')
    await page.getByRole('textbox', { name: 'Confirm new password' }).fill('synthetic-password')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page).toHaveURL(`${localOrigin}/login?passwordReset=success`)
    await expect(page.getByRole('status')).toContainText('Your password has been reset')
  })
})
