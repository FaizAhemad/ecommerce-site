export type VercelRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}

export type VercelResponse = {
  headersSent?: boolean
  writableEnded?: boolean
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

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: ApiRequestInit = {},
): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const { timeoutMs = API_TIMEOUT_MS, ...requestInit } = init
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
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
  return request.body && typeof request.body === 'object'
    ? (request.body as Record<string, unknown>)
    : {}
}

const requestIds = new WeakMap<VercelRequest, string>()

export function requestId(request: VercelRequest): string {
  const existing = requestIds.get(request)
  if (existing) return existing
  const value = request.headers?.['x-request-id']
  const id =
    typeof value === 'string' &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
      ? value
      : crypto.randomUUID()
  requestIds.set(request, id)
  return id
}

/** Runtime failures only: module initialization/platform failures remain outside this boundary. */
export function logApiFailure(error: unknown, id: string, operation?: 'products' | 'categories') {
  // Allowlisted classifications only. Never serialize message, stack, meta or connection data.
  const value = error && typeof error === 'object' ? error as { code?: unknown; errorCode?: unknown; name?: unknown } : {}
  const candidate = value.code ?? value.errorCode
  const codes: Record<string, string> = {
    P1000: 'DATABASE_AUTHENTICATION', P1001: 'DATABASE_UNREACHABLE', P1002: 'DATABASE_CONNECT_TIMEOUT',
    P1003: 'DATABASE_MISSING', P1010: 'DATABASE_ACCESS_DENIED', P1011: 'DATABASE_TLS',
    P1017: 'DATABASE_CONNECTION_CLOSED', P2021: 'DATABASE_TABLE_MISSING', P2022: 'DATABASE_COLUMN_MISSING',
    P2024: 'DATABASE_POOL_TIMEOUT', P2034: 'DATABASE_TRANSACTION_CONFLICT',
  }
  const code = typeof candidate === 'string' && Object.hasOwn(codes, candidate) ? candidate : undefined
  const category = code ? codes[code] : value.name === 'PrismaClientInitializationError' ? 'DATABASE_INITIALIZATION' :
    value.name === 'PrismaClientValidationError' ? 'DATABASE_QUERY_VALIDATION' : undefined
  console.error(JSON.stringify({ event: 'api_unhandled_error', requestId: id,
    ...(operation ? { operation } : {}), ...(category ? { category } : {}), ...(code ? { code } : {}),
  }))
}

export async function withApiErrorBoundary(
  request: VercelRequest,
  response: VercelResponse,
  action: () => unknown,
) {
  const id = requestId(request)
  request.headers = { ...request.headers, 'x-request-id': id }
  try {
    response.setHeader?.('X-Request-Id', id)
    return await action()
  } catch (error) {
    // Do not log raw errors, URLs, bodies, headers or customer/provider details.
    logApiFailure(error, id)
    if (response.headersSent || response.writableEnded) return
    return sendError(
      response,
      500,
      'INTERNAL_ERROR',
      'We could not complete this request. Check its current status before trying again.',
      id,
    )
  }
}

export function sendError(
  response: VercelResponse,
  status: number,
  code: string,
  message: string,
  id: string,
) {
  setCacheControl(response, 'private')
  response.setHeader?.('X-Request-Id', id)
  return response.status(status).json({ error: { code, message, requestId: id } })
}

export function setCacheControl(response: VercelResponse, value: 'public' | 'private') {
  response.setHeader?.(
    'Cache-Control',
    value === 'public'
      ? 'public, max-age=30, stale-while-revalidate=60'
      : 'private, no-store, max-age=0',
  )
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
