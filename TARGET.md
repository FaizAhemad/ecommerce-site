# Implementation target and delivery order

Reviewed: 2026-09-12. Deliver the configurable commerce platform described in [REQUIREMENTS.md](REQUIREMENTS.md). This is a plan; [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) is the single completion checklist and [PROJECT_STATUS.md](PROJECT_STATUS.md) contains evidence.

## Current baseline

Vite/React/TypeScript UI, Node.js handlers consolidated behind one Vercel function, Prisma/PostgreSQL models/migrations, Blob uploads, Resend helpers and Razorpay handlers are present. Catalog/category reads, login, cart/wishlist mutations and product/review administration have implementations. The theme is light-only Ink and Citron (#28313b / #c7d866).

Backend existence is not end-to-end completion. Customer order pages use private records; E23 adds configured checkout/payment controls. Support tickets replace email links. Full settings/messages, provider acceptance and business content/localization remain incomplete. Shop consumes cursor pages. See [all pages](PAGE_INVENTORY.md).

## Delivery sequence

Follow the detailed findings and acceptance matrix in [ARCHITECTURE_UI_UX_AUDIT.md](ARCHITECTURE_UI_UX_AUDIT.md): secure account/data boundaries first, repair shared API action feedback, establish shared layout primitives, then migrate and verify every page. Keep the existing stack; no wholesale framework rewrite is required for this work.

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

The source formatting baseline is implemented (PROJECT_STATUS E10). Keep it enforced with npm run format:check while refactoring components, types and shared state in bounded changes. Existing React warnings and structural cleanup remain open alongside the security/UI roadmap.

Business configuration belongs in data/configuration, credentials in environment/infrastructure, commerce logic in reusable source. One deployment/business/database is the current model; complex multi-tenancy is not authorized by the white-label requirement alone.

Use consistent design-system components, responsive grid-only catalog, accessible controls and loading/empty/error states. Use API-backed progressive catalog loading, independent home sections, product detail URLs and business-provided media.

Mobile is the primary customer platform. Implement and verify phone layouts and touch/keyboard/slow-network interactions before tablet/desktop refinements, using the audit's mobile matrix. Prioritize responsive remediation as P1 after P0 security foundations. Include real Android Chrome/iOS Safari evidence where available; document missing-device verification.

Translate customer/admin UI and emails through i18n (English/Hindi/Marathi targets); review business/legal translations. Verify the approved light theme, responsive sizes, contrast, focus and layering. Dark mode remains deferred.

Payments, orders, refunds, returns, delivery, tracking, notifications and AI must use authoritative backend data. Do not claim actual refunds from DB status changes, successful payment from placeholders, or genuine reviews from generated examples.

Configuration/feature changes must support a second business without rewriting logic. Policies require approved versioned content and applicable consent tracking. Reliable notification processing needs retries and admin visibility without coupling provider outages to core commerce transactions.

## Decisions still required

Business operating jurisdiction/tax, approved policies/age/eligibility, product and medicine scope, shipping areas/charges/provider/GPS capability, payment/refund rules, AI/map/shipping integrations, incentive calculation/stacking and admin permissions remain decisions to confirm. Resend, Blob, Prisma and Razorpay code already exists; the remaining work is configuration, integration and verification, not selecting those technologies again by default.

For a missing decision, record its impact and the exact question in PROJECT_STATUS.md while continuing independent work. No roadmap item is complete until its specific acceptance criteria and relevant checks pass.

Update PAGE_INVENTORY.md for route/page changes and the relevant API/notification/operational docs in the same change.

Implementation update E11/E12: address ownership, account/session-scoped caches, guarded logout/stale responses, shared optimistic cart state, catalog/tracking/admin feedback and shared mobile PageContainer foundations are implemented with bounded regression evidence. The configured database has no pending migrations and live temporary-table rate-limit SQL passes. Local Vercel routing/module transport is repaired. These do not complete the remaining security, provider, Orders/Checkout/Support integration or real-device/browser acceptance requirements. PROJECT_STATUS.md supplies current evidence; APPLICATION_BACKLOG.md remains the only completion checklist. Playwright installation remains deferred.

E13 implements the inventory-integrity task: serializable order/cart/stock changes, conditional stock reservation, one-time customer/admin cancellation restock and protection against reopening closed orders through admin edits or late capture callbacks. No automatic retries or provider refunds are implied. Production concurrency/payment acceptance remains with the owner. Codex continues requirements/backlog implementation using offline checks and synchronized documentation, without .env inspection or live environment checks.

E14 implements central CSRF proof for current browser writes, including guest auth forms, with session-scoped in-memory tokens, source checks and a narrow signed-webhook exception. This is offline-verified scope, not production security certification. New page actions must use apiFetch; future handlers must preserve authorization and avoid state-changing GETs. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md); remaining requirements and owner acceptance stay in APPLICATION_BACKLOG.

E15 implements the offline-verified API error foundation: safe runtime dispatcher failures, structured error details, request correlation and compatible newsletter recovery without write replay. Existing success responses remain intact. Full localized errors, rendered/mobile/provider acceptance and protected operational diagnostics remain requirements tracked in APPLICATION_BACKLOG; see PROJECT_STATUS E15.

E16 implements email-based Forgot password and Reset password customer pages with neutral acknowledgment, matching new passwords, atomic one-time token use and revocation of existing owner sessions. Full profile/address, mobile-only recovery, verification UI, localization, delivery and security acceptance remain tracked in APPLICATION_BACKLOG. See PASSWORD_RECOVERY.md and PROJECT_STATUS E16; 108 offline tests do not establish provider/mobile production readiness.


E18 implements email verification and authenticated resend within the shared account form layout, preserving existing login eligibility. Full profile/address/email-change/mobile verification and production/provider/device acceptance remain in APPLICATION_BACKLOG. See EMAIL_VERIFICATION.md and PROJECT_STATUS E18.


E19 implements the common Profile page for customers/admins with name/login-phone and saved delivery-address management. Email remains read-only pending verified replacement; mobile verification/full localization and production/device acceptance remain in APPLICATION_BACKLOG. Existing admin store Settings is separate. See PROFILE_MANAGEMENT.md.


E20 implements customer Orders history only, with session-owned pagination and minimal stored order/item/payment status fields. E21/E23 subsequently add Order Details and configured Checkout; production/provider acceptance remains pending in APPLICATION_BACKLOG.


Owner scope (2026-09-14): Gadgify sells household gadgets in India, primarily Maharashtra, using INR; other Indian states can be served. Reuse for separate family/friend stores is future configurability, not approved marketplace scope. Legal policies/reward rates/AI provider and regulated products are undecided. Complete functionality continuously, updating tests/docs; visual polish follows. E21/E22 implement detail/checkout preview/support core; full payments, attachments and release acceptance remain pending.


E24 connects admin transactional messaging and private latest-100 history for verified customer recipients; remaining messaging work is durable retries, delivery events, deeper history and owner acceptance.


E25 replaces manual refund status changes with provider full-refund verification only. Initiation, partial refunds, approved eligibility, legacy data audit and live acceptance remain open.


E26 adds real admin return review; customer return creation, approved eligibility, audit/fulfillment and live acceptance remain open. Formatting is owner-managed from 2026-09-14; functional/security work and tests continue.


E27 Help and the explicit website tour are implemented offline; AI, localized help, device acceptance and remaining roadmap work continue.


E28 implements private first-purchase feedback with an unapplied migration. Public reviews, incentives and broader privacy/retention/device acceptance remain separate.
