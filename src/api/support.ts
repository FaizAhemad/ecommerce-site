import { apiFetch } from './http.ts'
export type SupportTicket = {
  id: string
  subject: string
  body: string
  status: string
  resolution: string | null
  emailStatus: string
  createdAt: string
  updatedAt: string
}
export async function supportRequest(
  admin: boolean,
  method: string,
  signal: AbortSignal,
  body?: unknown,
  page = 0,
) {
  const response = await apiFetch(
    `/api/${admin ? 'admin/support' : 'support'}${method === 'GET' ? `?page=${page}` : ''}`,
    {
      method,
      signal,
      cache: 'no-store',
      ...(method === 'GET'
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    },
  )
  const result = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      typeof result?.error?.message === 'string'
        ? result.error.message
        : 'Support is temporarily unavailable. Please try again later.',
    )
  return result as {
    ticket?: SupportTicket
    tickets?: SupportTicket[]
    nextPage?: number | null
    updated?: boolean
  }
}
