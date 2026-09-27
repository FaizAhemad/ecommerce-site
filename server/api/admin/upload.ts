import { put } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { randomUUID } from 'node:crypto'
import { logMediaStorageFailure, productUploadPolicy, validateMediaUpload } from '../_lib/media.js'
import { requireAdmin } from '../_lib/auth.js'
import {
  bodyRecord,
  requestId,
  sendError,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  if (request.method !== 'POST')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only POST is supported.', id)
  const body = bodyRecord(request)
  if (body.type === 'blob.generate-client-token') {
    const uploadBody = body as unknown as HandleUploadBody
    if (uploadBody.type !== 'blob.generate-client-token')
      return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid media upload request.', id)
    try {
      const result = await handleUpload({
        body: uploadBody,
        request: request as unknown as import('node:http').IncomingMessage,
        onBeforeGenerateToken: async (pathname) => {
          const policy = productUploadPolicy(pathname)
          if (!policy) throw new Error('Invalid product media path.')
          return {
            allowedContentTypes: [policy.contentType],
            maximumSizeInBytes: policy.maxBytes,
            addRandomSuffix: true,
            validUntil: Date.now() + 60_000,
          }
        },
      })
      return response.status(200).json(result)
    } catch {
      return sendError(
        response,
        503,
        'STORAGE_UNAVAILABLE',
        'Media storage is temporarily unavailable. Try again shortly.',
        id,
      )
    }
  }
  if (body.type !== undefined)
    return sendError(response, 400, 'VALIDATION_ERROR', 'Invalid media upload request.', id)
  const data = typeof body.data === 'string' ? body.data : ''
  const contentType =
    typeof body.contentType === 'string' ? body.contentType : 'application/octet-stream'
  if (!/^image\/(?:jpeg|png|webp|gif)$|^video\/(?:mp4|webm)$/i.test(contentType))
    return sendError(
      response,
      400,
      'VALIDATION_ERROR',
      'Only supported image and video media can be uploaded.',
      id,
    )
  const maxBytes = contentType.toLowerCase().startsWith('video/') ? 10_000_000 : 6_000_000
  if (!data.startsWith('data:') || data.length > Math.ceil(maxBytes / 3) * 4 + 64)
    return sendError(
      response,
      400,
      'VALIDATION_ERROR',
      `Provide a valid file no larger than ${maxBytes === 10_000_000 ? '10' : '6'} MB.`,
      id,
    )
  const media = validateMediaUpload(data, contentType, maxBytes)
  if (!media)
    return sendError(
      response,
      400,
      'VALIDATION_ERROR',
      'The file data is invalid or does not match its image or video type.',
      id,
    )
  try {
    const blob = await put(`products/${randomUUID()}.${media.extension}`, media.bytes, {
      access: 'public',
      contentType: media.contentType,
      addRandomSuffix: true,
    })
    return response.status(201).json({ url: blob.url, requestId: id })
  } catch (error) {
    logMediaStorageFailure(error, id, 'admin_upload')
    return sendError(
      response,
      503,
      'STORAGE_UNAVAILABLE',
      'Media storage is temporarily unavailable.',
      id,
    )
  }
}
