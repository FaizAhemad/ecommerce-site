import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { db } from './db.js'
import { sessionLimits, sessionDeadline } from './session-policy.js'
import {
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from './http.js'

const scrypt = promisify(nodeScrypt)
const SESSION_COOKIE = 'gadgify_session'

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex) return false
  const actual = (await scrypt(password, salt, 64)) as Buffer
  const expected = Buffer.from(expectedHex, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string, response: VercelResponse) {
  const token = randomBytes(32).toString('hex')
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } })
  const limits = sessionLimits(user.role)
  const expiresAt = new Date(Date.now() + limits.idleMs)
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } })
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader?.(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${limits.absoluteMs / 1000}`,
  )
}

export function sessionToken(request: VercelRequest) {
  const headers = request.headers ?? {}
  const cookieHeader = headers.cookie ?? headers.Cookie
  const cookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader
  return cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)
}

export async function currentSession(request: VercelRequest) {
  const token = sessionToken(request)
  if (!token) return null
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!session || sessionDeadline(session) <= Date.now()) return null
  return session
}

export async function currentUser(request: VercelRequest) {
  return (await currentSession(request))?.user ?? null
}

export async function requireUser(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const user = await currentUser(request)
  if (!user) {
    sendError(response, 401, 'UNAUTHORIZED', 'Sign in is required.', requestId(request))
    return null
  }
  return user
}

export async function requireAdmin(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response)
  if (!user) return null
  if (user.role !== 'ADMIN') {
    sendError(response, 403, 'FORBIDDEN', 'Administrator access is required.', requestId(request))
    return null
  }
  return user
}

export async function clearSession(request: VercelRequest, response: VercelResponse) {
  const token = sessionToken(request)
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  expireSessionCookie(response)
}

export function expireSessionCookie(response: VercelResponse) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader?.(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`,
  )
}
