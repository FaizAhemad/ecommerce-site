import { db } from './_lib/db.js'
import { requireUser, requireAdmin } from './_lib/auth.js'
import { createSupportTicket, escapeEmail, type Ticket } from './_lib/support.js'
import { ProfileError } from './_lib/profile.js'
import { sendTransactionalEmail } from './_lib/email.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from './_lib/http.js'
export default function handler(request: VercelRequest, response: VercelResponse) {
  return supportHandler(request, response, false)
}
export function adminSupport(request: VercelRequest, response: VercelResponse) {
  return supportHandler(request, response, true)
}
async function supportHandler(
  request: VercelRequest,
  response: VercelResponse,
  adminRoute: boolean,
) {
  const id = requestId(request)
  const user = await (adminRoute ? requireAdmin : requireUser)(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const raw = request.query?.page ?? '0'
      if (typeof raw !== 'string' || !/^\d{1,5}$/.test(raw))
        throw new ProfileError(400, 'VALIDATION_ERROR', 'Invalid page.')
      const offset = Number(raw) * 20
      const tickets = adminRoute
        ? await db.$queryRaw<
            Ticket[]
          >`SELECT "id","subject","body","status","resolution","emailStatus","createdAt","updatedAt" FROM "SupportTicket" ORDER BY "createdAt" DESC,"id" DESC LIMIT 21 OFFSET ${offset}`
        : await db.$queryRaw<
            Ticket[]
          >`SELECT "id","subject","body","status","resolution","emailStatus","createdAt","updatedAt" FROM "SupportTicket" WHERE "userId"=${user.id} ORDER BY "createdAt" DESC,"id" DESC LIMIT 21 OFFSET ${offset}`
      return response.status(200).json({
        tickets: tickets.slice(0, 20),
        nextPage: tickets.length > 20 ? Number(raw) + 1 : null,
      })
    }
    const body = bodyRecord(request)
    if (request.method === 'POST' && !adminRoute) {
      const ticket = await createSupportTicket(db, user.id, body, async (ticket) => {
        const destination = process.env.SUPPORT_EMAIL
        if (!destination) return false
        const results = await Promise.allSettled([
          sendTransactionalEmail(
            destination,
            `Support request ${ticket.id}`,
            `<p>${escapeEmail(ticket.subject)}</p><p>${escapeEmail(ticket.body)}</p>`,
          ),
          user.email && user.emailVerifiedAt
            ? sendTransactionalEmail(
                user.email,
                `Gadgify support request ${ticket.id}`,
                `<p>We have recorded your request. You can track it in Support requests.</p><p>Reference: ${ticket.id}</p>`,
              )
            : Promise.resolve(false),
        ])
        return results.every((result) => result.status === 'fulfilled' && Boolean(result.value))
      })
      return response.status(201).json({ ticket })
    }
    if (request.method === 'PATCH') {
      const ticketId = typeof body.id === 'string' ? body.id : ''
      const status = typeof body.status === 'string' ? body.status : ''
      const reason = typeof body.resolution === 'string' ? body.resolution.trim() : ''
      const expected = typeof body.expectedStatus === 'string' ? body.expectedStatus : ''
      if (
        !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].includes(status) ||
        !['OPEN', 'IN_PROGRESS'].includes(expected) ||
        !ticketId ||
        reason.length > 2000 ||
        (['RESOLVED', 'CANCELLED'].includes(status) && !reason)
      )
        throw new ProfileError(
          400,
          'VALIDATION_ERROR',
          'Choose a valid status and provide a resolution or cancellation reason.',
        )
      if (!adminRoute && (status !== 'CANCELLED' || expected !== 'OPEN'))
        throw new ProfileError(403, 'FORBIDDEN', 'Only open requests can be cancelled here.')
      const changed = adminRoute
        ? await db.$executeRaw`UPDATE "SupportTicket" SET "status"=${status},"resolution"=${reason || null},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${ticketId} AND "status"=${expected}`
        : await db.$executeRaw`UPDATE "SupportTicket" SET "status"='CANCELLED',"resolution"=${reason},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${ticketId} AND "userId"=${user.id} AND "status"='OPEN'`
      if (changed !== 1)
        throw new ProfileError(
          409,
          'CONFLICT',
          'Request unavailable or already changed. Refresh before trying again.',
        )
      return response.status(200).json({ updated: true })
    }
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Unsupported support action.', id)
  } catch (error) {
    if (error instanceof ProfileError)
      return sendError(response, error.status, error.code, error.message, id)
    return sendError(
      response,
      503,
      'SUPPORT_UNAVAILABLE',
      'Support requests are temporarily unavailable. Please check the current status before trying again.',
      id,
    )
  }
}
