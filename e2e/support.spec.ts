import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin
const customer = { id: 'e2e-support-customer', name: 'Synthetic Customer', email: 'customer@example.test', role: 'CUSTOMER' }
const ticketId = '713ae1de-9b66-4800-8ca3-bc432f223804'
const token = 'a'.repeat(64)

async function installSupportMocks(page: Page, options: { authenticated?: boolean; failCreate?: boolean; tickets?: unknown[] } = {}) {
  const writes: Array<{ method: string; path: string; body?: unknown }> = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    const method = request.method()
    const body = method === 'GET' ? undefined : request.postDataJSON()
    if (method !== 'GET') writes.push({ method, path: url.pathname, body })

    if (url.pathname === '/api/categories') return route.fulfill({ json: { categories: [] } })
    if (url.pathname === '/api/products') return route.fulfill({ json: { products: [] } })
    if (url.pathname === '/api/auth/me') {
      return options.authenticated
        ? route.fulfill({ json: { user: customer } })
        : route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    }
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { csrfToken: token } })
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: { items: [] } } })
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    if (url.pathname === '/api/support' && method === 'GET') {
      return route.fulfill({ json: { tickets: options.tickets ?? [], nextPage: null } })
    }
    if (url.pathname === '/api/support' && method === 'POST') {
      if (options.failCreate) {
        return route.fulfill({ status: 503, json: { error: { code: 'SUPPORT_UNAVAILABLE', message: 'Support requests are temporarily unavailable. Please check the current status before trying again.' } } })
      }
      return route.fulfill({ status: 201, json: { ticket: { id: ticketId, subject: body?.subject, body: body?.body, status: 'OPEN', resolution: null, emailStatus: 'UNCONFIRMED', createdAt: '2026-10-03T00:00:00.000Z', updatedAt: '2026-10-03T00:00:00.000Z' } } })
    }
    if (url.pathname === '/api/support-attachments') return route.fulfill({ json: { attachments: [] } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
  return writes
}

test.describe('Support pages', () => {
  test('guest help page is usable on phones and directs private requests to sign-in', async ({ page }) => {
    await installSupportMocks(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/support')
    await expect(page.getByRole('heading', { level: 1, name: 'Support, made simple.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' }).last()).toHaveAttribute('href', '/login')
    await expect(page.getByRole('link', { name: 'Sign in for your orders' })).toHaveAttribute('href', '/login')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/support-phone.png', fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/support-desktop.png', fullPage: true, animations: 'disabled' })
  })

  test('customer support request preserves accurate saved and email wording', async ({ page }) => {
    const writes = await installSupportMocks(page, { authenticated: true })
    await page.goto('/support')
    await page.getByRole('textbox', { name: 'Subject' }).fill('Question about delivery')
    await page.getByRole('textbox', { name: 'How can we help?' }).fill('Please share the latest delivery update.')
    await page.getByRole('button', { name: 'Send support request' }).click()
    await expect(page.getByRole('heading', { name: 'Request recorded' })).toBeVisible()
    await expect(page.getByText('Email confirmation is not confirmed. You can still track this request here.')).toBeVisible()
    expect(writes.filter((write) => write.path === '/api/support' && write.method === 'POST')).toHaveLength(1)
    expect(writes.find((write) => write.path === '/api/support' && write.method === 'POST')?.body).toMatchObject({
      subject: 'Question about delivery',
      body: 'Please share the latest delivery update.',
    })
  })

  test('support API failure keeps the customer draft available', async ({ page }) => {
    await installSupportMocks(page, { authenticated: true, failCreate: true })
    await page.goto('/support')
    await page.getByRole('textbox', { name: 'Subject' }).fill('Need help with my order')
    await page.getByRole('textbox', { name: 'How can we help?' }).fill('The order status has not changed.')
    await page.getByRole('button', { name: 'Send support request' }).click()
    await expect(page.getByRole('alert')).toContainText('Support requests are temporarily unavailable')
    await expect(page.getByRole('textbox', { name: 'Subject' })).toHaveValue('Need help with my order')
    await expect(page.getByRole('textbox', { name: 'How can we help?' })).toHaveValue('The order status has not changed.')
  })

  test('customer sees only the private support ticket list returned for the signed-in fixture', async ({ page }) => {
    await installSupportMocks(page, { authenticated: true, tickets: [{ id: ticketId, subject: 'Delivery question', body: 'A synthetic private message.', status: 'OPEN', resolution: null, emailStatus: 'UNCONFIRMED', createdAt: '2026-10-03T00:00:00.000Z', updatedAt: '2026-10-03T00:00:00.000Z' }] })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/support-requests')
    await expect(page.getByRole('heading', { level: 1, name: 'Your support requests' })).toBeVisible()
    await expect(page.getByText('A synthetic private message.')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})

