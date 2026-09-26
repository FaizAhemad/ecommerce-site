import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { escapeEmail } from '../_lib/support.js'
import { createCustomerMessage, MessageError } from '../_lib/customer-messages.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'
const select = {
  id: true,
  recipientEmail: true,
  subject: true,
  body: true,
  status: true,
  createdAt: true,
  sentAt: true,
}
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request),
    admin = await requireAdmin(request, response)
  if (!admin) return
  try {
    response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
    if (request.method === 'GET') {
      const cursor = request.query?.before
      let before: { createdAt: Date; id: string } | undefined
      if (cursor !== undefined) {
        if (typeof cursor !== 'string' || cursor.length > 160)
          return sendError(response, 400, 'INVALID_CURSOR', 'Invalid history cursor.', id)
        const [timestamp, messageId, extra] = cursor.split('|')
        const date = new Date(timestamp)
        if (extra !== undefined || !messageId || !/^[a-zA-Z0-9_-]{1,100}$/.test(messageId) || !Number.isFinite(date.getTime()) || date.toISOString() !== timestamp)
          return sendError(response, 400, 'INVALID_CURSOR', 'Invalid history cursor.', id)
        before = { createdAt: date, id: messageId }
      }
      const rows = await db.customerMessage.findMany({
        select,
        where: before ? { OR: [{ createdAt: { lt: before.createdAt } }, { createdAt: before.createdAt, id: { lt: before.id } }] } : undefined,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 26,
      })
      const messages = rows.slice(0, 25), last = messages.at(-1)
      return response.status(200).json({
        messages,
        nextCursor: rows.length > 25 && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
        requestId: id,
      })
    }
    if (request.method !== 'POST')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const message = await createCustomerMessage(
      db,
      admin.id,
      bodyRecord(request),
      (email, subject, body) =>
        sendTransactionalEmail(email, subject, `<p>${escapeEmail(body)}</p>`),
    )
    return response
      .status(201)
      .json({ message: { id: message.id, status: message.status }, requestId: id })
  } catch (error) {
    if (error instanceof MessageError)
      return sendError(response, error.status, 'MESSAGE_REJECTED', error.message, id)
    return sendError(
      response,
      503,
      'MESSAGING_UNAVAILABLE',
      'Unable to confirm email acceptance. Check message history before retrying.',
      id,
    )
  }
}
