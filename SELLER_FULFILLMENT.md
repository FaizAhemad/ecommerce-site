# Shop fulfillment and returns

2026-09-24 mixed platform extension: Gadgify groups in mixed orders now use scoped admin shipments and owned customer returns. Platform-only orders retain legacy workflows. The server derives this distinction from stored groups, never client input. External-shop sales, allocation and financial rules remain gated; source/regression cases unverified.

Quality inspection extension (2026-09-24): optional admin-requested inspection holds external-shop customer dispatch until PASSED. Receipt/pass/fail, return/replacement records, private photos and seller notifications are coded. This is separate from listing moderation and does not imply refunds, stock movements or booked transport. Current seller-managed delivery remains; universal/central inspection is undecided. See QUALITY_INSPECTION.md.


2026-09-24 update: scoped shipment and return decisions now enqueue verified-customer notices in the transaction and attempt sending after commit. Provider failures cannot roll back a saved shipment/return decision. Email identifies the shop/order and directs the customer to current authenticated details; it does not confirm refunds or settlement. Legacy Gadgify return actions are unchanged. Tests and delivery remain unverified.


Source implementation, 2026-09-23. Unverified; this is not a production completion claim.

The owner confirmed that each shop handles its own deliveries and returns. Gadgify handles its products and retains administrator oversight. Rates, settlement arrangements, mixed-shop shipping charges and financial refund allocation remain undecided.

## Implementation

SellerOrder groups immutable shop-item ownership beneath the existing customer Order. Each shop has its own shipment status, version and update history. SellerReturn records a shop-specific request, decision and receipt; it does not issue refunds or replenish stock.

Routes: `/seller/orders`, `/admin/fulfillment`, `/orders/shipments`. They share drawer-based detail/actions, private query keys, pending locks, abort/generation guards and preserved failed drafts. Customer Orders and seller/admin navigation link to them.

GET/POST APIs: `/api/seller/fulfillment`, `/api/admin/fulfillment`, `/api/orders/fulfillment`, all behind the existing dispatcher, authentication, CSRF and rate limits. Server-derived audience and membership scope determine access. Sellers require active membership in an approved non-platform shop. Customer access requires order ownership; administration requires admin authentication. Only selected fields are returned. Sellers receive the delivery address only for eligible active fulfillment; actor IDs and other shops' items remain private.

Shipment progression is PENDING → PACKING → SHIPPED → DELIVERED. Dispatch requires carrier and tracking reference. Parent payment/order eligibility is checked in a serializable transaction; conditional version writes prevent stale changes. Customer return requests require delivered items; shops/admins approve or reject, then confirm receipt. Customers can cancel a pending request. No write is automatically replayed.

## Compatibility and rollout

Prepared migration `20260923000000_seller_fulfillment` follows `20260922000000_marketplace_foundation`. Neither is applied by this work. It backfills groups, replaces the order-item snapshot trigger and mirrors legacy Gadgify shipments. Gadgify shipment and return actions retain the existing admin/customer workflows. Legacy whole-order shipment/return writes are rejected for external-shop orders; cancellation after fulfillment starts is rejected. New APIs fail safely if schema prerequisites are missing.

Before owner rollout, rehearse both migrations on a backup, compare historical order/item ownership and shipment counts, regenerate Prisma, and verify old/new workflows together. Reverting only application code does not remove triggers: database recovery must account for both migrations and existing seller records. Do not drop populated seller tables as an ad hoc rollback.

## Remaining scope and evidence

Transition regression cases are authored but not executed. Tests, lint, build, migration, authenticated browser, concurrency and mobile checks remain deferred under owner instructions. Source review is not runtime evidence. Verify isolation, session changes, lost responses, competing updates, cancellation races, historical returns and private address visibility at the final checkpoint.

Marketplace checkout/publication, mixed-shop charge allocation, shop cancellation/refund allocation, return eligibility policies, notifications and payouts are not enabled by these pages. Platform items within future mixed orders have a scoped fulfillment/return extension in source; acceptance remains pending before mixed sales can be enabled. Existing Gadgify-only commerce remains the intended live path. MP-05 stays pending in APPLICATION_BACKLOG.md.
