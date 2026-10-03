import { expect, test, type Page } from '@playwright/test'

type Role = 'GUEST' | 'CUSTOMER' | 'ADMIN'
type RouteSnapshot = { name: string; path: string; role: Role }

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin

const productSeeds = [
  {
    id: 'snapshot-product-1',
    name: 'Snapshot everyday organizer',
    category: 'Home & Kitchen',
    price: 245,
    priceMinor: 24500,
    rating: 4.8,
    reviewCount: 8,
    tone: 'sage',
    badge: 'New arrival',
    stock: 8,
    purchase: { available: true, reason: null },
    seller: { name: 'Gadgify', slug: 'gadgify', isPlatform: true },
    media: { images: [{ id: 'snapshot-image-1', url: '/images/gadgify-home-kitchen.jpg', alt: 'Everyday organizer', isPrimary: true }], videos: [] },
  },
  {
    id: 'snapshot-product-2',
    name: 'Snapshot travel bottle',
    category: 'Accessories',
    price: 525,
    priceMinor: 52500,
    rating: 4.6,
    reviewCount: 4,
    tone: 'sand',
    badge: 'Popular',
    stock: 4,
    purchase: { available: true, reason: null },
    seller: { name: 'Gadgify', slug: 'gadgify', isPlatform: true },
    media: { images: [{ id: 'snapshot-image-2', url: '/images/gadgify-practical-gadgets.jpg', alt: 'Travel bottle', isPrimary: true }], videos: [] },
  },
]
const sampleProducts = Array.from({ length: 10 }, (_, index) => {
  const seed = productSeeds[index % productSeeds.length]
  const name = index < productSeeds.length ? seed.name : `Snapshot useful find ${index + 1}`
  return {
    ...seed,
    id: `snapshot-product-${index + 1}`,
    name,
    category: ['Home & Kitchen', 'Accessories', 'Electronics', 'Toys', 'Clothing'][index % 5],
    media: {
      images: seed.media.images.map((image) => ({ ...image, id: `${image.id}-${index}`, alt: name })),
      videos: [],
    },
  }
})

const routeSnapshots: RouteSnapshot[] = [
  { name: 'home', path: '/', role: 'GUEST' },
  { name: 'products', path: '/products', role: 'GUEST' },
  { name: 'product-details', path: '/product/snapshot-product-1', role: 'GUEST' },
  { name: 'shops', path: '/shops', role: 'GUEST' },
  { name: 'shop-details', path: '/shops/snapshot-shop', role: 'GUEST' },
  { name: 'support', path: '/support', role: 'GUEST' },
  { name: 'support-requests', path: '/support-requests', role: 'CUSTOMER' },
  { name: 'login', path: '/login', role: 'GUEST' },
  { name: 'signup', path: '/signup', role: 'GUEST' },
  { name: 'forgot-password', path: '/forgot-password', role: 'GUEST' },
  { name: 'reset-password', path: '/reset-password', role: 'GUEST' },
  { name: 'email-verification', path: '/verify-email', role: 'GUEST' },
  { name: 'profile', path: '/profile', role: 'CUSTOMER' },
  { name: 'cart', path: '/cart', role: 'CUSTOMER' },
  { name: 'checkout', path: '/checkout', role: 'CUSTOMER' },
  { name: 'orders', path: '/orders', role: 'CUSTOMER' },
  { name: 'order-details', path: '/orders/snapshot-order', role: 'CUSTOMER' },
  { name: 'order-shipments', path: '/orders/shipments', role: 'CUSTOMER' },
  { name: 'track-order', path: '/track-order', role: 'GUEST' },
  { name: 'wishlist-redirect', path: '/wishlist', role: 'CUSTOMER' },
  { name: 'seller-application', path: '/seller', role: 'CUSTOMER' },
  { name: 'seller-products', path: '/seller/products', role: 'CUSTOMER' },
  { name: 'seller-orders', path: '/seller/orders', role: 'CUSTOMER' },
  { name: 'admin-overview', path: '/admin', role: 'ADMIN' },
  { name: 'admin-support', path: '/admin/support', role: 'ADMIN' },
  { name: 'admin-fulfillment', path: '/admin/fulfillment', role: 'ADMIN' },
  { name: 'admin-sellers', path: '/admin/sellers', role: 'ADMIN' },
  { name: 'admin-seller-products', path: '/admin/seller-products', role: 'ADMIN' },
  { name: 'policy-privacy', path: '/privacy', role: 'GUEST' },
  { name: 'policy-returns', path: '/returns', role: 'GUEST' },
  { name: 'policy-refund', path: '/refund-policy', role: 'GUEST' },
  { name: 'policy-terms', path: '/terms', role: 'GUEST' },
  { name: 'policy-terms-and-conditions', path: '/terms-and-conditions', role: 'GUEST' },
  { name: 'policy-shipping', path: '/shipping', role: 'GUEST' },
  { name: 'policy-cancellation', path: '/cancellation', role: 'GUEST' },
  { name: 'policy-cookies', path: '/cookies', role: 'GUEST' },
  { name: 'help-hub', path: '/help', role: 'GUEST' },
  { name: 'debug-error', path: '/debug-error', role: 'GUEST' },
  { name: 'not-found', path: '/snapshot-not-a-route', role: 'GUEST' },
]

async function installSnapshotMocks(page: Page) {
  let role: Role = 'GUEST'
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/categories') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ categories: ['Home & Kitchen', 'Electronics', 'Accessories', 'Toys', 'Clothing'] }) })
    }
    if (url.pathname === '/api/products') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products: sampleProducts, nextCursor: null }) })
    }
    if (url.pathname === '/api/auth/me') {
      const user = role === 'GUEST' ? null : { id: `snapshot-${role.toLowerCase()}`, name: `Snapshot ${role.toLowerCase()}`, email: `${role.toLowerCase()}@example.test`, role }
      const serverNow = Date.now()
      return route.fulfill({ status: user ? 200 : 401, contentType: 'application/json', body: JSON.stringify(user ? { user, session: { serverNow, expiresAt: serverNow + 60 * 60 * 1000 } } : { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } }) })
    }
    if (url.pathname === '/api/admin/analytics') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ revenueMinor: 0, orders: 0, customers: 0, products: 0 }) })
    }
    if (url.pathname === '/api/cart') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ cart: { items: [] } }) })
    if (url.pathname === '/api/wishlist') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ wishlist: { items: [] } }) })
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Synthetic snapshot fixture has no record for this route.' } }) })
  })
  return { setRole: (next: Role) => { role = next } }
}

async function saveResponsiveSnapshots(page: Page, name: string) {
  await page.locator('.site-shell, .error-screen').first().waitFor({ state: 'visible', timeout: 15000 })
  await page.locator('main').first().waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForLoadState('networkidle')
  if (name === 'home') await page.getByRole('heading', { name: 'Fresh for the everyday' }).waitFor({ state: 'visible' })
  await page.locator('img').evaluateAll((images) => {
    for (const image of images) (image as HTMLImageElement).loading = 'eager'
    return Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => undefined)))
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await page.screenshot({ path: `artifacts/page-review/snapshots/${name}-desktop.jpg`, type: 'jpeg', quality: 76, fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await page.screenshot({ path: `artifacts/page-review/snapshots/${name}-phone.jpg`, type: 'jpeg', quality: 76, fullPage: true, animations: 'disabled' })
}

test('captures responsive snapshots for every planned route and admin section', async ({ page }) => {
  test.setTimeout(300000)
  const { setRole } = await installSnapshotMocks(page)
  for (const route of routeSnapshots) {
    setRole(route.role)
    await page.goto(route.path)
    if (route.name === 'wishlist-redirect') await page.waitForURL('**/products')
    await saveResponsiveSnapshots(page, route.name)
  }

  setRole('ADMIN')
  await page.goto('/admin')
  const sections = page.getByRole('navigation', { name: 'Admin sections' })
  await sections.waitFor({ state: 'visible', timeout: 15000 })
  for (const label of ['Overview', 'Products', 'Orders', 'Payments', 'Returns', 'Customers', 'Messages', 'Analytics', 'Settings', 'Feedback', 'Policies', 'Coupons', 'Shipments', 'Notifications']) {
    const tab = sections.getByRole('button', { name: label, exact: true })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-pressed', 'true')
    await saveResponsiveSnapshots(page, `admin-tab-${label.toLowerCase()}`)
  }
})
