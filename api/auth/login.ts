import { db } from '../_lib/db.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
import { createSession, hashPassword, verifyPassword } from '../_lib/auth.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const isPhone = identifier.startsWith('+') || /^\d+$/.test(identifier)
  const email = isPhone ? '' : identifier.toLowerCase()
  const phone = isPhone ? identifier.replace(/[^\d+]/g, '') : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if ((!email && !phone) || !password) return sendError(response, 400, 'VALIDATION_ERROR', 'Email or mobile number and password are required.', id)
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD
    let user = isPhone ? await db.user.findUnique({ where: { phone } }) : await db.user.findUnique({ where: { email } })
    if (!isPhone && adminEmail && adminPassword && email === adminEmail && password === adminPassword && !user) {
      user = await db.user.create({ data: { email: adminEmail, passwordHash: await hashPassword(adminPassword), role: 'ADMIN' } })
    } else if (!isPhone && user && adminEmail === email && adminPassword && password === adminPassword && user.role !== 'ADMIN') {
      user = await db.user.update({ where: { id: user.id }, data: { role: 'ADMIN', passwordHash: await hashPassword(adminPassword) } })
    }
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return sendError(response, 401, 'UNAUTHORIZED', 'Email or password is incorrect.', id)
    await createSession(user.id, response)
    return response.status(200).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, requestId: id })
  } catch {
    return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Sign in is temporarily unavailable.', id)
  }
}
