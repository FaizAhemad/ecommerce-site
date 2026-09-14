import { db } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'
import { feedbackState, saveFeedback, FeedbackError } from './_lib/feedback.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from './_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request), user = await requireUser(request, response)
  if (!user) return
  try {
    if (request.method === 'GET') {
      const state = await feedbackState(db, user.id)
      return response.status(200).json({ eligible: Boolean(state.order), orderNumber: state.order?.orderNumber ?? null, feedback: state.feedback })
    }
    if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or POST.', id)
    const feedback = await saveFeedback(db, user.id, bodyRecord(request))
    return response.status(201).json({ feedback })
  } catch (error) {
    if (error instanceof FeedbackError) return sendError(response, error.status, 'FEEDBACK_REJECTED', error.message, id)
    return sendError(response, 503, 'FEEDBACK_UNAVAILABLE', 'Feedback is temporarily unavailable. Your order is unaffected.', id)
  }
}
