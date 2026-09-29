import { Prisma } from '@prisma/client'
import { db } from '../_lib/db.js'
import { requireAdmin } from '../_lib/auth.js'
import { AdminGridQueryError, parseAdminGridQuery } from '../_lib/admin-grid-query.js'
import { requestId, sendError, setCacheControl, type VercelRequest, type VercelResponse } from '../_lib/http.js'

type CustomerGridRow = {
  id: string
  name: string | null
  email: string | null
  role: 'CUSTOMER' | 'ADMIN'
  orderCount: number
}

const orderBySql: Record<string, Prisma.Sql> = {
  createdAt: Prisma.sql`u."createdAt"`,
  name: Prisma.sql`u."name"`,
  email: Prisma.sql`u."email"`,
  role: Prisma.sql`u."role"`,
  orders: Prisma.sql`COUNT(o."id")`,
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  if (request.method !== 'GET')
    return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.', id)

  try {
    const query = parseAdminGridQuery(request, {
      defaultSort: 'createdAt',
      sortFields: ['createdAt', 'name', 'email', 'role', 'orders'],
      filters: {
        name: { type: 'text' },
        email: { type: 'text' },
        role: { type: 'enum', values: ['CUSTOMER', 'ADMIN'] },
        orders: { type: 'number' },
      },
    })
    const where: Prisma.Sql[] = []
    const having: Prisma.Sql[] = []
    const filters = query.filters
    if (filters.name)
      where.push(Prisma.sql`POSITION(LOWER(${filters.name}) IN LOWER(COALESCE(u."name", ''))) > 0`)
    if (filters.email)
      where.push(Prisma.sql`POSITION(LOWER(${filters.email}) IN LOWER(COALESCE(u."email", ''))) > 0`)
    if (filters.role) where.push(Prisma.sql`u."role" = ${filters.role}::"UserRole"`)
    if (filters.orders) having.push(Prisma.sql`COUNT(o."id") = ${Number(filters.orders)}`)

    if (query.search) {
      const searchOr: Prisma.Sql[] = [
        Prisma.sql`POSITION(LOWER(${query.search}) IN LOWER(COALESCE(u."name", ''))) > 0`,
        Prisma.sql`POSITION(LOWER(${query.search}) IN LOWER(COALESCE(u."email", ''))) > 0`,
      ]
      const roleSearch = query.search.toUpperCase()
      if (roleSearch === 'CUSTOMER' || roleSearch === 'ADMIN')
        searchOr.push(Prisma.sql`u."role" = ${roleSearch}::"UserRole"`)
      if (/^(?:0|[1-9]\d{0,8})$/.test(query.search))
        searchOr.push(Prisma.sql`COUNT(o."id") = ${Number(query.search)}`)
      having.push(Prisma.sql`(${Prisma.join(searchOr, ' OR ')})`)
    }

    const whereSql = where.length ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.empty
    const havingSql = having.length ? Prisma.sql`HAVING ${Prisma.join(having, ' AND ')}` : Prisma.empty
    const grouped = Prisma.sql`
      FROM "User" AS u
      LEFT JOIN "Order" AS o ON o."userId" = u."id"
      ${whereSql}
      GROUP BY u."id", u."name", u."email", u."role", u."createdAt"
      ${havingSql}
    `
    const orderExpression = orderBySql[query.sortBy]
    const direction = Prisma.raw(query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    const [customers, totals] = await Promise.all([
      db.$queryRaw<CustomerGridRow[]>(Prisma.sql`
        SELECT u."id", u."name", u."email", u."role", COUNT(o."id")::int AS "orderCount"
        ${grouped}
        ORDER BY ${orderExpression} ${direction} NULLS LAST, u."id" ASC
        LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}
      `),
      db.$queryRaw<{ total: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS total FROM (
          SELECT u."id"
          ${grouped}
        ) AS matching_customers
      `),
    ])
    const total = totals[0]?.total ?? 0
    return response.status(200).json({
      customers: customers.map(({ orderCount, ...customer }) => ({
        ...customer,
        _count: { orders: orderCount },
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
      requestId: id,
    })
  } catch (error) {
    if (error instanceof AdminGridQueryError)
      return sendError(response, 400, 'VALIDATION_ERROR', 'Search, filters, sorting or pagination are invalid.', id)
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Customer management is temporarily unavailable.',
      id,
    )
  }
}
