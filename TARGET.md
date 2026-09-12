# Implementation target and delivery order

Reviewed: 2026-09-12. Deliver the configurable commerce platform described in [REQUIREMENTS.md](REQUIREMENTS.md). This is a plan; [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) is the single completion checklist and [PROJECT_STATUS.md](PROJECT_STATUS.md) contains evidence.

## Current baseline

Vite/React/TypeScript UI, Node.js handlers consolidated behind one Vercel function, Prisma/PostgreSQL models/migrations, Blob uploads, Resend helpers and Razorpay handlers are present. Catalog/category reads, login, cart/wishlist mutations and product/review administration have implementations. The theme is light-only Ink and Citron (#28313b / #c7d866).

Backend existence is not end-to-end completion. Customer order/checkout pages remain placeholders, Support opens email/phone links, settings/messages are incomplete, API cursor pagination is not consumed by the shop, and much business content/localization remains hardcoded. See [all pages](PAGE_INVENTORY.md).

## Delivery sequence

| Priority | Work | Acceptance before calling it complete |
| --- | --- | --- |
| P0 — security rollout | Rate-limit migration, database test, controlled deployment, authentication/refresh, 429/recovery | Working counter storage, normal writes preserved, exceeded limits recover, live evidence recorded |
| P0 — security review | XSS/CSP, upload safety, customer isolation, cache/session/storage, dependency/network review, penetration test | Scope, findings, fixes and retest evidence; no blanket readiness claim from builds |
| P1 — truthful commerce | Orders/detail/checkout integration, pagination, tracking ID contract; wishlist page deferred by user request | Real account-scoped data, no fabricated order/review claims, full catalog navigation; /wishlist redirects to Products while product hearts remain available |
| P1 — payments and operations | Amount/stock/address checks, provider verification/webhooks/idempotency, cancellation/returns/refunds | Verified server calculations and actual provider outcomes, including failure/replay cases |
| P1 — customer support/account | Profiles, addresses, reset/verification UI, help, Resend tickets/attachments/receipt and request tracking | Owner-scoped records, email delivery and recovery verified |
| P2 — administration/configuration | CMS identity/branding/contact/locales/shipping/features, policy versions/consent, roles/audit, messages/settings | Appropriate non-secret changes work without source edits; audit and authorization verified |
| P2 — notifications and UX | Durable localized transactional events, navigation/filter/loading/footer/offline/SEO/accessibility | Consistent UI, retry/recovery, no fake contacts/links or false provider promises |
| P3 — business roadmap | AI/tour/feedback/referrals/cashback/coupons/purchase discounts; medicines if approved | Eligibility, provider/data contracts, abuse prevention and acceptance tests defined and verified |
| Release | End-to-end regression, performance, deployment/monitoring/backup/rollback, second-business configuration test | All release gates and required business decisions resolved |

Review the backlog after each bounded implementation. Keep every requirement in scope, but do not invent missing legal, financial or provider decisions to meet a date.

## Architecture and acceptance

Business configuration belongs in data/configuration, credentials in environment/infrastructure, commerce logic in reusable source. One deployment/business/database is the current model; complex multi-tenancy is not authorized by the white-label requirement alone.

Use consistent design-system components, responsive grid-only catalog, accessible controls and loading/empty/error states. Use API-backed progressive catalog loading, independent home sections, product detail URLs and business-provided media.

Translate customer/admin UI and emails through i18n (English/Hindi/Marathi targets); review business/legal translations. Verify the approved light theme, responsive sizes, contrast, focus and layering. Dark mode remains deferred.

Payments, orders, refunds, returns, delivery, tracking, notifications and AI must use authoritative backend data. Do not claim actual refunds from DB status changes, successful payment from placeholders, or genuine reviews from generated examples.

Configuration/feature changes must support a second business without rewriting logic. Policies require approved versioned content and applicable consent tracking. Reliable notification processing needs retries and admin visibility without coupling provider outages to core commerce transactions.

## Decisions still required

Business operating jurisdiction/tax, approved policies/age/eligibility, product and medicine scope, shipping areas/charges/provider/GPS capability, payment/refund rules, AI/map/shipping integrations, incentive calculation/stacking and admin permissions remain decisions to confirm. Resend, Blob, Prisma and Razorpay code already exists; the remaining work is configuration, integration and verification, not selecting those technologies again by default.

For a missing decision, record its impact and the exact question in PROJECT_STATUS.md while continuing independent work. No roadmap item is complete until its specific acceptance criteria and relevant checks pass.

Update PAGE_INVENTORY.md for route/page changes and the relevant API/notification/operational docs in the same change.
