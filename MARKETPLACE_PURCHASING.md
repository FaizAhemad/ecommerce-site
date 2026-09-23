# Seller catalog publication and purchase safeguards

2026-09-23 source implementation. This extends SELLER_WORKSPACE.md; it does not certify migration, deployment or marketplace payment readiness.

Admin approval publishes a shop-namespaced Product, media references and approved ownership in the same serializable transaction as moderation. Seller edits/archive withdraw its catalog listing immediately in that transaction. Product identity, historical references and stock reservations are preserved across reapproval; explicit draft stock adjustments apply as a delta from the previous publication. Legacy admin product editing cannot bypass seller moderation.

Catalog/detail responses expose selected seller identity and purchase availability. Product cards/details display the seller and explain unavailable purchasing. Shop showcases link to published product details and show INR prices. Existing approved drafts require resubmission/reapproval to create their catalog projection; there is no automatic bulk publication.

Product list/detail and sitemap/SEO require approved ownership and approved shops. Product APIs use no-store responses. Media is served through the existing shops dispatcher route only after current shop approval, draft approval and attachment membership checks; bounded signature validation and nosniff apply. The binary media response avoids embedding megabytes of base64 in catalog DTOs. Previously downloaded public content cannot be revoked.

Cart additions, checkout quotes and order creation enforce server purchase eligibility. Order creation checks it inside the stock-reservation transaction, including the legacy COD path. Missing ownership, moderation removal and suspension fail closed. Unavailable items can still be removed from carts/wishlists. Client availability is informational, never authorization.

**External-shop purchasing remains disabled.** Content approval cannot authorize collecting money on a seller's behalf. No default commission, delivery charge, settlement arrangement or partial-refund policy has been invented. Existing Gadgify checkout remains the permitted path. SellerOrder snapshot grouping from the prepared fulfillment migration is retained, but mixed-shop payment/checkout is not complete or enabled.

## Owner decisions and rollout prerequisites

Approve delivery charges per shop, who collects payments, commission basis/rate, provider marketplace arrangement and cancellation/refund allocation before implementing/enabling seller financial checkout. Resolve platform-item fulfillment in mixed orders at the same time.

This code now requires both prepared marketplace migrations and freshly generated Prisma types before rollout. **Deploying it against an unmigrated database will make affected catalog/cart/checkout routes unavailable.** Rehearse backups/backfill, historical ownership and compatibility triggers first. The owner applies migrations and deploys; none were executed here. No new environment variable or provider setup is introduced by this change.

Tests authored for purchase eligibility, privacy, namespace separation, unavailable SEO offers and order rollback. Existing transaction fixtures now include platform ownership. API no-emit TypeScript configuration accepts explicit .ts imports so native Node regression imports resolve the shared policy. Test/lint/build/format execution remains deferred by the owner. Browser/mobile/auth isolation, Prisma generation, migration, Vercel media transport and production checks remain pending.
