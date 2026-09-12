const extensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
} as const

type MediaType = keyof typeof extensions

/** Signature checks are an additional layer, not full decoding or malware scanning. */
function matchesSignature(bytes: Buffer, type: MediaType): boolean {
  switch (type) {
    case 'image/jpeg':
      return bytes.length >= 4 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    case 'image/png':
      return bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR'
    case 'image/gif':
      return bytes.length >= 13 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))
    case 'image/webp':
      return bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))
    case 'video/mp4':
      return bytes.length >= 16 && bytes.toString('ascii', 4, 8) === 'ftyp' && bytes.readUInt32BE(0) >= 16 && bytes.readUInt32BE(0) <= bytes.length
    case 'video/webm':
      return bytes.length >= 8 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  }
}

/** Accept only bounded, canonical base64 data URLs matching the declared media type. */
export function validateMediaUpload(data: string, declaredType: string, maxBytes: number) {
  const contentType = declaredType.toLowerCase()
  if (!Object.hasOwn(extensions, contentType)) return null
  if (data.length > Math.ceil(maxBytes / 3) * 4 + 64) return null
  const comma = data.indexOf(',')
  if (comma < 0 || data.slice(0, comma).toLowerCase() !== `data:${contentType};base64`) return null
  const encoded = data.slice(comma + 1)
  if (!encoded.length || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return null
  const bytes = Buffer.from(encoded, 'base64')
  if (!bytes.length || bytes.length > maxBytes || bytes.toString('base64') !== encoded) return null
  const type = contentType as MediaType
  if (!matchesSignature(bytes, type)) return null
  return { bytes, contentType: type, extension: extensions[type] }
}
