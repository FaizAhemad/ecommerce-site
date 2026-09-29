import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { StorefrontApiResponse } from './api/storefront'
import { StorefrontRoute } from './router'

const loaded = vi.hoisted(() => ({ home: vi.fn(), admin: vi.fn(), auth: vi.fn() }))
vi.mock('./api/pageMetadata', () => ({ usePageMetadata: vi.fn() }))
vi.mock('./pages/HomePage', () => {
  loaded.home()
  return { HomePage: () => <h1>Home fixture</h1> }
})
vi.mock('./pages/AdminPage', () => {
  loaded.admin()
  return { AdminPage: () => <h1>Admin fixture</h1> }
})
vi.mock('./pages/AuthPage', () => {
  loaded.auth()
  return { AuthPage: () => <h1>Sign in fixture</h1> }
})

afterEach(cleanup)

it('loads only the selected page and keeps admin code behind the existing route gate', async () => {
  const props = {
    storefront: { identity: { businessName: 'Fixture' } } as unknown as StorefrontApiResponse,
    onAdd: vi.fn(async () => {}), onLogin: vi.fn(), isAuthenticated: false, isAdmin: false,
  }
  expect(loaded.home).not.toHaveBeenCalled()
  expect(loaded.admin).not.toHaveBeenCalled()
  const view = render(<StorefrontRoute {...props} path="/" />)
  expect(screen.getByRole('status').textContent).toBe('Loading page...')
  expect(await screen.findByText('Home fixture')).toBeTruthy()
  expect(loaded.admin).not.toHaveBeenCalled()
  expect(loaded.auth).not.toHaveBeenCalled()

  view.rerender(<StorefrontRoute {...props} path="/admin" />)
  expect(await screen.findByText('Sign in fixture')).toBeTruthy()
  expect(loaded.admin).not.toHaveBeenCalled()

  view.rerender(<StorefrontRoute {...props} path="/admin" isAuthenticated isAdmin />)
  expect(await screen.findByText('Admin fixture')).toBeTruthy()
  expect(loaded.admin).toHaveBeenCalledOnce()
})
