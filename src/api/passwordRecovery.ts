import { apiFetch } from './http.ts'

export function readResetToken(href: string) {
  const url = new URL(href)
  const token =
    new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token') ?? ''
  return /^[a-f0-9]{64}$/.test(token) ? token : ''
}

export function cleanResetUrl(href: string) {
  const url = new URL(href)
  url.searchParams.delete('token')
  url.hash = ''
  return url.pathname + url.search
}

export function passwordValidation(password: string, confirmation: string) {
  if (password.length < 8 || password.length > 128)
    return 'Use a password between 8 and 128 characters.'
  if (password !== confirmation) return 'The passwords do not match.'
  return undefined
}

export async function submitPasswordRecovery(
  mode: 'forgot' | 'reset',
  values: { email?: string; token?: string; password?: string },
  signal: AbortSignal,
) {
  const response = await apiFetch(
    mode === 'forgot' ? '/api/auth/password-reset-request' : '/api/auth/password-reset',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(
        mode === 'forgot'
          ? { email: values.email }
          : { token: values.token, password: values.password },
      ),
    },
  )
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error =
      result && typeof result === 'object' && 'error' in result ? result.error : undefined
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'We could not complete this request. Please try again.'
    throw new Error(message)
  }
  const key = mode === 'forgot' ? 'accepted' : 'reset'
  if (
    !result ||
    typeof result !== 'object' ||
    !(key in result) ||
    (result as Record<string, unknown>)[key] !== true
  )
    throw new Error('We could not confirm the result. Please check before trying again.')
}
