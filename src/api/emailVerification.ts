import { apiFetch } from './http.ts'

export async function submitEmailVerification(token: string | null, signal: AbortSignal) {
  const response = await apiFetch(
    token === null ? '/api/auth/email-verification-request' : '/api/auth/verify-email',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token === null ? {} : { token }),
      signal,
    },
  )
  const body = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      typeof body?.error?.message === 'string'
        ? body.error.message
        : 'Verification is unavailable. Please try again later.',
    )
  if (body?.verified === true) return 'verified' as const
  if (token === null && body?.accepted === true) return 'sent' as const
  throw new Error(
    'We could not confirm the result. Check your email verification status before trying again.',
  )
}

export async function getEmailStatus(
  signal: AbortSignal,
): Promise<{ email: string | null; emailVerified: boolean }> {
  const response = await apiFetch('/api/auth/me', { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load your email status. Please try again.')
  const body = await response.json()
  if (
    typeof body?.user?.emailVerified !== 'boolean' ||
    !(body.user.email === null || typeof body.user.email === 'string')
  )
    throw new Error('Unable to confirm your email status.')
  return { email: body.user.email, emailVerified: body.user.emailVerified }
}
