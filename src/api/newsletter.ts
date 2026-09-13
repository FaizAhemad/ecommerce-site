import { apiFetch } from './http.ts'

export async function subscribeToNewsletter(
  email: string,
): Promise<{ emailSent: boolean; confirmationFailed?: boolean }> {
  const response = await apiFetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const result: unknown = await response.json().catch(() => null)
  const record = result && typeof result === 'object' ? result : undefined
  if (!response.ok) {
    const error = record && 'error' in record ? record.error : undefined
    // This specific server code is emitted only after the subscription was saved.
    // Reconcile that outcome without replaying the write or claiming email delivery.
    if (
      response.status === 502 &&
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'CONFIRMATION_EMAIL_FAILED'
    ) {
      return { emailSent: false, confirmationFailed: true }
    }
    // Accept the previous string contract during a frontend/server rollout.
    const message =
      typeof error === 'string'
        ? error
        : error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : undefined
    throw new Error(message || 'We could not subscribe you right now. Please try again.')
  }
  if (!record || !('subscribed' in record) || record.subscribed !== true) {
    throw new Error('We could not confirm your subscription. Please check before trying again.')
  }
  return { emailSent: 'emailSent' in record && record.emailSent === true }
}
