# Seller workspace and shop showcase

Media cleanup update (2026-09-23): GET seller/media without an attachment id provides private usage metadata; DELETE removes only uploads with no saved draft or catalog references after scoped authorization, serializable reference checks and timestamp comparison. Archived references remain protected. UI previews fetch individual files on demand. Detach/save/review products before attempting cleanup; no forced deletion or provider storage mutation. Existing 100 uploads/shop and 1 MB/file limits remain; larger uploads are separate pending work. Source and regression cases are unverified.


Commercial workflow update 2026-10-02: shop applications collect a private business address and contact mobile. Product moderation now combines Gadgify content approval with a per-product fee proposal (fixed INR per unit sold or percentage of discounted item price); the shop accepts or declines the exact version. Exact acceptance is required for purchase eligibility. Fee terms are snapshotted to order items; automated payout/settlement is not implemented. The prepared commercial-offers migration and generated Prisma client are prerequisites.


Update 2026-09-23: shop fulfillment and return actions now have source implementation in SELLER_FULFILLMENT.md, superseding earlier read-only fulfillment descriptions below. Checkout/publication, financial allocation and production acceptance remain pending.


Source implemented 2026-09-23; all new tests/build/device/provider acceptance remain deferred. This is a connected catalog preparation/review flow, not a completed financial marketplace.

## Pages

| Route | Behavior |
| --- | --- |
| /seller | Own application and revision with business address/mobile; email verification is temporarily not required by owner direction |
| /seller/products | Approved-membership shop selection, paginated drafts, review, exact-version fee-offer acceptance/decline, and archive |
| /seller/orders | Paginated snapshot-attributed items only; no unrelated customer, address, provider or other-shop fields |
| /admin/sellers | Application review, suspension/restoration and audit |
| /admin/seller-products | Paginated content inspection, media preview, fee proposal and versioned product/offer decisions |
| /shops | Paginated approved non-platform shop directory |
| /shops/:slug | Approved-content showcase and explicitly requested media; private contact details are excluded |

Forms reuse shared drawers and width/spacing conventions with loading/error/empty/pending feedback. Failed writes preserve the open draft, cancellation uses account-generation guards, and saves are never replayed automatically. Customer login remains the entry point; membership grants access, not a platform seller role.

## Isolation and publication

Drafts live in reserved seller-product records, separate from Product and checkout. Seller reads are limited to approved shops/active membership. Mutation transactions recheck scope, expected version, category and shop-owned media. Editing approved content resets it to draft/pending and removes it from the showcase. Admin content approval creates a versioned commercial offer; seller acceptance records that exact version. Server checkout and the database order-item trigger require approved ownership, an approved shop and matching accepted offer version. Suspension removes the shop from new public requests and seller access. Already downloaded public content cannot be recalled.

Media is private database-backed validated base64 (JPEG, PNG, GIF, WebP, MP4 or WebM), max 1 MB per file, ten mixed image/video attachments per product, and 100 stored attachments per shop. The seller editor accepts additional file selections and permits removing queued files before upload. Admin inspection is authenticated; public media requires an approved shop, approved product and referenced media ID. Arbitrary third-party URLs are not accepted. File validation is not malware scanning. Larger-media/provider storage remains pending; capacity errors direct the seller to support. No raw media is placed in list responses or generic Settings.

Version checks and unique keys stop duplicate/stale mutations; interrupted requests require refresh/reconciliation. Draft audit keys include shop identity. Seller order visibility uses ShopOrderItem snapshots and current membership in the same query. Displayed status is explicitly the customer-order status, not an invented per-seller fulfillment state. No seller order mutation is available before MP-05 allocation/fulfillment design.

## Rollout and remaining gates

Apply/rehearse the MP-01 ownership migration, seller fulfillment migration and the prepared 20261002 commercial-offers migration; regenerate Prisma before deployment. Seller drafts remain separate from Product until Gadgify content approval. The new database trigger snapshots negotiated fees and rejects order lines whose seller offer was not accepted.

Fee offer basis is owner-defined: a fixed INR fee per unit sold or a percentage of the discounted item price, excluding delivery and tax. Coupon discounts are allocated deterministically across order items before percentage fee snapshots. Captured online orders and delivered COD orders make the fee snapshot due to Gadgify; pending/cancelled orders are not accrued and verified full refunds reverse the due snapshot. Fee collection from sellers, payout/settlement reconciliation, partial refunds and production financial acceptance remain unimplemented. Checkout also requires the owner's payment settings and all prepared migrations; do not represent source code as deployed.

Tests for bounded inputs, namespaces and publication invariants are authored but unexecuted; they do not establish real SQL isolation. Required final checks include real cross-shop access and concurrency, missing migration, approval/rejection/edit/suspension transitions, private/public media boundaries, file validation/capacity, mobile dialogs/keyboard, stale sessions, API failures and all existing commerce regressions.
