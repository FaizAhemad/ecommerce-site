import type { VercelRequest } from './http.js'
type RawRequest = VercelRequest & {
  rawBody?: unknown
  readableEnded?: boolean
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | string>
}
export async function webhookBody(request: RawRequest) {
  if (typeof request.rawBody === 'string' && Buffer.byteLength(request.rawBody) <= 262144)
    return request.rawBody
  if (Buffer.isBuffer(request.rawBody) && request.rawBody.length <= 262144)
    return request.rawBody.toString('utf8')
  if (request[Symbol.asyncIterator] && !request.readableEnded) {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of request as AsyncIterable<Uint8Array | string>) {
      const bytes = Buffer.from(chunk)
      size += bytes.length
      if (size > 262144) throw new Error('Webhook too large')
      chunks.push(bytes)
    }
    return Buffer.concat(chunks).toString('utf8')
  }
  if (typeof request.body === 'string' && Buffer.byteLength(request.body) <= 262144)
    return request.body
  throw new Error('Original webhook bytes unavailable')
}
