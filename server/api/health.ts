import { db } from './_lib/db.js'

type VercelRequest = { method?: string }
type VercelResponse = {
  status: (code: number) => { json: (body: unknown) => unknown }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return response.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } })

  try {
    await db.$queryRaw`SELECT 1`
    return response.status(200).json({ ok: true, database: 'connected' })
  } catch {
    return response.status(503).json({ ok: false, database: 'unavailable' })
  }
}
