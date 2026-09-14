import { db } from './_lib/db.js'
import { requireUser, verifyPassword } from './_lib/auth.js'
import { addressSelect, profileInput, profileSelect, ProfileError } from './_lib/profile.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  const user = await requireUser(request, response)
  if (!user) return
  if (request.method !== 'GET' && request.method !== 'PATCH')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
  try {
    if (request.method === 'PATCH') {
      const body = bodyRecord(request),
        input = profileInput(body)
      const password = typeof body.currentPassword === 'string' ? body.currentPassword : ''
      const changesPhone = input.phone !== user.phone
      if (
        changesPhone &&
        (!password ||
          password.length > 128 ||
          !user.passwordHash ||
          !(await verifyPassword(password, user.passwordHash)))
      )
        throw new ProfileError(
          400,
          'REAUTH_REQUIRED',
          'Enter your current password to change your login phone number.',
        )
      if (changesPhone && !input.phone && !user.email)
        throw new ProfileError(400, 'CONTACT_REQUIRED', 'Keep a login contact on your account.')
      await db.$transaction(
        async (tx) => {
          const changed = await tx.user.updateMany({
            where: { id: user.id, updatedAt: user.updatedAt, passwordHash: user.passwordHash },
            data: { ...input, ...(changesPhone ? { phoneVerifiedAt: null } : {}) },
          })
          if (changed.count !== 1)
            throw new ProfileError(
              409,
              'CONFLICT',
              'Your account changed. Refresh before saving again.',
            )
          if (changesPhone)
            await tx.verificationToken.deleteMany({
              where: { userId: user.id, purpose: 'MOBILE_VERIFICATION' },
            })
        },
        { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 },
      )
    }
    const profile = await db.user.findUnique({ where: { id: user.id }, select: profileSelect })
    if (!profile) return sendError(response, 401, 'UNAUTHORIZED', 'Sign in is required.', id)
    const addresses = await db.address.findMany({
      where: { userId: user.id },
      select: addressSelect,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    return response.status(200).json({
      profile: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        emailVerified: Boolean(profile.emailVerifiedAt),
        phoneVerified: Boolean(profile.phoneVerifiedAt),
      },
      addresses,
    })
  } catch (error) {
    if (error instanceof ProfileError)
      return sendError(response, error.status, error.code, error.message, id)
    const conflict =
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['P2002', 'P2034'].includes(String(error.code))
    return sendError(
      response,
      conflict ? 409 : 503,
      conflict ? 'CONFLICT' : 'PROFILE_UNAVAILABLE',
      conflict
        ? 'Unable to save these details. Refresh and check your contact information.'
        : 'Profile is temporarily unavailable. Check the current status before trying again.',
      id,
    )
  }
}
