import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { validateMediaUpload } from './_lib/media.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from './_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const correlation = requestId(request), user = await requireUser(request, response)
  if (!user) return
  const body = bodyRecord(request)
  const ticketId = request.method === 'GET' ? request.query?.ticketId : body.ticketId
  if (typeof ticketId !== 'string' || !/^[a-f\d-]{36}$/i.test(ticketId)) return sendError(response, 400, 'VALIDATION_ERROR', 'Select a support request.', correlation)
  try {
    const result = await db.$transaction(async (tx) => {
      const tickets = await tx.$queryRaw<{ userId: string; status: string }[]>`SELECT "userId","status" FROM "SupportTicket" WHERE "id"=${ticketId}`
      const ticket = tickets[0]
      if (!ticket || (ticket.userId !== user.id && user.role !== 'ADMIN')) return { status: 404, message: 'Support request not found.' }
      if (request.method === 'GET') {
        const attachments = await tx.$queryRaw<{ id: string; contentType: string; data: string }[]>`SELECT "id","contentType","data" FROM "SupportAttachment" WHERE "ticketId"=${ticketId} ORDER BY "createdAt","id" LIMIT 3`
        return { status: 200, attachments }
      }
      if (request.method !== 'POST') return { status: 405, message: 'Use GET or POST.' }
      if (ticket.userId !== user.id || !['OPEN', 'IN_PROGRESS'].includes(ticket.status)) return { status: 403, message: 'Only the customer can attach files to an open request.' }
      const id = typeof body.id === 'string' ? body.id : ''
      const type = typeof body.contentType === 'string' ? body.contentType : ''
      const data = typeof body.data === 'string' ? body.data : ''
      if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || !['image/jpeg', 'image/png'].includes(type) || !validateMediaUpload(data, type, 256000)) return { status: 400, message: 'Choose a JPEG or PNG image up to 250 KB.' }
      const prior = await tx.$queryRaw<{ id: string; data: string }[]>`SELECT "id","data" FROM "SupportAttachment" WHERE "ticketId"=${ticketId}`
      const existing = prior.find((item) => item.id === id)
      if (existing) return existing.data === data ? { status: 200, saved: true } : { status: 409, message: 'Attachment changed. Refresh before retrying.' }
      if (prior.length >= 3) return { status: 409, message: 'A request supports up to three attachments.' }
      await tx.$executeRaw`INSERT INTO "SupportAttachment" ("id","ticketId","contentType","data") VALUES (${id},${ticketId},${type},${data})`
      return { status: 201, saved: true }
    }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
    if ('message' in result) return sendError(response, result.status, 'ATTACHMENT_REJECTED', result.message!, correlation)
    return response.status(result.status).json(result)
  } catch {
    return sendError(response, 503, 'ATTACHMENT_UNAVAILABLE', 'Unable to confirm attachments. Refresh before retrying; your ticket is saved separately.', correlation)
  }
}
