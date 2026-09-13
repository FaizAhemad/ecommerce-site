import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from './http.js'

function header(request: VercelRequest, name: string): string | undefined {
  const values = Object.entries(request.headers ?? {}).filter(([key]) => key.toLowerCase() === name)
  return values.length === 1 && typeof values[0][1] === 'string' ? values[0][1] : undefined
}

function cookie(request: VercelRequest, name: string): string | undefined {
  const values = (header(request, 'cookie') ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`))
  const value = values.length === 1 ? values[0].slice(name.length + 1) : undefined
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined
}

function guestCookie(production: boolean) {
  return production ? '__Host-gadgify_csrf' : 'gadgify_csrf'
}

function seed(request: VercelRequest, production: boolean) {
  return cookie(request, 'gadgify_session') ?? cookie(request, guestCookie(production))
}

// Domain-separated HMAC: disclosing this value does not disclose the random HttpOnly
// session credential. Existing handler authentication still verifies the DB session.
function tokenFor(value: string) {
  return createHmac('sha256', value).update('gadgify:csrf:v1').digest('hex')
}

function trustedSource(request: VercelRequest, production: boolean) {
  const site = header(request, 'sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = header(request, 'origin')
  const referer = header(request, 'referer')
  if (!origin && !referer) return true // Token + non-simple header remain mandatory.
  try {
    const source = new URL(origin ?? referer!)
    const host = header(request, 'host')
    // Do not trust arbitrary forwarded-host headers or allow every preview subdomain.
    return !!host && source.host === host && source.protocol === (production ? 'https:' : 'http:')
  } catch {
    return false
  }
}

export function validCsrf(request: VercelRequest, path: string, production: boolean): boolean {
  const method = (request.method ?? 'GET').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
  // Exact provider route only; signature verification remains in its handler.
  if (path === 'webhooks/razorpay' && method === 'POST') return true
  if (!trustedSource(request, production)) return false
  const value = seed(request, production)
  const supplied = header(request, 'x-csrf-token')
  if (!value || !supplied || !/^[a-f0-9]{64}$/.test(supplied)) return false
  return timingSafeEqual(Buffer.from(tokenFor(value), 'hex'), Buffer.from(supplied, 'hex'))
}

export function csrfTokenResponse(
  request: VercelRequest,
  response: VercelResponse,
  production: boolean,
  id: string = crypto.randomUUID(),
) {
  response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader?.('Vary', 'Cookie, Origin, Sec-Fetch-Site')
  if (request.method !== 'GET') {
    response.setHeader?.('Allow', 'GET')
    return response
      .status(405)
      .json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.', requestId: id } })
  }
  if (!trustedSource(request, production) || header(request, 'x-csrf-bootstrap') !== '1') {
    return response.status(403).json({
      error: {
        code: 'CSRF_INVALID',
        message: 'Unable to verify this request. Refresh the page and try again.',
        requestId: id,
      },
    })
  }
  let value = seed(request, production)
  if (!value) {
    value = randomBytes(32).toString('hex')
    response.setHeader?.(
      'Set-Cookie',
      `${guestCookie(production)}=${value}; Path=/; HttpOnly; SameSite=Lax${production ? '; Secure' : ''}`,
    )
  }
  return response.status(200).json({ csrfToken: tokenFor(value) })
}
