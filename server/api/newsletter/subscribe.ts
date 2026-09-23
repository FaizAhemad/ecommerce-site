import { db } from '../_lib/db.js'
import { activateNewsletter } from '../_lib/newsletter-subscription.js'
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
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
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
    phase = 'subscription'
    const activated = await activateNewsletter(db, email)
    if (!activated) {
      const existing = await db.newsletterSubscription.findUnique({ where: { email }, select: { status: true } })
      if (existing?.status !== 'ACTIVE') return sendError(response, 409, 'NEWSLETTER_UNAVAILABLE', 'This subscription cannot be changed here. Please contact support.', id)
      return sendError(response, 409, 'ALREADY_SUBSCRIBED', 'This email is already subscribed.', id)
    }
    saved = true
    phase = 'audience'
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
          'CONFIRMATION_EMAIL_FAILED',
          'Subscription saved, but provider synchronization and confirmation could not be completed.',
          id,
        )
      }
    }
    phase = 'confirmation'
    let emailSent = false
    if (fromEmail) {
      const emailResponse = await fetchWithTimeout('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Welcome to Gadgify',
          html: '<p>Thanks for subscribing to Gadgify.</p><p>Look out for new arrivals and updates from our store.</p>',
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
