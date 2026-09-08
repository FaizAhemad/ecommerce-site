export const API_TIMEOUT_MS = 30_000
export const LONG_RUNNING_API_TIMEOUT_MS = 60_000

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
    return await window.fetch(input, { ...requestInit, signal: controller.signal })
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError()
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}
