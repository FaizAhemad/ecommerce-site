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
    if (request.method === 'GET')
      return response.status(200).json({
        messages: await db.customerMessage.findMany({
          select,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 100,
        }),
        requestId: id,
      })
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
