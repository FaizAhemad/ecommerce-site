import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { parseNotificationJob, processDueNotifications } from '../_lib/notification-queue.js'
import { requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!await requireAdmin(request, response)) return
  if (request.method === 'POST') {
    try { return response.status(200).json(await processDueNotifications(db, { apiKey: process.env.RESEND_API_KEY, from: process.env.RESEND_FROM_EMAIL, supportEmail: process.env.SUPPORT_EMAIL })) }
    catch { return sendError(response, 503, 'NOTIFICATIONS_UNAVAILABLE', 'Unable to confirm processing. Refresh notification history.', id) }
  }
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
  const raw = request.query?.page ?? '0'
  if (typeof raw !== 'string' || !/^\d{1,5}$/.test(raw)) return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid page.', id)
  try {
    const rows = await db.storeSetting.findMany({ where: { key: { startsWith: 'order-email.' } }, orderBy: [{ updatedAt: 'desc' }, { key: 'asc' }], skip: Number(raw) * 25, take: 26 })
    const notifications = rows.slice(0, 25).map((row) => {
      const job = parseNotificationJob(row.value)
      if (job) return { id: row.key, orderId: job.orderId, kind: job.kind, status: job.status, attempts: job.attempts,
        availableAt: new Date(job.availableAt).toISOString(), updatedAt: row.updatedAt, legacy: false }
      const value = JSON.parse(row.value) as Record<string, unknown>
      const match = /^order-email\.(.+)\.(ORDER_RECORDED|DISPATCHED|DELIVERED)$/.exec(row.key)
      if (!match || !['ACCEPTED', 'UNCONFIRMED'].includes(String(value.status))) throw new Error('Invalid notification record')
      return { id: row.key, orderId: match[1], kind: match[2], status: value.status, updatedAt: row.updatedAt, legacy: true }
    })
    return response.status(200).json({ notifications, configured: !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL, supportConfigured: !!process.env.SUPPORT_EMAIL, nextPage: rows.length > 25 ? Number(raw) + 1 : null })
  } catch { return sendError(response, 503, 'NOTIFICATIONS_UNAVAILABLE', 'Notification history is unavailable.', id) }
}
