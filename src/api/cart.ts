import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './http.ts'
import { queryClient } from './queryClient.ts'
import { privateKey, sessionGeneration, sessionUser, assertCurrentSession } from './sessionScope.ts'

export type CartItem = {
  id: string
  quantity: number
  product: { id: string; name: string; category: string; priceMinor: number }
}
const pending = new Set<string>()
const listeners = new Set<() => void>()
let revision = 0
const publish = () => {
  revision += 1
  listeners.forEach((listener) => listener())
}
export function resetCart() {
  pending.clear()
  publish()
}
export function useCart() {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => revision,
  )
  const query = useQuery({
    queryKey: privateKey('cart'),
    enabled: Boolean(sessionUser()),
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/cart', { signal })
      if (!response.ok) throw new Error('Unable to load your cart.')
      const body = (await response.json()) as { cart: { items: CartItem[] } }
      return body.cart.items
    },
  })
  return { ...query, pending, isUpdating: pending.size > 0 }
}

// Merge only the affected row; responses for concurrent rows can contain older snapshots.
export async function updateCart(
  product: CartItem['product'],
  quantity: number,
  mode: 'add' | 'set',
) {
  if (!sessionUser()) throw new Error('Please sign in to update your cart.')
  if (pending.has(product.id)) return
  const generation = sessionGeneration()
  const key = privateKey('cart')
  pending.add(product.id)
  publish()
  await queryClient.cancelQueries({ queryKey: key })
  const previous = queryClient
    .getQueryData<CartItem[]>(key)
    ?.find((item) => item.product.id === product.id)
  const replace = (next?: CartItem) =>
    queryClient.setQueryData<CartItem[]>(key, (items = []) => {
      if (!next) return items.filter((item) => item.product.id !== product.id)
      if (items.some((item) => item.product.id === product.id))
        return items.map((item) => (item.product.id === product.id ? next : item))
      return [...items, next]
    })
  try {
    assertCurrentSession(generation)
    const nextQuantity = mode === 'add' ? (previous?.quantity ?? 0) + quantity : quantity
    replace(
      nextQuantity > 0
        ? { id: previous?.id ?? product.id, product, quantity: nextQuantity }
        : undefined,
    )
    const response = await apiFetch('/api/cart', {
      method: mode === 'add' ? 'POST' : quantity < 1 ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, quantity }),
    })
    if (!response.ok) throw new Error('Unable to update your cart. Please try again.')
    const body = (await response.json()) as { cart: { items: CartItem[] } }
    assertCurrentSession(generation)
    replace(body.cart.items.find((item) => item.product.id === product.id))
  } catch (error) {
    if (generation === sessionGeneration()) replace(previous)
    throw error
  } finally {
    if (generation === sessionGeneration()) {
      pending.delete(product.id)
      publish()
      if (!pending.size) void queryClient.invalidateQueries({ queryKey: key })
    }
  }
}
