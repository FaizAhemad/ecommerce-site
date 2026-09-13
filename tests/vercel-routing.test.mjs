import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const api = config.routes[0]
const fallback = config.routes.at(-1)
test('Vercel routes preserve API paths for the single dispatcher', () => {
  assert.equal(
    '/api/products/p/reviews/mine'.replace(new RegExp(`^${api.src}$`), api.dest),
    '/api/[...route]?route=products/p/reviews/mine',
  )
  assert.deepEqual(config.routes[1], { handle: 'filesystem' })
})
test('SPA fallback accepts application refresh URLs but excludes Vite modules and assets', () => {
  const pattern = new RegExp(`^${fallback.src}$`)
  for (const path of [
    '/',
    '/admin',
    '/admin/unknown',
    '/product/p',
    '/orders/order-id',
    '/login',
    '/terms-and-conditions',
  ])
    assert.equal(pattern.test(path), true, path)
  for (const path of [
    '/api/auth/me',
    '/@vite/client',
    '/@react-refresh',
    '/src/main.tsx',
    '/node_modules/.vite/deps/react.js',
    '/assets/app.js',
    '/favicon.svg',
    '/index.html',
  ])
    assert.equal(pattern.test(path), false, path)
})
