import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { sendTransactionalEmail } from '../_lib/email.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request); const admin = await requireAdmin(request, response); if (!admin) return
  try {
    if (request.method === 'GET') return response.status(200).json({ messages: await db.customerMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }), requestId: id })
    if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const body = bodyRecord(request); const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim().toLowerCase() : ''; const subject = typeof body.subject === 'string' ? body.subject.trim() : ''; const message = typeof body.body === 'string' ? body.body.trim() : ''
    if (!recipientEmail || !subject || !message) return sendError(response, 400, 'VALIDATION_ERROR', 'Recipient, subject, and message are required.', id)
    const recipient = await db.user.findUnique({ where: { email: recipientEmail }, select: { id: true } }); const sent = await sendTransactionalEmail(recipientEmail, subject, `<p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    const record = await db.customerMessage.create({ data: { senderId: admin.id, recipientId: recipient?.id, recipientEmail, subject, body: message, status: sent ? 'SENT' : 'QUEUED', sentAt: sent ? new Date() : null } }); return response.status(201).json({ message: record, requestId: id })
  } catch { return sendError(response, 503, 'DATABASE_UNAVAILABLE', 'Messaging is temporarily unavailable.', id) }
}
