import { expect, test, type Page } from '@playwright/test'

const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').origin

const productSeeds = [
  {
    id: 'e2e-home-product-1',
    name: 'Sample everyday organizer',
    description: 'A compact organizer for keeping everyday kitchen essentials close at hand.',
    category: 'Home & Kitchen',
    price: 245,
    priceMinor: 24500,
    rating: 0,
    reviewCount: 0,
    tone: 'sage',
    badge: 'New arrival',
    stock: 12,
    purchase: { available: true, reason: null },
    seller: { name: 'Gadgify', slug: 'gadgify', isPlatform: true },
    media: { images: [{ id: 'sample-organizer-image', url: '/images/gadgify-home-kitchen.jpg', alt: 'Sample everyday organizer', isPrimary: true }], videos: [] },
  },
  {
    id: 'e2e-home-product-2',
    name: 'Sample travel bottle',
    category: 'Accessories',
    price: 525,
    priceMinor: 52500,
    rating: 4.8,
    reviewCount: 4,
    tone: 'sand',
    badge: 'Popular',
    stock: 5,
    purchase: { available: true, reason: null },
    seller: { name: 'Gadgify', slug: 'gadgify', isPlatform: true },
    media: { images: [{ id: 'sample-bottle-image', url: '/images/gadgify-practical-gadgets.jpg', alt: 'Sample travel bottle', isPrimary: true }], videos: [] },
  },
]
const baseProducts = Array.from({ length: 10 }, (_, index) => {
  const seed = productSeeds[index % productSeeds.length]
  const name = index < productSeeds.length ? seed.name : `Sample useful find ${index + 1}`
  return {
    ...seed,
    id: `e2e-home-product-${index + 1}`,
    name,
    category: ['Home & Kitchen', 'Accessories', 'Electronics', 'Toys', 'Clothing'][index % 5],
    media: {
      images: seed.media.images.map((image) => ({ ...image, id: `${image.id}-${index}`, alt: name })),
      videos: [],
    },
  }
})

async function installHomeMocks(page: Page, role: 'GUEST' | 'CUSTOMER' | 'SELLER' | 'ADMIN' = 'GUEST', emptyCatalog = false) {
  const apiWrites: string[] = []
  const apiReads: string[] = []
  const fixtureUser = role === 'GUEST' ? null : {
    id: role === 'ADMIN' ? 'e2e-admin' : role === 'SELLER' ? 'e2e-seller' : 'e2e-customer',
    name: role === 'ADMIN' ? 'Synthetic Administrator' : role === 'SELLER' ? 'Synthetic Seller' : 'Synthetic Customer',
    email: `${role.toLowerCase()}@example.test`,
    role: role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
  }
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== localOrigin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (request.method() !== 'GET') apiWrites.push(`${request.method()} ${url.pathname}`)
    else apiReads.push(`${request.method()} ${url.pathname}`)
    if (url.pathname === '/api/categories') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ categories: ['Home & Kitchen', 'Electronics', 'Accessories', 'Toys', 'Clothing'] }) })
    }
    if (url.pathname === '/api/products') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ products: emptyCatalog ? [] : baseProducts }) })
    }
    if (url.pathname === '/api/auth/me') {
      return route.fulfill({ status: fixtureUser ? 200 : 401, contentType: 'application/json', body: JSON.stringify(fixtureUser ? { user: fixtureUser } : { error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } }) })
    }
    if (url.pathname === '/api/shops/access') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ allowed: role === 'ADMIN' || role === 'SELLER' }) })
    }
    if (url.pathname === '/api/shops') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ shops: [], nextPage: null }) })
    }
    if (url.pathname === '/api/cart') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ cart: { items: [] } }) })
    }
    if (url.pathname === '/api/wishlist') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ wishlist: { items: [] } }) })
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }) })
  })
  return { apiWrites, apiReads }
}

async function rememberDocument(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(window, '__e2eDocumentElement', {
      configurable: true,
      value: document.documentElement,
    })
  })
}

async function documentWasPreserved(page: Page) {
  return page.evaluate(
    () => document.documentElement === Object.getOwnPropertyDescriptor(window, '__e2eDocumentElement')?.value,
  )
}

test.describe('Home page', () => {
  test('shows public navigation and storefront sections without exposing private destinations to guests', async ({ page }) => {
    await installHomeMocks(page)
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'Good finds for everyday life.' })).toBeVisible()
    const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(primaryNav.locator('.cart-button .header-cart-count')).toHaveCount(1)
    await expect(primaryNav.locator('.cart-button .header-cart-count')).toHaveText('0')
    await expect(primaryNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    for (const label of ['Products', 'Sell with us', 'Support']) await expect(primaryNav.getByRole('link', { name: label })).toBeVisible()
    await expect(primaryNav.getByRole('link', { name: 'Shops' })).toHaveCount(0)
    for (const label of ['Orders', 'Profile', 'Admin']) await expect(primaryNav.getByRole('link', { name: label })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible()
    await expect(page.getByText('A compact organizer for keeping everyday kitchen essentials close at hand.')).toBeVisible()
    const socialNav = page.getByRole('navigation', { name: 'Social media links' })
    await expect(socialNav.locator('svg')).toHaveAttribute('stroke', '#FFFFFF')
    await expect(socialNav.locator('svg')).toHaveAttribute('color', '#FFFFFF')
    await expect(page.getByRole('heading', { name: 'A few good finds' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'More useful finds' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })

  test('opens every guest-visible primary navigation destination and captures desktop and phone views', async ({ page }) => {
    await installHomeMocks(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await rememberDocument(page)
    const destinations = [
      { label: 'Home', path: '/', heading: 'Good finds for everyday life.' },
      { label: 'Products', path: '/products', heading: 'collection-title' },
      { label: 'Sell with us', path: '/seller', heading: 'Sell with Gadgify' },
      { label: 'Support', path: '/support', heading: 'Support, made simple.' },
    ]

    for (const destination of destinations) {
      const nav = page.getByRole('navigation', { name: 'Primary navigation' })
      await nav.getByRole('link', { name: destination.label }).click()
      await expect.poll(() => new URL(page.url()).pathname).toBe(destination.path)
      expect(await documentWasPreserved(page)).toBe(true)
      if (destination.heading === 'collection-title') await expect(page.locator('#collection-title')).toBeVisible()
      else await expect(page.getByRole('heading', { level: 1, name: destination.heading })).toBeVisible()
      const fileName = destination.label.toLowerCase().replaceAll(' ', '-')
      await page.screenshot({ path: `artifacts/page-review/navigation/${fileName}-desktop.png`, fullPage: true, animations: 'disabled' })
      await page.setViewportSize({ width: 390, height: 844 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `artifacts/page-review/navigation/${fileName}-phone.png`, fullPage: true, animations: 'disabled' })
      await page.setViewportSize({ width: 1440, height: 1000 })
    }
  })

  test('captures customer-only navbar destinations with responsive views', async ({ page }) => {
    await installHomeMocks(page, 'CUSTOMER')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await rememberDocument(page)
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(nav.getByRole('link', { name: 'Shops' })).toHaveCount(0)
    for (const destination of [
      { label: 'Orders', path: '/orders', file: 'orders' },
      { label: 'Profile', path: '/profile', file: 'profile' },
    ]) {
      await nav.getByRole('link', { name: destination.label }).click()
      await expect.poll(() => new URL(page.url()).pathname).toBe(destination.path)
      expect(await documentWasPreserved(page)).toBe(true)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      await page.screenshot({ path: `artifacts/page-review/navigation/customer-${destination.file}-desktop.png`, fullPage: true, animations: 'disabled' })
      await page.setViewportSize({ width: 390, height: 844 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `artifacts/page-review/navigation/customer-${destination.file}-phone.png`, fullPage: true, animations: 'disabled' })
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Home' }).click()
      await expect.poll(() => new URL(page.url()).pathname).toBe('/')
    }
  })

  test('shows shop browsing only to an approved seller membership', async ({ page }) => {
    await installHomeMocks(page, 'SELLER')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(nav.getByRole('link', { name: 'Shops' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Shops' })).toHaveAttribute('href', '/shops')
    await nav.getByRole('link', { name: 'Shops' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/shops')
    await expect(page.getByRole('heading', { name: 'Discover shops' })).toBeVisible()
  })

  test('captures the admin destination only for the server-assigned admin role', async ({ page }) => {
    await installHomeMocks(page, 'ADMIN')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(nav.getByRole('link', { name: 'Shops' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Admin' })).toBeVisible()
    await nav.getByRole('link', { name: 'Admin' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin')
    await expect(page.getByRole('navigation', { name: 'Admin sections' })).toBeVisible()
    await page.screenshot({ path: 'artifacts/page-review/navigation/admin-desktop.png', fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'artifacts/page-review/navigation/admin-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('explains a successfully loaded but empty catalog without rendering blank product sections', async ({ page }) => {
    await installHomeMocks(page, 'GUEST', true)
    await page.goto('/')

    await expect(page.getByRole('status')).toContainText('Our collection is being refreshed')
    await expect(page.getByRole('heading', { name: 'More useful finds' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(0)
  })

  test('shows a responsive featured-collections carousel with manual navigation and a catalog action', async ({ page }) => {
    await installHomeMocks(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const carousel = page.getByRole('region', { name: 'Featured collections' })
    await expect(carousel).toBeVisible()
    await expect(carousel.getByRole('heading', { name: 'Small helpers, everyday ease.' })).toBeVisible()
    await carousel.getByRole('button', { name: 'Show collection 2' }).click()
    await expect(carousel.getByRole('heading', { name: 'Handy upgrades for every day.' })).toBeVisible()
    await carousel.getByRole('link', { name: 'Explore the collection' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/products')
    await expect(page.locator('#collection-title')).toBeVisible()
  })

  test('rejects malformed newsletter email in the browser without sending a request', async ({ page }) => {
    const { apiWrites } = await installHomeMocks(page)
    await page.goto('/')
    const email = page.getByLabel('Email address')
    await email.fill('not-an-email')
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await expect.poll(() => email.evaluate((element) => !(element as HTMLInputElement).validity.valid)).toBe(true)
    expect(apiWrites.filter((request) => request.includes('/api/newsletter'))).toEqual([])
  })

  test('guest cart action explains sign-in and never sends a cart write', async ({ page }) => {
    const { apiWrites } = await installHomeMocks(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Add to cart' }).first().click()
    await expect(page.getByRole('alert')).toContainText('Please sign in to update your cart.')
    expect(apiWrites.filter((request) => request.includes('/api/cart'))).toEqual([])
  })

  test('keeps the document within common phone, tablet and desktop widths', async ({ page }) => {
    await installHomeMocks(page)
    await page.goto('/')
    for (const width of [320, 360, 390, 430, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  })

  test('captures desktop and phone screenshots for owner review', async ({ page }) => {
    await installHomeMocks(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Good finds for everyday life.' })).toBeVisible()
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => undefined))))
    await page.screenshot({ path: 'artifacts/page-review/home-desktop.png', fullPage: true, animations: 'disabled' })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: 'artifacts/page-review/home-phone.png', fullPage: true, animations: 'disabled' })
  })

  test('shows role-aware primary navigation from server-provided identity', async ({ page }) => {
    await installHomeMocks(page, 'CUSTOMER')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(nav.getByRole('link', { name: 'Orders' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Profile' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Admin' })).toHaveCount(0)
  })

  test('shows Admin navigation only for the server-assigned admin role', async ({ page }) => {
    await installHomeMocks(page, 'ADMIN')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(nav.getByRole('link', { name: 'Admin' })).toBeVisible()
    await page.setViewportSize({ width: 320, height: 900 })
    await expect.poll(() => nav.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
    await nav.getByRole('link', { name: 'Admin' }).scrollIntoViewIfNeeded()
    await expect(nav.getByRole('link', { name: 'Admin' })).toBeInViewport()
  })

  test('customer cannot open the admin workspace directly or trigger its private queries', async ({ page }) => {
    const { apiReads } = await installHomeMocks(page, 'CUSTOMER')
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible()
    expect(apiReads.filter((request) => request.includes('/api/admin/'))).toEqual([])
  })

  test('seller navigation changes route without reloading the application document', async ({ page }) => {
    await installHomeMocks(page, 'CUSTOMER')
    await page.goto('/seller')
    await rememberDocument(page)
    const nav = page.getByRole('navigation', { name: 'Marketplace navigation' })
    await nav.getByRole('link', { name: 'My products' }).click()
    await expect(page).toHaveURL(/\/seller\/products$/)
    expect(await documentWasPreserved(page)).toBe(true)
  })

  test('admin section tabs and admin tools navigate without a document reload', async ({ page }) => {
    await installHomeMocks(page, 'ADMIN')
    await page.goto('/admin')
    await rememberDocument(page)
    const sections = page.getByRole('navigation', { name: 'Admin sections' })
    await sections.getByRole('button', { name: 'Products' }).click()
    await expect(sections.getByRole('button', { name: 'Products' })).toHaveAttribute('aria-pressed', 'true')
    expect(await documentWasPreserved(page)).toBe(true)
    await page.getByRole('navigation', { name: 'Additional admin tools' }).getByRole('link', { name: 'Seller applications' }).click()
    await expect(page).toHaveURL(/\/admin\/sellers$/)
    expect(await documentWasPreserved(page)).toBe(true)
  })

  test('admin seller-workspace navigation stays client-side across admin routes', async ({ page }) => {
    await installHomeMocks(page, 'ADMIN')
    await page.goto('/admin/sellers')
    await rememberDocument(page)
    await page.getByRole('navigation', { name: 'Admin marketplace tools' }).getByRole('link', { name: 'Product moderation' }).click()
    await expect(page).toHaveURL(/\/admin\/seller-products$/)
    expect(await documentWasPreserved(page)).toBe(true)
  })
})
