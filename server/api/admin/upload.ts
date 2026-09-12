import { put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { validateMediaUpload } from '../_lib/media.js'
import { requireAdmin } from '../_lib/auth.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  if (request.method !== 'POST') return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request); const data = typeof body.data === 'string' ? body.data : ''; const contentType = typeof body.contentType === 'string' ? body.contentType : 'application/octet-stream'
  if (!/^image\/(?:jpeg|png|webp|gif)$|^video\/(?:mp4|webm)$/i.test(contentType)) return sendError(response, 400, 'VALIDATION_ERROR', 'Only supported image and video media can be uploaded.', id)
  if (!data.startsWith('data:') || data.length > 8_000_000) return sendError(response, 400, 'VALIDATION_ERROR', 'Provide a valid file smaller than 6 MB.', id)
  const media = validateMediaUpload(data, contentType, 6_000_000)
  if (!media) return sendError(response, 400, 'VALIDATION_ERROR', 'The file data is invalid or does not match its image or video type.', id)
  try { const blob = await put(`products/${randomUUID()}.${media.extension}`, media.bytes, { access: 'public', contentType: media.contentType, addRandomSuffix: true }); return response.status(201).json({ url: blob.url, requestId: id }) } catch { return sendError(response, 503, 'STORAGE_UNAVAILABLE', 'Media storage is temporarily unavailable.', id) }
}
