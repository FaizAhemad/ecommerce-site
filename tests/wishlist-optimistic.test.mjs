import { changeSession } from '../src/api/sessionScope.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  readWishlist,
  resetWishlist,
  replaceWishlist,
  toggleWishlistItem,
  wishlistPending,
  wishlistVersion,
} from '../src/api/wishlistState.ts'

const events = new EventTarget()
const storage = new Map()
globalThis.window = {
  setTimeout,
  clearTimeout,
  localStorage: {
    removeItem: (key) => storage.delete(key),
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
  dispatchEvent: (event) => events.dispatchEvent(event),
}
const ids = readWishlist
const mockFetch = (fetch) => (url, init) =>
  url === '/api/auth/csrf'
    ? Promise.resolve(Response.json({ csrfToken: 'a'.repeat(64) }))
    : fetch(url, init)
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

test('optimistic wishlist updates, rollback isolation, duplicate protection and stale reads', async () => {
  changeSession({ id: 'test-customer', role: 'CUSTOMER' })
  resetWishlist()
  const a = deferred(),
    b = deferred()
  let calls = 0
  globalThis.window.fetch = mockFetch(() => (++calls === 1 ? a.promise : b.promise))
  const version = wishlistVersion()
  const first = toggleWishlistItem('a')
  const failure = assert.rejects(first, /Unable to update/)
  const second = toggleWishlistItem('b')
  assert.deepEqual(ids(), ['a', 'b'])
  assert.equal(wishlistPending('a'), true)
  await toggleWishlistItem('a')
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(calls, 2)
  replaceWishlist([], version)
  assert.deepEqual(ids(), ['a', 'b'])
  b.resolve(new Response('{}'))
  await second
  a.resolve(new Response('{}', { status: 503 }))
  await failure
  assert.deepEqual(ids(), ['b'])
  assert.equal(wishlistPending('a'), false)
})

test('failed removal restores item and stale session cannot restore logged-out wishlist', async () => {
  changeSession({ id: 'test-customer', role: 'CUSTOMER' })
  resetWishlist()
  replaceWishlist(['saved'], wishlistVersion())
  const request = deferred()
  globalThis.window.fetch = mockFetch(() => request.promise)
  const removal = toggleWishlistItem('saved')
  const failure = assert.rejects(removal)
  assert.deepEqual(ids(), [])
  request.resolve(new Response('{}', { status: 503 }))
  await failure
  assert.deepEqual(ids(), ['saved'])
  const late = deferred()
  globalThis.window.fetch = mockFetch(() => late.promise)
  const pending = toggleWishlistItem('saved')
  const lateFailure = assert.rejects(pending)
  resetWishlist()
  late.resolve(new Response('{}', { status: 503 }))
  await lateFailure
  assert.deepEqual(ids(), [])
})
