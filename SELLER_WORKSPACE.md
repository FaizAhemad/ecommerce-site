# Seller workspace and shop showcase

Media cleanup update (2026-09-23): GET seller/media without an attachment id provides private usage metadata; DELETE removes only uploads with no saved draft or catalog references after scoped authorization, serializable reference checks and timestamp comparison. Archived references remain protected. UI previews fetch individual files on demand. Detach/save/review products before attempting cleanup; no forced deletion or provider storage mutation. Existing 100 uploads/shop and 1 MB/file limits remain; larger uploads are separate pending work. Source and regression cases are unverified.


Publication update 2026-09-23 supersedes the draft-only Product claims below: approval now projects shop-owned catalog products; editing/archive withdraws visibility. External-shop ordering remains disabled. Read MARKETPLACE_PURCHASING.md for required schema rollout and acceptance.


Update 2026-09-23: shop fulfillment and return actions now have source implementation in SELLER_FULFILLMENT.md, superseding earlier read-only fulfillment descriptions below. Checkout/publication, financial allocation and production acceptance remain pending.


Source implemented 2026-09-23; all new tests/build/device/provider acceptance remain deferred. This is a connected catalog preparation/review flow, not a completed financial marketplace.

## Pages

| Route | Behavior |
| --- | --- |
| /seller | Own application and revision; verified-email submission |
| /seller/products | Approved-membership shop selection, paginated drafts, price/stock/category editing, private media, review submission and archive |
| /seller/orders | Paginated snapshot-attributed items only; no unrelated customer, address, provider or other-shop fields |
| /admin/sellers | Application review, suspension/restoration and audit |
| /admin/seller-products | Paginated content inspection, media preview and versioned approve/reject decisions |
| /shops | Paginated approved non-platform shop directory |
| /shops/:slug | Approved-content showcase and explicitly requested media; no purchasing or prices/settlement claims |

Forms reuse shared drawers and width/spacing conventions with loading/error/empty/pending feedback. Failed writes preserve the open draft, cancellation uses account-generation guards, and saves are never replayed automatically. Customer login remains the entry point; membership grants access, not a platform seller role.

## Isolation and publication

Drafts live in reserved seller-product records, separate from Product and checkout. Seller reads are limited to approved shops/active membership. Mutation transactions recheck scope, expected version, category and shop-owned media. Editing approved content resets it to draft/pending and removes it from the showcase. Moderation approval requires an approved shop and records an audit reason; it authorizes public showcase content/attachments, not sales. Suspension removes the shop from new public requests and seller access. Already downloaded public content cannot be recalled.

Media is private database-backed validated base64 (existing supported image/video formats), max 1 MB per file, three attachments per draft and 100 stored attachments per shop. Admin inspection is authenticated; public media requires an approved shop, approved product and referenced media ID. Arbitrary third-party URLs are not accepted. File validation is not malware scanning. Retention/orphan cleanup and larger-media/provider storage remain pending; capacity errors direct the seller to support. No raw media is placed in list responses or generic Settings.

Version checks and unique keys stop duplicate/stale mutations; interrupted requests require refresh/reconciliation. Draft audit keys include shop identity. Seller order visibility uses ShopOrderItem snapshots and current membership in the same query. Displayed status is explicitly the customer-order status, not an invented per-seller fulfillment state. No seller order mutation is available before MP-05 allocation/fulfillment design.

## Rollout and remaining gates

Apply/rehearse the MP-01 ownership migration as documented in MARKETPLACE_MIGRATION.md before seller access/review. No new migration beyond MP-01 is introduced here. Drafts deliberately do not use Product or the platform-product trigger, preventing accidental live publication. The earlier plan to replace trigger-created mappings applies only to a future verified publication implementation.

Marketplace checkout, independently fulfilled seller orders, returns/refund allocation, commission ledger, earnings/payout pages and provider settlement are not implemented. They require agreed fee basis/rates, delivery responsibilities, commercial terms and provider arrangement. They must not be marked completed or hidden behind fake totals/buttons. Existing Gadgify single-store commerce remains separate.

Tests for bounded inputs, namespaces and publication invariants are authored but unexecuted; they do not establish real SQL isolation. Required final checks include real cross-shop access and concurrency, missing migration, approval/rejection/edit/suspension transitions, private/public media boundaries, file validation/capacity, mobile dialogs/keyboard, stale sessions, API failures and all existing commerce regressions.
