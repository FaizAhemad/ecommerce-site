import { createHash, randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import type { VercelRequest, VercelResponse } from './http.js'

type Rule = { scope: string; seconds: number; ip: number; user?: number }
export type Counter = { count: number; retryAfter: number }
export type Consume = (key: string, limit: number, seconds: number) => Promise<Counter>

export function rateLimitRule(path: string, method = 'GET'): Rule | null {
  if (method === 'OPTIONS' || method === 'HEAD' || path.startsWith('webhooks/') || path === 'auth/me' || path === 'auth/logout') return null
  if (path.startsWith('auth/')) {
    if (method !== 'POST' && path !== 'auth/verify-email') return null
    if (path === 'auth/login') return { scope: 'login', seconds: 60, ip: 10 }
    if (['auth/signup', 'auth/password-reset-request', 'auth/mobile-request'].includes(path)) return { scope: 'auth-send', seconds: 600, ip: 5 }
    return { scope: 'auth-verify', seconds: 600, ip: 20 }
  }
  if (method === 'GET') return null
  if (path === 'admin/upload' || /^products\/[^/]+\/review-upload$/.test(path)) return { scope: 'upload', seconds: 60, ip: 120, user: 40 }
  if (/^products\/[^/]+\/reviews(?:\/mine)?$/.test(path)) return { scope: 'review', seconds: 60, ip: 60, user: 10 }
  if (path === 'newsletter/subscribe' || path.startsWith('support') || path.startsWith('coupons')) return { scope: 'contact-coupon', seconds: 600, ip: 10, user: 5 }
  if (path.startsWith('admin/')) return { scope: 'admin-write', seconds: 60, ip: 180, user: 60 }
  return { scope: 'commerce-write', seconds: 60, ip: 240, user: 120 }
}

export function clientAddress(request: VercelRequest & { socket?: { remoteAddress?: string } }, vercel: boolean) {
  // Only trust forwarding headers behind Vercel, which overwrites this header.
  const forwarded = request.headers?.['x-forwarded-for']
  const candidate = vercel && typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.socket?.remoteAddress
  if (!candidate || !isIP(candidate)) return 'unknown'
  // Canonicalize IPv6 spellings and IPv4-mapped addresses to avoid trivial bypasses.
  if (isIP(candidate) === 6) {
    const normalized = new URL(`http://[${candidate}]/`).hostname.slice(1, -1)
    if (normalized.startsWith('::ffff:')) {
      const parts = normalized.slice(7).split(':').map(part => parseInt(part, 16))
      if (parts.length === 2) return [parts[0] >> 8, parts[0] & 255, parts[1] >> 8, parts[1] & 255].join('.')
    }
    return normalized
  }
  return candidate
}

export async function enforceRateLimit(
  request: VercelRequest & { socket?: { remoteAddress?: string } }, response: VercelResponse, path: string,
  dependencies: { consume: Consume; userId: () => Promise<string | undefined>; vercel: boolean },
) {
  const rule = rateLimitRule(path, request.method)
  if (!rule) return true
  const id = randomUUID()
  const consume = async (kind: string, identity: string, limit: number) => {
    const key = createHash('sha256').update(`${rule.scope}:${kind}:${identity}`).digest('hex')
    const result = await dependencies.consume(key, limit, rule.seconds)
    if (result.count <= limit) return true
    const seconds = Math.max(1, Math.ceil(result.retryAfter))
    response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
    response.setHeader?.('Retry-After', String(seconds))
    response.status(429).json({ error: { code: 'RATE_LIMITED', message: `Too many requests. Please try again in ${seconds} seconds.`, requestId: id, retryAfterSeconds: seconds } })
    return false
  }
  try {
    if (!(await consume('ip', clientAddress(request, dependencies.vercel), rule.ip))) return false
    if (rule.user) {
      const userId = await dependencies.userId()
      if (userId && !(await consume('user', userId, rule.user))) return false
    }
    return true
  } catch {
    // Missing migrations or storage failures must not silently disable protection.
    response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
    response.setHeader?.('Retry-After', '30')
    response.status(503).json({ error: { code: 'RATE_LIMIT_UNAVAILABLE', message: 'This action is temporarily unavailable. Please try again shortly.', requestId: id } })
    return false
  }
}
