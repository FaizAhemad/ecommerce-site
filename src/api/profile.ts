import { apiFetch } from './http.ts'
export type Profile = {
  name: string | null
  email: string | null
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
}
export type Address = {
  id: string
  label: string | null
  name: string
  line1: string
  line2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  phone: string | null
  isDefault: boolean
}
export type ProfileData = { profile: Profile; addresses: Address[] }
export type AddressDraft = Omit<Address, 'id'>
export const emptyAddress: AddressDraft = {
  label: '',
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  phone: '',
  isDefault: false,
}
export async function profileRequest(
  path: 'profile' | 'addresses',
  method: string,
  body: unknown,
  signal: AbortSignal,
): Promise<ProfileData | { addresses: Address[] }> {
  const response = await apiFetch(`/api/${path}`, {
    method,
    signal,
    cache: 'no-store',
    ...(method === 'GET'
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      typeof result?.error?.message === 'string'
        ? result.error.message
        : 'Unable to confirm the change. Refresh before trying again.',
    )
  if (
    !Array.isArray(result?.addresses) ||
    (path === 'profile' && (!result.profile || typeof result.profile.emailVerified !== 'boolean'))
  )
    throw new Error('Unable to confirm your profile. Please refresh.')
  return result
}
export async function getProfile(signal: AbortSignal): Promise<ProfileData> {
  return (await profileRequest('profile', 'GET', undefined, signal)) as ProfileData
}
