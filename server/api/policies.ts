import { db } from './_lib/db.js'
import { policyKey, parsePolicy, PolicyError } from './_lib/policies.js'
import { requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from './_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  setCacheControl(response, 'private')
  if (request.method !== 'GET') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET.', id)
  try {
    const key = policyKey(request.query?.kind, request.query?.locale ?? 'en')
    const published = parsePolicy((await db.storeSetting.findUnique({ where: { key } }))?.value).published
    return response.status(200).json({ policy: published ? { title: published.title, text: published.text, version: published.version, publishedAt: published.publishedAt } : null })
  } catch (error) {
    if (error instanceof PolicyError) return sendError(response, error.status, 'POLICY_UNAVAILABLE', error.message, id)
    return sendError(response, 503, 'POLICY_UNAVAILABLE', 'Policy content is temporarily unavailable.', id)
  }
}
