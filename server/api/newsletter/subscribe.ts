import { db } from '../_lib/db.js'
import {
  bodyRecord,
  fetchWithTimeout,
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  setCacheControl(response, 'private')
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return sendError(response, 400, 'VALIDATION_ERROR', 'Enter a valid email address.', id)
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!apiKey)
    return sendError(
      response,
      503,
      'NEWSLETTER_UNAVAILABLE',
      'Newsletter signup is temporarily unavailable. Please try again later.',
      id,
    )
  let saved = false
  let phase = 'audience'
  try {
    if (audienceId) {
      const result = await fetchWithTimeout(
        `https://api.resend.com/audiences/${audienceId}/contacts`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, unsubscribed: false }),
        },
      )
      if (!result.ok) {
        console.error(
          JSON.stringify({
            event: 'newsletter_provider_rejected',
            phase,
            status: result.status,
            requestId: id,
          }),
        )
        return sendError(
          response,
          502,
          'NEWSLETTER_UNAVAILABLE',
          'Newsletter service unavailable.',
          id,
        )
      }
    }
    phase = 'subscription'
    await db.newsletterSubscription.upsert({
      where: { email },
      create: { email },
      update: { status: 'ACTIVE', unsubscribedAt: null },
    })
    saved = true
    phase = 'confirmation'
    let emailSent = false
    if (fromEmail) {
      const emailResponse = await fetchWithTimeout('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Welcome to Field & Form',
          html: '<p>Thanks for subscribing to Field &amp; Form.</p><p><a href="/">Return to the home page</a> for considered goods and useful ideas.</p>',
        }),
      })
      if (!emailResponse.ok) {
        console.error(
          JSON.stringify({
            event: 'newsletter_provider_rejected',
            phase,
            status: emailResponse.status,
            requestId: id,
          }),
        )
        return sendError(
          response,
          502,
          'CONFIRMATION_EMAIL_FAILED',
          'Subscription saved, but the confirmation email could not be sent.',
          id,
        )
      }
      emailSent = true
    }
    return response.status(202).json({ subscribed: true, emailSent })
  } catch {
    console.error(JSON.stringify({ event: 'newsletter_operation_failed', phase, requestId: id }))
    return sendError(
      response,
      502,
      saved ? 'CONFIRMATION_EMAIL_FAILED' : 'NEWSLETTER_UNAVAILABLE',
      saved
        ? 'Subscription saved, but the confirmation email could not be sent.'
        : 'Newsletter service unavailable.',
      id,
    )
  }
}
