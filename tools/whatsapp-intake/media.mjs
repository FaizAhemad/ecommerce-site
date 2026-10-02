import { writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { digest, mediaExtension } from './core.mjs'

export async function boundedBody(response, limit) {
  if (!response.ok || Number(response.headers.get('content-length') ?? 0) > limit) throw new Error('Provider response rejected')
  const chunks = []; let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    if (size > limit) throw new Error('Media exceeds configured limit')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export async function downloadMedia(message, directory, settings, fetcher = fetch) {
  if (!/^\d{1,128}$/.test(message.mediaId) || !/^v\d+\.\d+$/.test(settings.graphVersion)) throw new Error('Invalid provider configuration')
  const headers = { Authorization: `Bearer ${settings.accessToken}` }
  const metadataResponse = await fetcher(`https://graph.facebook.com/${settings.graphVersion}/${message.mediaId}`, { headers, redirect: 'error', signal: AbortSignal.timeout(30000) })
  const metadata = JSON.parse((await boundedBody(metadataResponse, 65536)).toString('utf8'))
  const url = new URL(metadata.url)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !['lookaside.fbsbx.com', 'lookaside.facebook.com'].includes(url.hostname)) throw new Error('Unexpected Meta media host')
  const limit = message.type === 'video' ? 16 * 1024 * 1024 : 5 * 1024 * 1024
  if (metadata.file_size > limit) throw new Error('Media too large')
  const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(30000) })
  const bytes = await boundedBody(response, limit)
  const extension = mediaExtension(metadata.mime_type, bytes)
  if ((message.type === 'video') !== (extension === 'mp4')) throw new Error('Unexpected media type')
  if (metadata.sha256) {
    const hash = createHash('sha256').update(bytes)
    const encoding = /^[a-f0-9]{64}$/i.test(metadata.sha256) ? 'hex' : 'base64'
    if (hash.digest(encoding) !== metadata.sha256) throw new Error('Media hash mismatch')
  }
  const filename = path.join(directory, `${digest(message.id)}.${extension}`)
  await writeFile(`${filename}.pending`, bytes)
  await rename(`${filename}.pending`, filename)
  return filename
}
