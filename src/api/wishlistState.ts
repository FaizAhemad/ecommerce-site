import { sessionUser } from './sessionScope.ts'
let version = 0
import { apiFetch as fetch } from './http.ts'
let epoch = 0
const pending = new Set<string>()
export const wishlistVersion = () => version
export const wishlistPending = (id: string) => pending.has(id)
let savedIds: string[] = []
export const readWishlist = () => [...savedIds]
const read = readWishlist
const publish = (ids: string[]) => {
  version += 1
  savedIds = [...new Set(ids)]
  window.dispatchEvent(new Event('wishlistchange'))
}
export function resetWishlist() {
  try {
    window.localStorage.removeItem('wishlist')
  } catch {
    /* Storage may be disabled. */
  }
  epoch += 1
  pending.clear()
  publish([])
}
export function replaceWishlist(ids: string[], expectedVersion: number) {
  if (version === expectedVersion && !pending.size) publish(ids)
}
export async function toggleWishlistItem(id: string) {
  if (!sessionUser()) throw new Error('Please sign in to update your wishlist.')
  if (pending.has(id)) return
  const session = epoch
  const wasSaved = read().includes(id)
  const apply = (saved: boolean) =>
    publish(saved ? [...new Set([...read(), id])] : read().filter((value) => value !== id))
  pending.add(id)
  apply(!wasSaved)
  try {
    const response = await fetch('/api/wishlist', {
      method: wasSaved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    })
    if (response.status === 401) throw new Error('Please sign in to update your wishlist.')
    if (!response.ok) throw new Error('Unable to update your wishlist. Please try again.')
  } catch (error) {
    if (session === epoch) apply(wasSaved)
    if (error instanceof TypeError || error instanceof DOMException)
      throw new Error('Could not reach the store. Check your wishlist before trying again.')
    throw error
  } finally {
    if (session === epoch) {
      pending.delete(id)
      version += 1
      window.dispatchEvent(new Event('wishlistchange'))
    }
  }
}
