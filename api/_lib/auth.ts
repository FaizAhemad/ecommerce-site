import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { db } from './db.js'
import type { VercelRequest, VercelResponse } from './http.js'

const scrypt = promisify(nodeScrypt)
const SESSION_COOKIE = 'gadgify_session'
const SESSION_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex) return false
  const actual = await scrypt(password, salt, 64) as Buffer
  const expected = Buffer.from(expectedHex, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }

export async function createSession(userId: string, response: VercelResponse) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } })
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader?.('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`)
}

export function sessionToken(request: VercelRequest) {
  const cookieHeader = request.headers?.cookie
  const cookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader
  return cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1)
}

export async function currentUser(request: VercelRequest) {
  const token = sessionToken(request)
  if (!token) return null
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } })
  if (!session || session.expiresAt <= new Date()) return null
  return session.user
}

export async function requireUser(request: VercelRequest, response: VercelResponse) {
  const user = await currentUser(request)
  if (!user) {
    response.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in is required.' } })
    return null
  }
  return user
}

export async function requireAdmin(request: VercelRequest, response: VercelResponse) {
  const user = await requireUser(request, response)
  if (!user) return null
  if (user.role !== 'ADMIN') {
    response.status(403).json({ error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } })
    return null
  }
  return user
}

export async function clearSession(request: VercelRequest, response: VercelResponse) {
  const token = sessionToken(request)
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader?.('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`)
}
