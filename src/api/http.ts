import { assertCurrentSession, sessionGeneration, sessionSignal } from './sessionScope.ts'
import { apiPath, clearCsrfToken, csrfToken, isApiWrite } from './csrf.ts'

export const API_TIMEOUT_MS = 30_000
export const LONG_RUNNING_API_TIMEOUT_MS = 60_000

export class ApiRateLimitError extends Error {
  readonly retryAfterSeconds: number
  constructor(retryAfter: string | null) {
    const numeric = Number(retryAfter)
    const seconds =
      retryAfter && Number.isFinite(numeric)
        ? numeric
        : retryAfter
          ? (Date.parse(retryAfter) - Date.now()) / 1000
          : 60
    const safeSeconds = Number.isFinite(seconds)
      ? Math.max(1, Math.min(86_400, Math.ceil(seconds)))
      : 60
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

export async function apiFetch(
  input: RequestInfo | URL,
  init: ApiRequestInit = {},
): Promise<Response> {
  const controller = new AbortController()
  const request = input instanceof Request ? input : undefined
  const url = apiPath(input)
  const method = (init.method ?? request?.method ?? 'GET').toUpperCase()
  const callerSignal = init.signal ?? request?.signal
  const privateRequest =
    url === '/api/auth/email-verification-request' ||
    /^\/api\/(cart|wishlist|orders|admin|payments)(\/|\?|$)/.test(url) ||
    (url.startsWith('/api/products/') &&
      (url.includes('/reviews/mine') || url.includes('/review-upload') || method !== 'GET'))
  const generation = sessionGeneration()
  const accountSignal = privateRequest ? sessionSignal() : undefined
  let timedOut = false
  const { timeoutMs = API_TIMEOUT_MS, ...requestInit } = init
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const abort = () => controller.abort()
  for (const signal of [callerSignal, accountSignal]) {
    if (signal?.aborted) controller.abort()
    else signal?.addEventListener('abort', abort, { once: true })
  }
  try {
    if (isApiWrite(input, requestInit)) {
      const headers = new Headers(
        requestInit.headers ?? (input instanceof Request ? input.headers : undefined),
      )
      headers.set('X-CSRF-Token', await csrfToken(controller.signal))
      controller.signal.throwIfAborted()
      assertCurrentSession(generation)
      requestInit.headers = headers
    }
    const response = await window.fetch(input, {
      credentials: 'include',
      ...requestInit,
      signal: controller.signal,
    })
    if (
      response.status === 403 ||
      (url.startsWith('/api/auth/') && response.ok && method !== 'GET')
    )
      clearCsrfToken()
    if (privateRequest) {
      assertCurrentSession(generation)
      if (response.status === 401) window.dispatchEvent(new Event('sessionexpired'))
      const readJson = response.json.bind(response)
      response.json = async () => {
        const body = await readJson()
        assertCurrentSession(generation)
        return body
      }
    }
    if (response.status === 429) throw new ApiRateLimitError(response.headers.get('Retry-After'))
    return response
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError()
    throw error
  } finally {
    window.clearTimeout(timer)
    callerSignal?.removeEventListener('abort', abort)
    accountSignal?.removeEventListener('abort', abort)
  }
}
