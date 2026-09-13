import { assertCurrentSession, sessionGeneration } from './sessionScope.ts'

let cached: { generation: number; token: string } | undefined
let revision = 0
let pending:
  | { generation: number; controller: AbortController; promise: Promise<string>; users: number }
  | undefined

export function clearCsrfToken() {
  cached = undefined
  revision++
  pending?.controller.abort()
  pending = undefined
}

export function isApiWrite(input: RequestInfo | URL, init: RequestInit): boolean {
  const request = typeof Request !== 'undefined' && input instanceof Request ? input : undefined
  const method = (init.method ?? request?.method ?? 'GET').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false
  return apiPath(input).startsWith('/api/')
}

export function apiPath(input: RequestInfo | URL): string {
  const raw = input instanceof Request ? input.url : String(input)
  if (!window.location) return raw.startsWith('/api/') ? raw : ''
  const url = new URL(raw, window.location.href)
  return url.origin === window.location.origin ? url.pathname : ''
}

// Bootstrap is inside the caller's existing timeout/cancellation budget. No persistent
// storage and no automatic replay of a mutation after a rejected/ambiguous outcome.
async function loadToken(
  signal: AbortSignal,
  generation: number,
  version: number,
): Promise<string> {
  const response = await window.fetch('/api/auth/csrf', {
    credentials: 'include',
    cache: 'no-store',
    signal,
    headers: { 'X-CSRF-Bootstrap': '1' },
  })
  if (!response.ok) throw new Error('Unable to prepare a secure request. Please try again.')
  const body: unknown = await response.json()
  assertCurrentSession(generation)
  signal.throwIfAborted()
  if (version !== revision) throw new DOMException('Session changed', 'AbortError')
  if (
    !body ||
    typeof body !== 'object' ||
    !('csrfToken' in body) ||
    typeof body.csrfToken !== 'string' ||
    !/^[a-f0-9]{64}$/.test(body.csrfToken)
  ) {
    throw new Error('Unable to prepare a secure request. Please try again.')
  }
  cached = { generation, token: body.csrfToken }
  return cached.token
}

export async function csrfToken(signal: AbortSignal): Promise<string> {
  signal.throwIfAborted()
  const generation = sessionGeneration()
  if (cached?.generation === generation) return cached.token
  if (!pending || pending.generation !== generation || pending.controller.signal.aborted) {
    const controller = new AbortController()
    pending = {
      generation,
      controller,
      users: 0,
      promise: loadToken(controller.signal, generation, revision),
    }
  }
  const job = pending
  job.users++
  let abort: () => void = () => {}
  try {
    return await Promise.race([
      job.promise,
      new Promise<never>((_resolve, reject) => {
        abort = () => reject(new DOMException('Aborted', 'AbortError'))
        signal.addEventListener('abort', abort, { once: true })
        if (signal.aborted) abort()
      }),
    ])
  } finally {
    signal.removeEventListener('abort', abort)
    job.users--
    if (job.users === 0) {
      job.controller.abort()
      if (pending === job) pending = undefined
    }
  }
}
