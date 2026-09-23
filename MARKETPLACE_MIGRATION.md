# Marketplace ownership foundation (MP-01)

Publication prerequisite: catalog/cart/checkout now query ownership relations, so both prepared marketplace migrations and Prisma generation must precede rollout. An unmigrated deployment will fail closed. Existing approved drafts need reapproval to publish; no bulk publication performed. See MARKETPLACE_PURCHASING.md.


Second prepared migration: 20260923000000_seller_fulfillment follows the foundation, backfills SellerOrder, replaces the snapshot trigger and adds legacy shipment/return/cancellation guards. Not applied or rehearsed. Recovery must consider dependent triggers and persisted seller records; see SELLER_FULFILLMENT.md.


Prepared migration: `20260922000000_marketplace_foundation`. Not applied, generated or verified by the agent. No seller endpoint or UI is enabled in this step.

## Data model

Shop approval is independent from platform User.role. ShopMembership grants active access to an approved non-platform shop; no memberships are granted automatically and no SELLER platform role is added. This phase models membership only, without inventing staff permission levels. ShopProduct is a one-product/one-shop ownership relation with moderation state. ShopOrderItem stores shop ID and name separately from mutable product/shop names for historical fulfillment attribution; it is not a commission or payout ledger.

Additive relation tables preserve existing product IDs, URLs, stock, reviews, payments and order amounts. Current products and order items backfill to `gadgify-platform`, Gadgify's platform-owned shop. Platform administrators retain existing access. Seller helper queries fail closed, parameterize identity/shop/product and check approval/membership in the same read. Future writes must perform the same checks inside their transaction; a prior read helper is not sufficient authorization for a later write.

## Compatibility and sequencing

Existing admin product inserts are assigned to Gadgify by an AFTER INSERT trigger. New order items get a seller-name snapshot from ownership. No runtime query of existing pages depends on the new tables before migration. Future seller product creation must start inactive and replace the default platform mapping transactionally before it can leave draft. Do not enable seller inserts until MP-03/MP-04 add server publication and checkout ownership gates. Current public/checkout queries are still single-store and do not enforce shop suspension; this migration alone does not make marketplace sales safe.

Prisma relations mirror the tables. Database CHECK constraints, partial unique platform-shop index and triggers are migration-owned. Regenerating a diff must preserve them. The helpers use parameterized SQL to avoid a runtime dependency on newly generated Prisma delegates before owner rollout.

## Owner rollout and recovery

Before application, back up and rehearse against a disposable database copy. Confirm current records all belong to Gadgify; stop if externally owned catalog data already exists. Pause product/order writes during application. The migration explicitly wraps creation/backfill/triggers in a transaction and locks Product/OrderItem against concurrent writes; plan for lock duration and database permissions.

Verify product/order-item counts match their new ownership/snapshot tables, every existing mapping uses the platform shop, no membership was automatically granted, and existing product URLs/order totals still match. Exercise a platform product insert and order creation, then rollback the synthetic transaction. Separately verify cross-shop, suspended/revoked/missing membership access and historical snapshots after renaming products/shops. No live verification was performed here.

Before any external seller data exists, application rollback can retain the additive tables/triggers while restoring prior code. If database rollback is necessary, first pause writes, take a backup/export, verify only platform mappings exist, drop the two triggers/functions, then the three dependent relation tables and Shop, and reconcile Prisma migration history deliberately. No destructive rollback script is provided. Once real seller data exists, do not drop ownership or snapshots; use a forward repair/migration.

Deferred checkpoint: `tests/shop-access.test.mjs`, Prisma validation/generation with owner's approved environment workflow, full existing commerce regressions, migration rehearsal and owner acceptance. This foundation is not marked complete until those checks pass.
