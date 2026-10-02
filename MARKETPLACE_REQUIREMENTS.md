# Gadgify multi-vendor marketplace

Priority: first, approved by the owner on 2026-09-22. This supersedes the earlier separate-store-only scope and UI-first sequence. This document defines intended behavior, not implemented capabilities. APPLICATION_BACKLOG.md remains the only completion checklist; PROJECT_STATUS.md records evidence.

## Business intent

Quality inspection request (2026-09-24): Gadgify retains administrator oversight of every shop's catalog/orders. Listing approval remains separate from physical inspection. The owner is unsure about routing all goods through Gadgify; retain seller-managed delivery and implement optional per-order inspection first. An admin-requested inspection holds only that shop order's customer dispatch until received and passed. Failure supports return-to-shop/replacement records, private evidence, seller email and staff call notes. Mandatory inspection, central logistics, cost/liability and partial-item acceptance remain undecided. See QUALITY_INSPECTION.md and MP-10 in the single backlog.

2026-09-23 source update: connected workspace, moderation, shop showcase and seller-order-read pages are implemented as bounded preparation flows. See SELLER_WORKSPACE.md. Financial marketplace activation, independent fulfillment and payout pages remain pending business/provider decisions and implementation; no full-completion claim is made.

MP-02 application and review source is now present; see SELLER_ONBOARDING.md. This adds onboarding only, not product publishing or financial readiness. Migration and all newly deferred acceptance gates remain pending.

Implementation note: MP-01 models, access helpers and a migration are prepared in source; see MARKETPLACE_MIGRATION.md. Nothing has been migrated or enabled for sellers. Subsequent moderation/checkout gates are required before seller products can be offered.

Allow multiple independent shops to sell through the same Gadgify application. A shop is a seller/vendor; the buying account remains a customer. Gadgify operates the marketplace and is the customer payment merchant. On 2026-10-02 the owner approved per-product fee proposals: fixed INR per unit sold or a percentage of the discounted item price. Admin proposes actual values and the shop must accept the exact version before the product is orderable. No default amount or percentage is invented.

## Delivery order and scope

| Backlog ID | Scope | Required behavior |
| --- | --- | --- |
| MP-01 | Ownership and migration foundation | Model shops, seller membership, approval/suspension and product ownership. Explicitly map existing Gadgify products to the owner's shop without losing product URLs, stock, reviews or historical orders. Design migrations/backfill/rollback before application. |
| MP-02 | Seller onboarding | Application, shop/contact details, admin review and reasons for approval/rejection/suspension. Users cannot self-grant admin or seller access. Collect only necessary information; provider onboarding requirements remain pending. |
| MP-03 | Seller workspace | Mobile-friendly dashboard for the approved shop's products, media, prices and stock. Reuse shared layouts, forms/drawers and validation; never reuse unrestricted admin APIs for sellers. |
| MP-04 | Moderation and public storefront | Admin approval before publication, safe edit/re-review rules, visible seller identity on products, shop product browsing and suspension handling. Existing moderation and publication eligibility must also be checked at checkout. |
| MP-05 | Orders and fulfillment | Preserve customer order history while grouping items by shop. Sellers see only their own fulfillment items and the minimum delivery/customer information necessary. Define independent shipment, cancellation and return states. |
| MP-06 | Fees and ledger | Versioned approved fee rules, server-side calculation and immutable per-order-item snapshots. Record currency, basis, rounding, discounts, taxes and refund adjustments explicitly; never recalculate historical fees using current settings. |
| MP-07 | Payments and settlements | Select/approve the marketplace payment arrangement; track pending/available/paid earnings, adjustments and provider reconciliation. No payout or settlement success without matching provider evidence. |
| MP-08 | Seller operations and disputes | Seller-specific returns/support routing, audit trail, admin oversight, disputes and approved seller policies. Financial responsibility and customer communication rules must be decided. |
| MP-09 | Acceptance and rollout | Cross-shop/customer isolation, regression of existing commerce, migration rehearsal, provider acceptance and phone/tablet/desktop verification before enabling marketplace sales. |

## Security and compatibility requirements

Derive shop access from authenticated, approved membership on every seller request. Never trust a submitted shop ID, role or client filter as authorization. Scope queries, media access, exports, caches and mutations to the permitted shop; sellers cannot see another shop's records or unrelated customer data. Suspension must prevent new seller mutations and sales while retaining admin/customer access to historical records.

Keep platform administrators distinct from seller permissions. Preserve existing sessions, CSRF, rate limits, request budgets, private query generation guards, upload validation and safe errors. Use the sole Vercel dispatcher and focused server modules. Financial writes require durable duplicate protection, transaction boundaries and reconciliation; never optimistic success or automatic payment replay.

Do not assume the existing single-store payment/refund flow is marketplace-ready. Preserve current single-store behavior until new ownership, mixed-shop totals, partial fulfillment/refund allocation and provider contracts are verified. Historical orders must remain readable without depending on mutable seller data. Public shop pages expose approved public fields only, never private contact/banking/provider records.

## Decisions still required

| Decision | Current status |
| --- | --- |
| Per-product fee basis | Owner approved fixed INR per unit sold or percent of discounted item price; amount/rate negotiated by product and accepted by seller |
| Fee rate/amount | Admin enters each proposal; no default is applied |
| Discount basis | Percentage uses discounted item price; delivery and tax excluded. Coupon discount allocation is deterministic. |
| Customer payment collection | Gadgify receives customer payment through existing checkout; enabled only after owner configures checkout and applies prepared migrations |
| Settlement schedule, holds, refunds, disputes and seller payments | Manual/unimplemented; settlement schedule and legal terms remain undecided |
| Delivery responsibility | Confirmed: each shop handles its own delivery/returns; Gadgify handles its own products and retains oversight |
| Mixed-shop delivery charges, cancellation/refund allocation and return eligibility | Undecided; new fulfillment pages do not enable financial rules |
| Seller agreement, privacy disclosures, invoicing and legal requirements | Requires approved content and appropriate review |
| Seller staff access and number of shops per account | Decide before expanding membership permissions |
| Medicines and other regulated categories | Still subject to separate approval; marketplace scope does not enable them |

Implement independent ownership/onboarding foundations first while these decisions remain pending. No environment inspection, migration execution, deployment, real charge or payout is authorized by this documentation change. Existing owner deferrals for tests/lint/format and live validation remain in effect; new work stays unverified until the final checkpoint.
