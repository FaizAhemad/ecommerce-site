import type { VercelRequest } from './http.js'

type FilterRule =
  | { type: 'text'; maxLength?: number }
  | { type: 'number'; maxLength?: number }
  | { type: 'enum'; values: readonly string[]; maxLength?: number }

type Definition = {
  sortFields: readonly string[]
  defaultSort: string
  filters: Record<string, FilterRule>
}

export type AdminGridQuery = {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortDirection: 'asc' | 'desc'
  filters: Record<string, string>
}

export class AdminGridQueryError extends Error {
  constructor() {
    super('Invalid table query.')
    this.name = 'AdminGridQueryError'
  }
}

function value(request: VercelRequest, name: string) {
  const raw = request.query?.[name]
  if (raw === undefined) return undefined
  if (typeof raw !== 'string') throw new AdminGridQueryError()
  return raw
}

function positiveInteger(raw: string | undefined, fallback: number, maximum: number) {
  if (raw === undefined) return fallback
  if (!/^\d+$/.test(raw)) throw new AdminGridQueryError()
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new AdminGridQueryError()
  return parsed
}

export function parseAdminGridQuery(request: VercelRequest, definition: Definition): AdminGridQuery {
  const page = positiveInteger(value(request, 'page'), 1, 10_000)
  const rawPageSize = positiveInteger(value(request, 'pageSize'), 10, 50)
  if (![10, 25, 50].includes(rawPageSize)) throw new AdminGridQueryError()
  const search = (value(request, 'search') ?? '').trim()
  if (search.length > 120) throw new AdminGridQueryError()
  const rawSort = value(request, 'sortBy')
  const sortBy = rawSort ?? definition.defaultSort
  if (!definition.sortFields.includes(sortBy)) throw new AdminGridQueryError()
  const rawDirection = value(request, 'sortDirection')
  const sortDirection = rawDirection ?? 'desc'
  if (sortDirection !== 'asc' && sortDirection !== 'desc') throw new AdminGridQueryError()

  const filters: Record<string, string> = {}
  for (const key of Object.keys(request.query ?? {})) {
    if (!key.startsWith('filter_')) continue
    const name = key.slice('filter_'.length)
    const rule = definition.filters[name]
    if (!rule) throw new AdminGridQueryError()
    const raw = value(request, key)
    const filter = raw?.trim() ?? ''
    if (!filter) continue
    if (filter.length > (rule.maxLength ?? 120)) throw new AdminGridQueryError()
    if (rule.type === 'number' && !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(filter))
      throw new AdminGridQueryError()
    if (rule.type === 'enum' && !rule.values.includes(filter)) throw new AdminGridQueryError()
    filters[name] = filter
  }

  return { page, pageSize: rawPageSize, search, sortBy, sortDirection, filters }
}
