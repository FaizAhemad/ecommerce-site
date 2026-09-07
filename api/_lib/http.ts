export type VercelRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}

export type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => unknown
  setHeader?: (name: string, value: string) => void
}

export function bodyRecord(request: VercelRequest): Record<string, unknown> {
  return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
}

export function requestId(request: VercelRequest): string {
  const value = request.headers?.['x-request-id']
  return typeof value === 'string' && value ? value : crypto.randomUUID()
}

export function sendError(response: VercelResponse, status: number, code: string, message: string, id: string) {
  return response.status(status).json({ error: { code, message, requestId: id } })
}

export function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
