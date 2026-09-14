import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { policyKey, parsePolicy, updatePolicy, PolicyError } from '../_lib/policies.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request), admin = await requireAdmin(request, response)
  if (!admin) return
  try {
    if (request.method === 'GET') {
      const key = policyKey(request.query?.kind, request.query?.locale ?? 'en')
      return response.status(200).json({ state: parsePolicy((await db.storeSetting.findUnique({ where: { key } }))?.value) })
    }
    if (request.method !== 'PUT') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PUT.', id)
    return response.status(200).json({ state: await updatePolicy(db, admin.id, bodyRecord(request)) })
  } catch (error) {
    if (error instanceof PolicyError) return sendError(response, error.status, 'POLICY_REJECTED', error.message, id)
    return sendError(response, 503, 'POLICY_UNAVAILABLE', 'Unable to confirm the policy change. Reload before retrying.', id)
  }
}
