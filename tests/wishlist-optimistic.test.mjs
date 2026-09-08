import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resetWishlist, replaceWishlist, toggleWishlistItem, wishlistPending, wishlistVersion } from '../src/api/wishlistState.ts'

const events = new EventTarget()
const storage = new Map()
globalThis.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent: event => events.dispatchEvent(event) }
const ids = () => JSON.parse(storage.get('wishlist'))
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('optimistic wishlist updates, rollback isolation, duplicate protection and stale reads', async () => {
  resetWishlist()
  const a = deferred(), b = deferred()
  let calls = 0
  globalThis.fetch = () => ++calls === 1 ? a.promise : b.promise
  const version = wishlistVersion()
  const first = toggleWishlistItem('a')
  const failure = assert.rejects(first, /Unable to update/)
  const second = toggleWishlistItem('b')
  assert.deepEqual(ids(), ['a', 'b'])
  assert.equal(wishlistPending('a'), true)
  await toggleWishlistItem('a')
  assert.equal(calls, 2)
  replaceWishlist([], version)
  assert.deepEqual(ids(), ['a', 'b'])
  b.resolve({ ok: true }); await second
  a.resolve({ ok: false, status: 503 }); await failure
  assert.deepEqual(ids(), ['b'])
  assert.equal(wishlistPending('a'), false)
})

test('failed removal restores item and stale session cannot restore logged-out wishlist', async () => {
  resetWishlist()
  replaceWishlist(['saved'], wishlistVersion())
  const request = deferred()
  globalThis.fetch = () => request.promise
  const removal = toggleWishlistItem('saved')
  const failure = assert.rejects(removal)
  assert.deepEqual(ids(), [])
  request.resolve({ ok: false, status: 401 }); await failure
  assert.deepEqual(ids(), ['saved'])
  const late = deferred()
  globalThis.fetch = () => late.promise
  const pending = toggleWishlistItem('saved')
  const lateFailure = assert.rejects(pending)
  resetWishlist()
  late.resolve({ ok: false, status: 503 }); await lateFailure
  assert.deepEqual(ids(), [])
})
