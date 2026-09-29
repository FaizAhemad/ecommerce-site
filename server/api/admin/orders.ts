import {
  updateOrderStatus,
  OrderActionError,
  isTransactionConflict,
} from '../_lib/order-transactions.js'
import { db } from '../_lib/db.js'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '../_lib/auth.js'
import { AdminGridQueryError, parseAdminGridQuery } from '../_lib/admin-grid-query.js'
import {
  bodyRecord,
  requestId,
  sendError,
  setCacheControl,
  type VercelRequest,
  type VercelResponse,
} from '../_lib/http.js'

const statuses = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const
export default async function handler(request: VercelRequest, response: VercelResponse) {
  setCacheControl(response, 'private')
  const id = requestId(request)
  if (!(await requireAdmin(request, response))) return
  try {
    if (request.method === 'GET') {
      const query = parseAdminGridQuery(request, {
        defaultSort: 'createdAt',
        sortFields: ['createdAt', 'orderNumber', 'totalMinor', 'status'],
        filters: {
          order: { type: 'text' },
          total: { type: 'number' },
          status: { type: 'enum', values: statuses },
        },
      })
      const and: Prisma.OrderWhereInput[] = []
      if (query.filters.order) and.push({ orderNumber: { contains: query.filters.order, mode: 'insensitive' } })
      if (query.filters.total) and.push({ totalMinor: Math.round(Number(query.filters.total) * 100) })
      if (query.filters.status) and.push({ status: query.filters.status as (typeof statuses)[number] })
      if (query.search) {
        const or: Prisma.OrderWhereInput[] = [
          { orderNumber: { contains: query.search, mode: 'insensitive' } },
        ]
        const normalizedStatus = query.search.toUpperCase()
        if (statuses.includes(normalizedStatus as (typeof statuses)[number]))
          or.push({ status: normalizedStatus as (typeof statuses)[number] })
        if (/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(query.search)) {
          const totalMinor = Math.round(Number(query.search) * 100)
          if (totalMinor <= 2_147_483_647) or.push({ totalMinor })
        }
        and.push({ OR: or })
      }
      const where: Prisma.OrderWhereInput = and.length ? { AND: and } : {}
      const orderBy: Prisma.OrderOrderByWithRelationInput = { [query.sortBy]: query.sortDirection }
      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          select: { id: true, orderNumber: true, totalMinor: true, status: true },
          orderBy: [orderBy, { id: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        db.order.count({ where }),
      ])
      return response.status(200).json({
        orders,
        pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
        requestId: id,
      })
    }
    if (request.method !== 'PATCH')
      return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Use GET or PATCH.', id)
    const body = bodyRecord(request)
    const rawOrderId = body.orderId
    const orderId = typeof rawOrderId === 'string' ? rawOrderId : ''
    const status = body.status
    if (
      !orderId ||
      typeof status !== 'string' ||
      !statuses.includes(status as (typeof statuses)[number])
    )
      return sendError(
        response,
        400,
        'VALIDATION_ERROR',
        'A valid order and status are required.',
        id,
      )
    const order = await updateOrderStatus(db, orderId, status as (typeof statuses)[number])
    return response.status(200).json({ order, requestId: id })
  } catch (error) {
    if (error instanceof AdminGridQueryError)
      return sendError(response, 400, 'VALIDATION_ERROR', 'Search, filters, sorting or pagination are invalid.', id)
    if (error instanceof OrderActionError)
      return sendError(response, error.status, error.code, error.message, id)
    if (isTransactionConflict(error))
      return sendError(response, 409, 'CONFLICT', 'Order changed. Refresh before trying again.', id)
    return sendError(
      response,
      503,
      'DATABASE_UNAVAILABLE',
      'Order management is temporarily unavailable.',
      id,
    )
  }
}
