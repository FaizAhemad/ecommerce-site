export const API_TIMEOUT_MS = 30_000
export const LONG_RUNNING_API_TIMEOUT_MS = 60_000

export class ApiRateLimitError extends Error {
  readonly retryAfterSeconds: number
  constructor(retryAfter: string | null) {
    const numeric = Number(retryAfter)
    const seconds = retryAfter && Number.isFinite(numeric) ? numeric : retryAfter ? (Date.parse(retryAfter) - Date.now()) / 1000 : 60
    const safeSeconds = Number.isFinite(seconds) ? Math.max(1, Math.min(86_400, Math.ceil(seconds))) : 60
    super(`Too many requests. Please try again in ${safeSeconds} seconds.`)
    this.name = 'ApiRateLimitError'
    this.retryAfterSeconds = safeSeconds
  }
}

export class ApiTimeoutError extends Error {
  constructor() {
    super('The request took too long. Please try again.')
    this.name = 'ApiTimeoutError'
  }
}

export type ApiRequestInit = RequestInit & { timeoutMs?: number }

export async function apiFetch(input: RequestInfo | URL, init: ApiRequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const { timeoutMs = API_TIMEOUT_MS, ...requestInit } = init
  const timer = window.setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  if (init.signal) {
    if (init.signal.aborted) controller.abort()
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  try {
    const response = await window.fetch(input, { credentials: 'include', ...requestInit, signal: controller.signal })
    if (response.status === 429) throw new ApiRateLimitError(response.headers.get('Retry-After'))
    return response
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError()
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}
