import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin
const profile = { name: 'Synthetic Customer', email: 'customer@example.test', phone: '+919876543210', emailVerified: false, phoneVerified: true }
const emptyAddresses: unknown[] = []

async function mockProfile(page: Page, authenticated = true) {
  const writes: Array<{ path: string; body?: Record<string, unknown> }> = []
  let addresses: Array<Record<string, unknown>> = [...emptyAddresses] as Array<Record<string, unknown>>
  let currentProfile = { ...profile }
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
    if (url.pathname === '/api/auth/me') {
      return authenticated
        ? route.fulfill({ json: { user: { id: 'e2e-profile-customer', role: 'CUSTOMER', ...currentProfile } } })
        : route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } } })
    }
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { csrfToken: 'a'.repeat(64) } })
    if (url.pathname === '/api/profile') {
      if (method === 'PATCH') currentProfile = { ...currentProfile, name: String(body?.name), phone: body?.phone ? String(body.phone) : null, phoneVerified: currentProfile.phone === body?.phone && currentProfile.phoneVerified }
      return route.fulfill({ json: { profile: currentProfile, addresses } })
    }
    if (url.pathname === '/api/addresses') {
      if (method === 'POST') addresses = [{ id: 'e2e-address-1', ...body, isDefault: true }]
      if (method === 'PATCH' && body?.makeDefault) addresses = addresses.map((item: Record<string, unknown>) => ({ ...item, isDefault: item.id === body.id }))
      if (method === 'DELETE') addresses = addresses.filter((item: Record<string, unknown>) => item.id !== body?.id)
      return route.fulfill({ json: { addresses } })
    }
    if (url.pathname === '/api/cart') return route.fulfill({ json: { cart: { items: [] } } })
    if (url.pathname === '/api/wishlist') return route.fulfill({ json: { wishlist: { items: [] } } })
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found.' } } })
  })
  return writes
}

test.describe('Profile', () => {
  test('guest route is gated to sign-in', async ({ page }) => {
    await mockProfile(page, false)
    await page.goto('/profile')
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible()
  })

  test('customer account and empty-address states fit phone and desktop', async ({ page }) => {
    await mockProfile(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/profile')
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
    await expect(page.getByText('No addresses saved yet')).toBeVisible()
    await expect(page.getByText('Not verified')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/profile-phone.png', fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/profile-desktop.png', fullPage: true, animations: 'disabled' })
  })

  test('phone changes require current password and preserve server-owned identity', async ({ page }) => {
    const writes = await mockProfile(page)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Edit personal details' }).click()
    await page.getByRole('textbox', { name: 'Login phone number' }).fill('+919876543211')
    await expect(page.getByLabel('Current password')).toBeVisible()
    await page.getByLabel('Current password').fill('synthetic-password')
    await page.getByRole('button', { name: 'Save personal details' }).click()
    await expect(page.getByText('+919876543211')).toBeVisible()
    expect(writes.find((item) => item.path === '/api/profile' && item.body?.phone === '+919876543211')?.body).toMatchObject({ currentPassword: 'synthetic-password' })
    expect(writes.find((item) => item.path === '/api/profile' && item.body?.phone === '+919876543211')?.body).not.toHaveProperty('email')
  })

  test('first saved address becomes default and writes through the owned address endpoint', async ({ page }) => {
    const writes = await mockProfile(page)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Add address' }).click()
    await page.getByRole('textbox', { name: 'Address label (optional)' }).fill('Home')
    await page.getByRole('textbox', { name: 'Recipient name' }).fill('Synthetic Customer')
    await page.getByRole('textbox', { name: 'Address line 1' }).fill('1 Example Street')
    await page.getByRole('textbox', { name: 'City' }).fill('Pune')
    await page.getByRole('textbox', { name: 'State / region' }).fill('Maharashtra')
    await page.getByRole('textbox', { name: 'Postal code' }).fill('411001')
    await page.getByRole('textbox', { name: 'Country code (for example IN)' }).fill('IN')
    await page.getByRole('button', { name: 'Save address' }).click()
    await expect(page.getByText('Home')).toBeVisible()
    expect(writes.some((item) => item.path === '/api/addresses' && item.body?.line1 === '1 Example Street')).toBe(true)
  })
})

