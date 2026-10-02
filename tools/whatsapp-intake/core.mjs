import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const digest = (value) => createHash('sha256').update(value).digest('hex')
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const text = (value, max = 4096) => typeof value === 'string' ? value.slice(0, max) : ''

export function verifySignature(raw, signature, secret) {
  if (!Buffer.isBuffer(raw) || !secret || !/^sha256=[a-f0-9]{64}$/.test(signature ?? '')) return false
  return timingSafeEqual(createHmac('sha256', secret).update(raw).digest(), Buffer.from(signature.slice(7), 'hex'))
}

export function safeName(value) {
  const clean = String(value).normalize('NFKC').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, '-').replace(/^[. -]+|[. -]+$/g, '').slice(0, 70).replace(/[. -]+$/g, '')
  return !clean || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(clean) ? `item-${digest(String(value)).slice(0, 12)}` : clean
}

export function validateConfig(config) {
  if (!/^\d{5,30}$/.test(config.phoneNumberId ?? '') || !Array.isArray(config.vendors) || !config.vendors.length) throw new Error('Configure the Meta phone-number ID and at least one vendor.')
  const ids = new Set(), senders = new Set()
  for (const vendor of config.vendors) {
    if (!/^[a-z0-9-]{1,40}$/.test(vendor.id ?? '') || typeof vendor.name !== 'string' || !vendor.name.trim() || !/^\d{7,15}$/.test(vendor.sender ?? '') || ids.has(vendor.id) || senders.has(vendor.sender)) throw new Error('Vendor IDs and sender numbers must be valid and unique.')
    ids.add(vendor.id); senders.add(vendor.sender)
  }
  return config
}

/** Only configured senders are retained; customer messages and delivery statuses are ignored. */
export function incoming(payload, config) {
  if (payload?.object !== 'whatsapp_business_account') throw new Error('Invalid WhatsApp envelope')
  const results = []
  for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
      const value = record(change.value)
      if (change.field !== 'messages' || value.metadata?.phone_number_id !== config.phoneNumberId) continue
      for (const msg of Array.isArray(value.messages) ? value.messages : []) {
        const vendor = config.vendors.find((item) => item.sender === msg.from)
        if (!vendor || typeof msg.id !== 'string' || !msg.id || msg.id.length > 256) continue
        if (results.length >= 100) throw new Error('Message batch too large')
        const type = text(msg.type, 30)
        const media = record(msg[type])
        results.push({
          id: msg.id, vendorId: vendor.id, sender: vendor.sender,
          timestamp: /^\d{1,12}$/.test(msg.timestamp ?? '') ? msg.timestamp : '',
          replyTo: text(msg.context?.id, 256), type,
          text: type === 'text' ? text(msg.text?.body) : text(media.caption),
          mediaId: ['image', 'video'].includes(type) ? text(media.id, 128) : '',
        })
      }
    }
  }
  return results
}

/** Explicit fields only. Unstructured product inference requires a separate reviewed extractor. */
export function productFields(message) {
  const fields = {}
  for (const line of message.split(/\r?\n/)) {
    const match = /^(product|code|sku|price|description|category|brand|sizes|colors|stock)\s*:\s*(.+)$/i.exec(line.trim())
    if (!match) continue
    const key = match[1].toLowerCase() === 'sku' ? 'code' : match[1].toLowerCase()
    if (fields[key] !== undefined && fields[key] !== match[2].trim()) return { issue: 'Conflicting fields: split this message into individual products.' }
    fields[key] = match[2].trim()
  }
  if (fields.price && !/^\d{1,8}(\.\d{1,2})?$/.test(fields.price)) return { ...fields, issue: 'Price needs review. Use a numeric INR amount, for example Price: 149.00.' }
  if (fields.stock && !/^\d{1,8}$/.test(fields.stock)) return { ...fields, issue: 'Stock needs review. Use a non-negative whole number.' }
  return fields
}

export function mediaExtension(mime, bytes) {
  if (mime === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg'
  if (mime === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png'
  if (mime === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (mime === 'video/mp4' && bytes.toString('ascii', 4, 8) === 'ftyp') return 'mp4'
  throw new Error('Unsupported or mismatched media format')
}
