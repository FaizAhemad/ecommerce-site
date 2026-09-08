export type VercelRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}

export type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => unknown
  setHeader?: (name: string, value: string) => void
}

/** Maximum time allowed for outbound provider requests. */
export const API_TIMEOUT_MS = 30_000
export const LONG_RUNNING_API_TIMEOUT_MS = 60_000

export class ApiTimeoutError extends Error {
  constructor() {
    super('The upstream request timed out.')
    this.name = 'ApiTimeoutError'
  }
}

/** Fetch wrapper for server-side providers (Resend, Twilio, payment gateways). */
export type ApiRequestInit = RequestInit & { timeoutMs?: number }

export async function fetchWithTimeout(input: RequestInfo | URL, init: ApiRequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const { timeoutMs = API_TIMEOUT_MS, ...requestInit } = init
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  if (init.signal) {
    if (init.signal.aborted) controller.abort()
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  try {
    return await fetch(input, { ...requestInit, signal: controller.signal })
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError()
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export function bodyRecord(request: VercelRequest): Record<string, unknown> {
  return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
}

export function requestId(request: VercelRequest): string {
  const value = request.headers?.['x-request-id']
  return typeof value === 'string' && value ? value : crypto.randomUUID()
}

export function sendError(response: VercelResponse, status: number, code: string, message: string, id: string) {
  return response.status(status).json({ error: { code, message, requestId: id } })
}

export function setCacheControl(response: VercelResponse, value: 'public' | 'private') {
  response.setHeader?.('Cache-Control', value === 'public' ? 'public, max-age=30, stale-while-revalidate=60' : 'private, no-store, max-age=0')
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
