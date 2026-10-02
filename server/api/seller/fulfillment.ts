import { randomUUID } from 'node:crypto'
import { changeInspection } from '../_lib/inspection-records.js'
import { InspectionError, inspectionDto, inspectionHoldsDispatch, type Inspection } from '../_lib/shop-inspection.js'
import { enqueueShopOrderNotification } from '../_lib/shop-order-notifications.js'
import { enqueueDisputeNotifications } from '../_lib/dispute-notifications.js'
import { processNotification } from '../_lib/notification-queue.js'
import { DisputeError, disputeUpdate, publicDispute, type ShopDispute } from '../_lib/shop-disputes.js'
import { db } from '../_lib/db.js'
import { requireUser, requireAdmin } from '../_lib/auth.js'
import { FulfillmentError, fulfillmentTransition, returnTransition, usesScopedFulfillment, canManageScopedFulfillment } from '../_lib/seller-fulfillment.js'
import { bodyRecord, requestId, sendError, type VercelRequest, type VercelResponse } from '../_lib/http.js'
type Row = { id: string; orderId: string; shopId: string; shopName: string; orderNumber: string; status: string; carrier: string | null; trackingCode: string | null; version: number; createdAt: Date; orderStatus: string; paymentStatus: string | null; provider: string | null; shippingAddressId: string | null; currency: string; isPlatform: boolean; hasExternalShop: boolean }
type Return = { id: string; status: string; reason: string; resolution: string; version: number }
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
export function fulfillmentHandler(audience: 'seller' | 'admin' | 'customer') {
  return async (request: VercelRequest, response: VercelResponse) => {
    response.setHeader?.('Cache-Control', 'private, no-store, max-age=0')
    const user = await (audience === 'admin' ? requireAdmin : requireUser)(request, response), correlation = requestId(request)
    if (!user) return
    let notificationKeys: string[] = []
    try {
      if (!['GET','POST'].includes(request.method ?? '')) throw new FulfillmentError(405, 'Use GET or POST.')
      const body = bodyRecord(request), id = request.method === 'GET' ? request.query?.id : body.id
      if (id !== undefined && !identifier(id)) throw new FulfillmentError(400, 'Invalid seller order.')
      const page = request.query?.page ?? '0'
      if (typeof page !== 'string' || !/^\d{1,5}$/.test(page)) throw new FulfillmentError(400, 'Invalid page.')
      const result = await db.$transaction(async tx => {
        const rows = await tx.$queryRaw<Row[]>`
          SELECT so."id",so."orderId",so."shopId",so."shopName",so."status",so."carrier",so."trackingCode",so."version",so."createdAt",
            o."orderNumber",o."status"::text AS "orderStatus",o."currency",o."shippingAddressId",p."status"::text AS "paymentStatus",p."provider"::text AS "provider",s."isPlatform",
            EXISTS (SELECT 1 FROM "SellerOrder" sibling JOIN "Shop" sibling_shop ON sibling_shop."id"=sibling."shopId" WHERE sibling."orderId"=o."id" AND sibling_shop."isPlatform"=FALSE) AS "hasExternalShop"
          FROM "SellerOrder" so JOIN "Order" o ON o."id"=so."orderId" JOIN "Shop" s ON s."id"=so."shopId"
          LEFT JOIN "Payment" p ON p."orderId"=o."id"
          LEFT JOIN "ShopMembership" m ON m."shopId"=s."id" AND m."userId"=${user.id}
          WHERE (${audience === 'admin'} OR (${audience === 'customer'} AND o."userId"=${user.id}) OR
            (${audience === 'seller'} AND m."status"='ACTIVE' AND s."status"='APPROVED' AND s."isPlatform"=FALSE))
          AND (${id === undefined} OR so."id"=${id ?? ''})
          AND (${request.query?.supportOnly !== '1'} OR EXISTS (SELECT 1 FROM "StoreSetting" ds WHERE ds."key"='shop-dispute.' || so."id"))
          AND (${request.query?.inspectionOnly !== '1'} OR EXISTS (SELECT 1 FROM "StoreSetting" iq WHERE iq."key"='shop-inspection.' || so."id"))
          ORDER BY so."createdAt" DESC,so."id" ASC LIMIT 21 OFFSET ${id ? 0 : Number(page) * 20}
        `
        const selected = (row: Row) => ({ id: row.id, shopName: row.shopName, orderNumber: row.orderNumber, status: row.status, carrier: row.carrier, trackingCode: row.trackingCode, version: row.version, createdAt: row.createdAt, currency: row.currency, isPlatform: row.isPlatform, usesScopedFulfillment: usesScopedFulfillment(row) })
        if (!id) {
          if (request.method !== 'GET') throw new FulfillmentError(400, 'Select a seller order.')
          const disputes = await tx.storeSetting.findMany({ where: { key: { in: rows.slice(0,20).flatMap(row => [`shop-dispute.${row.id}`, `shop-inspection.${row.id}`]) } }, select: { key: true, value: true } })
          const statuses = new Map(disputes.map(row => [row.key, (JSON.parse(row.value) as ShopDispute).status]))
          return { orders: rows.slice(0,20).map(row => ({ ...selected(row), supportStatus: statuses.get(`shop-dispute.${row.id}`) ?? null, inspectionStatus: statuses.get(`shop-inspection.${row.id}`) ?? null })), nextPage: rows.length > 20 ? Number(page) + 1 : null }
        }
        const order = rows[0]
        if (!order) throw new FulfillmentError(404, 'Seller order unavailable.')
        const inspectionRow = await tx.storeSetting.findUnique({ where: { key: `shop-inspection.${order.id}` } })
        const inspection = inspectionRow ? JSON.parse(inspectionRow.value) as Inspection : null
        if (request.method === 'GET' && request.query?.inspectionPhoto !== undefined) {
          const photo = request.query.inspectionPhoto
          if (audience === 'customer' || typeof photo !== 'string' || !inspection?.photoIds.includes(photo)) throw new FulfillmentError(404, 'Inspection photo unavailable.')
          const media = await tx.storeSetting.findUnique({ where: { key: `inspection-media.${order.id}.${photo}` } })
          if (!media) throw new FulfillmentError(404, 'Inspection photo unavailable.')
          const value = JSON.parse(media.value) as { data: string; contentType: string }
          return { data: value.data, contentType: value.contentType }
        }
        if (request.method === 'POST' && typeof body.action === 'string' && body.action.startsWith('inspection-')) {
          if (audience !== 'admin') throw new FulfillmentError(403, 'Only Gadgify administrators can record quality inspections.')
          notificationKeys = await changeInspection(tx, order, body, user.id)
          return { saved: true }
        }
        const disputeKey = `shop-dispute.${order.id}`
        const disputeRow = await tx.storeSetting.findUnique({ where: { key: disputeKey } })
        const dispute = disputeRow ? JSON.parse(disputeRow.value) as ShopDispute : null
        if (request.method === 'POST' && typeof body.action === 'string' && body.action.startsWith('support-')) {
          const next = disputeUpdate(dispute, body, audience, user.id, new Date().toISOString())
          if (next === dispute) return { saved: true }
          if (disputeRow) {
            const changed = await tx.storeSetting.updateMany({ where: { key: disputeKey, value: disputeRow.value }, data: { value: JSON.stringify(next) } })
            if (changed.count !== 1) throw new FulfillmentError(409, 'Conversation changed. Refresh before retrying.')
          } else await tx.storeSetting.create({ data: { key: disputeKey, value: JSON.stringify(next) } })
          await tx.storeSetting.create({ data: { key: `audit.shop-dispute.${order.id}.${next.version}`, value: JSON.stringify({ action: 'shop-dispute.updated', actorId: user.id, resource: order.id, version: next.version, createdAt: new Date().toISOString() }) } })
          notificationKeys = await enqueueDisputeNotifications(tx, order.orderId, order.id, next)
          return { saved: true }
        }
        const returns = await tx.$queryRaw<Return[]>`SELECT "id","status","reason","resolution","version" FROM "SellerReturn" WHERE "sellerOrderId"=${order.id}`
        if (request.method === 'GET') {
          const items = await tx.$queryRaw<{ id: string; productName: string; quantity: number; unitPriceMinor: number; discountMinor: number; feeType: string | null; feeValue: number | null; offerVersion: number | null; feeBaseMinor: number; feeAmountMinor: number; feeStatus: string }[]>`
            SELECT oi."id",oi."productName",oi."quantity",oi."unitPriceMinor",oi."discountMinor",si."feeType",si."feeValue",si."offerVersion",si."feeBaseMinor",si."feeAmountMinor",si."feeStatus" FROM "OrderItem" oi JOIN "ShopOrderItem" si ON si."orderItemId"=oi."id"
            WHERE si."sellerOrderId"=${order.id} AND si."shopId"=${order.shopId} ORDER BY oi."id"
          `
          const events = await tx.$queryRaw<{ id: string; status: string; reason: string; createdAt: Date }[]>`SELECT "id","status","reason","createdAt" FROM "SellerOrderEvent" WHERE "sellerOrderId"=${order.id} ORDER BY "createdAt" DESC,"id" DESC LIMIT 50`
          const ready = !['PENDING','CANCELLED','REFUNDED'].includes(order.orderStatus) && (order.paymentStatus === 'CAPTURED' || order.provider === 'COD')
          const address = order.shippingAddressId && (audience !== 'seller' || (ready && ['PENDING','PACKING','SHIPPED'].includes(order.status))) ? await tx.address.findUnique({ where: { id: order.shippingAddressId }, select: { name: true, line1: true, line2: true, city: true, state: true, postalCode: true, country: true, phone: true } }) : null
          const visibleItems = audience === 'customer' ? items.map(({ feeType, feeValue, offerVersion, feeBaseMinor, feeAmountMinor, feeStatus, ...item }) => item) : items
          return { order: { ...selected(order), canFulfill: ready && canManageScopedFulfillment(order, audience) }, items: visibleItems, events, address, returnRequest: returns[0] ?? null, dispute: publicDispute(dispute), inspection: inspectionDto(inspection, audience) }
        }
        const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
        if (reason.length < 3 || reason.length > 1000) throw new FulfillmentError(400, 'Provide a reason of 3–1000 characters.')
        if (body.action === 'request-return') {
          if (!usesScopedFulfillment(order)) throw new FulfillmentError(409, 'Request Gadgify returns from the existing order details page.')
          if (audience !== 'customer' || order.status !== 'DELIVERED' || !identifier(body.requestId)) throw new FulfillmentError(409, 'Only the customer can request a return for delivered shop items.')
          if (returns[0]) {
            if (returns[0].id === body.requestId && returns[0].reason === reason) return { saved: true }
            throw new FulfillmentError(409, 'A return already exists for these shop items.')
          }
          if (await tx.returnRequest.findFirst({ where: { orderId: order.orderId }, select: { id: true } }))
            throw new FulfillmentError(409, 'This order already has a legacy return request. Contact support to continue that request.')
          await tx.$executeRaw`INSERT INTO "SellerReturn" ("id","sellerOrderId","reason") VALUES (${body.requestId},${order.id},${reason})`
        } else if (body.action === 'review-return') {
          const previous = returns[0]
          if (!previous || previous.version !== body.expectedVersion || !returnTransition(previous.status, body.status, audience === 'customer')) throw new FulfillmentError(409, 'Return changed or transition is unavailable. Refresh first.')
          const changed = await tx.$executeRaw`UPDATE "SellerReturn" SET "status"=${String(body.status)},"resolution"=${reason},"version"="version"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${previous.id} AND "version"=${previous.version}`
          if (changed !== 1) throw new FulfillmentError(409, 'Return changed. Refresh first.')
        } else if (body.action === 'fulfill') {
          if (body.status === 'SHIPPED' && inspectionHoldsDispatch(inspection)) throw new FulfillmentError(409, 'Customer dispatch is on hold until Gadgify records a passed inspection.')
          if (!canManageScopedFulfillment(order, audience)) throw new FulfillmentError(403, 'Gadgify shipments use the existing admin Shipments workflow.')
          if (body.expectedVersion !== order.version || !fulfillmentTransition(order.status, body.status)) throw new FulfillmentError(409, 'Shipment changed or transition is unavailable. Refresh first.')
          if (['PENDING','CANCELLED','REFUNDED'].includes(order.orderStatus) || (order.paymentStatus !== 'CAPTURED' && order.provider !== 'COD')) throw new FulfillmentError(409, 'Order is not eligible for fulfillment.')
          const carrier = typeof body.carrier === 'string' ? body.carrier.trim() : order.carrier ?? ''
          const tracking = typeof body.trackingCode === 'string' ? body.trackingCode.trim() : order.trackingCode ?? ''
          if (carrier.length > 100 || tracking.length > 150 || (body.status === 'SHIPPED' && (!carrier || !tracking))) throw new FulfillmentError(400, 'Dispatch requires a carrier and tracking reference.')
          const changed = await tx.$executeRaw`UPDATE "SellerOrder" SET "status"=${String(body.status)},"carrier"=${carrier || null},"trackingCode"=${tracking || null},"version"="version"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${order.id} AND "version"=${order.version}`
          if (changed !== 1) throw new FulfillmentError(409, 'Shipment changed. Refresh first.')
        } else throw new FulfillmentError(400, 'Select a supported action.')
        await tx.$executeRaw`INSERT INTO "SellerOrderEvent" ("id","sellerOrderId","status","reason","actorId") VALUES (${randomUUID()},${order.id},${body.action === 'request-return' ? 'RETURN_REQUESTED' : body.action === 'review-return' ? 'RETURN_' + String(body.status) : String(body.status)},${reason},${user.id})`
        notificationKeys = await enqueueShopOrderNotification(tx, {
          orderId: order.orderId, sellerOrderId: order.id, shopName: order.shopName,
          eventVersion: body.action === 'review-return' ? (returns[0]?.version ?? 0) + 1 : order.version + 1,
          action: body.action, status: body.status,
        })
        return { saved: true }
      }, { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 })
      // The durable conversation/outbox commit precedes all provider calls.
      if (notificationKeys.length) await Promise.allSettled(notificationKeys.slice(0, 2).map(key => processNotification(db, key, {
        apiKey: process.env.RESEND_API_KEY, from: process.env.RESEND_FROM_EMAIL, supportEmail: process.env.SUPPORT_EMAIL,
      })))
      return response.status(200).json(result)
    } catch (error) { const known = error instanceof FulfillmentError || error instanceof DisputeError || error instanceof InspectionError; return sendError(response, known ? error.status : 503, 'FULFILLMENT_UNAVAILABLE', known ? error.message : 'Unable to confirm fulfillment. Refresh before retrying.', correlation) }
  }
}
export default fulfillmentHandler('seller')
