import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from './_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const correlation = requestId(request), user = await requireUser(request, response)
  if (!user) return
  const body = bodyRecord(request), ticketId = request.method === 'GET' ? request.query?.ticketId : body.ticketId
  if (typeof ticketId !== 'string' || !/^[a-f\d-]{36}$/i.test(ticketId)) return sendError(response, 400, 'VALIDATION_ERROR', 'Select a request.', correlation)
  try {
    const result = await db.$transaction(async (tx) => {
      const [ticket] = await tx.$queryRaw<{ userId: string; status: string }[]>`SELECT "userId","status" FROM "SupportTicket" WHERE "id"=${ticketId}`
      if (!ticket || (ticket.userId !== user.id && user.role !== 'ADMIN')) return { status: 404, message: 'Request not found.' }
      if (request.method === 'GET') {
        const rawPage = request.query?.page ?? '0'
        if (typeof rawPage !== 'string' || !/^\d{1,5}$/.test(rawPage)) return { status: 400, message: 'Invalid page.' }
        const page = Number(rawPage), offset = page * 20
        const replies = await tx.$queryRaw<{ id: string; body: string; fromAdmin: boolean; createdAt: Date }[]>`SELECT "id","body","fromAdmin","createdAt" FROM "SupportReply" WHERE "ticketId"=${ticketId} ORDER BY "createdAt" DESC,"id" DESC LIMIT 21 OFFSET ${offset}`
        return { status: 200, replies: replies.slice(0, 20), nextPage: replies.length > 20 ? page + 1 : null }
      }
      if (request.method !== 'POST') return { status: 405, message: 'Use GET or POST.' }
      const id = typeof body.id === 'string' ? body.id : '', text = typeof body.body === 'string' ? body.body.trim() : ''
      if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || !text || text.length > 4000) return { status: 400, message: 'Enter a reply up to 4000 characters.' }
      const [previous] = await tx.$queryRaw<{ authorId: string; ticketId: string; body: string }[]>`SELECT "authorId","ticketId","body" FROM "SupportReply" WHERE "id"=${id}`
      if (previous) return previous.authorId === user.id && previous.ticketId === ticketId && previous.body === text ? { status: 200, saved: true } : { status: 409, message: 'Reply details changed. Refresh before retrying.' }
      if (!['OPEN', 'IN_PROGRESS'].includes(ticket.status)) return { status: 409, message: 'This request is closed. Start a new support request.' }
      const fromAdmin = user.role === 'ADMIN' && ticket.userId !== user.id
      await tx.$executeRaw`INSERT INTO "SupportReply" ("id","ticketId","authorId","fromAdmin","body") VALUES (${id},${ticketId},${user.id},${fromAdmin},${text})`
      return { status: 201, saved: true }
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
    if ('message' in result) return sendError(response, result.status, 'REPLY_REJECTED', result.message!, correlation)
    return response.status(result.status).json(result)
  } catch { return sendError(response, 503, 'REPLY_UNAVAILABLE', 'Unable to confirm your reply. Refresh the conversation before retrying.', correlation) }
}
