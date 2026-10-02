import { timingSafeEqual } from 'node:crypto'
import { incoming, verifySignature } from './core.mjs'

export function createReceiver({ config, appSecret, verifyToken, save }) {
  return async (request, response) => {
    const send = (status, value) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(value) }
    try {
      const url = new URL(request.url, 'http://localhost')
      if (url.pathname !== '/webhooks/whatsapp') return send(404, 'Not found')
      if (request.method === 'GET') {
        const token = Buffer.from(url.searchParams.get('hub.verify_token') ?? '')
        const expected = Buffer.from(verifyToken)
        const challenge = url.searchParams.get('hub.challenge') ?? ''
        if (url.searchParams.get('hub.mode') !== 'subscribe' || !expected.length || token.length !== expected.length || !timingSafeEqual(token, expected) || !/^\d{1,100}$/.test(challenge)) return send(403, 'Verification failed')
        return send(200, challenge)
      }
      if (request.method !== 'POST') return send(405, 'Method not allowed')
      const chunks = []; let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > 262144) return send(413, 'Payload too large')
        chunks.push(chunk)
      }
      const raw = Buffer.concat(chunks)
      if (!verifySignature(raw, request.headers['x-hub-signature-256'], appSecret)) return send(401, 'Invalid signature')
      let payload
      try { payload = JSON.parse(raw.toString('utf8')) } catch { return send(400, 'Invalid JSON') }
      let messages
      try { messages = incoming(payload, config) } catch { return send(400, 'Invalid message envelope') }
      await save(messages)
      return send(200, 'Accepted')
    } catch {
      // Do not log message bodies, phone numbers, access tokens or provider responses.
      return send(503, 'Intake unavailable; retry later')
    }
  }
}
