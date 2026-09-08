import { db } from '../_lib/db.js'
import { fetchWithTimeout } from '../_lib/http.js'

type VercelRequest = { method?: string; body?: { email?: unknown } }
type VercelResponse = { status: (code: number) => { json: (body: unknown) => unknown } }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' })
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!apiKey) return response.status(503).json({ error: 'Newsletter email service is not configured.' })
  try {
    if (audienceId) {
      const result = await fetchWithTimeout(`https://api.resend.com/audiences/${audienceId}/contacts`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, unsubscribed: false }) })
      if (!result.ok) return response.status(502).json({ error: 'Newsletter service unavailable.' })
    }
    await db.newsletterSubscription.upsert({ where: { email }, create: { email }, update: { status: 'ACTIVE', unsubscribedAt: null } })
    let emailSent = false
    if (fromEmail) {
      const emailResponse = await fetchWithTimeout('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: fromEmail, to: [email], subject: 'Welcome to Field & Form', html: '<p>Thanks for subscribing to Field &amp; Form.</p><p><a href="/">Return to the home page</a> for considered goods and useful ideas.</p>' }) })
      if (!emailResponse.ok) return response.status(502).json({ error: 'Subscription saved, but the confirmation email could not be sent.' })
      emailSent = true
    }
    return response.status(202).json({ subscribed: true, emailSent })
  } catch { return response.status(502).json({ error: 'Newsletter service unavailable.' }) }
}
