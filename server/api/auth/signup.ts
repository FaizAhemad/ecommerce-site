import { createHash, randomInt } from 'node:crypto'
import { db } from '../_lib/db.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'
import { createSession, hashPassword } from '../_lib/auth.js'
import { issueEmailVerification } from '../_lib/email-verification.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { sendVerificationSms } from '../_lib/sms.js'
import { EMAIL_ADDRESS_PATTERN, INTERNATIONAL_PHONE_PATTERN } from '../_lib/validation-patterns.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const rawPhone = body.phone
  const phone = typeof rawPhone === 'string' ? rawPhone.replace(/[^\d+]/g, '') : ''
  const method = body.verificationMethod === 'mobile' ? 'mobile' : 'email'
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name.trim() : null
  const contactNameInvalid = !name || name.length < 2 || name.length > 100
  if (
    contactNameInvalid ||
    (method === 'email' && !EMAIL_ADDRESS_PATTERN.test(email)) ||
    (method === 'mobile' && !INTERNATIONAL_PHONE_PATTERN.test(phone)) ||
    password.length < 8 || password.length > 128
  )
    return sendError(
      response,
      400,
      'VALIDATION_ERROR',
      'Enter a name between 2 and 100 characters, a valid verification contact, and a password between 8 and 128 characters.',
      id,
    )
  try {
    const user = await db.user.create({
      data: {
        email: email || undefined,
        phone: phone || undefined,
        name,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, phone: true, name: true, role: true },
    })
    if (method === 'email') {
      try {
        await issueEmailVerification(
          db,
          user.id,
          process.env.APP_URL,
          process.env.NODE_ENV === 'production',
          sendTransactionalEmail,
        )
      } catch {
        // The account exists. Let the customer sign in and request a new link.
      }
    } else {
      const code = String(randomInt(100000, 1000000))
      await db.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: createHash('sha256').update(code).digest('hex'),
          purpose: 'MOBILE_VERIFICATION',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      })
      await sendVerificationSms(phone, code)
    }
    await createSession(user.id, response)
    return response.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      requestId: id,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint'))
      return sendError(response, 409, 'CONFLICT', 'An account with this contact already exists.', id)
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Account creation is temporarily unavailable.',
      id,
    )
  }
}
