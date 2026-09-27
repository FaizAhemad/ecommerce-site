# Application backlog

The current page and route inventory is maintained in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). Any page or route change must update that inventory and the relevant status documentation in the same change.

Completion status reviewed against current source and recorded evidence on 2026-09-21. This is the single completion checklist for product requirements, security gates and UI work. Other documents describe scope and evidence; they must not maintain competing completion lists.

Completion convention: `- [ ]` means pending, partial, blocked or awaiting required verification; `- [x] ✅` means the stated scope is implemented and verified, with evidence in [PROJECT_STATUS.md](PROJECT_STATUS.md). A code implementation or build alone does not complete a live integration. Preserve unverified work and business dependencies. Evidence IDs below refer to that status document.

## Current work: continuous functional backlog (E21 onward)

## First priority: multi-vendor marketplace (2026-09-22)

Owner prioritizes multiple shops selling through Gadgify. Detailed scope and unresolved decisions: [MARKETPLACE_REQUIREMENTS.md](MARKETPLACE_REQUIREMENTS.md).

Owner-requested tracking update (2026-09-23): checked entries explicitly labelled **Coding done** below acknowledge the implemented source scope only. This is an exception to the general verified-completion convention above, not a claim of passing tests, applied migrations, live email delivery or production readiness. Remaining functionality and acceptance are tracked separately. Evidence and limitations: PROJECT_STATUS.md.

- [x] ✅ MP-01a **Coding done:** shop/membership/product ownership and order-item snapshot models, access helpers and prepared migration/backfill. See MARKETPLACE_MIGRATION.md.
- [ ] MP-01b Apply/rehearse migrations, regenerate Prisma and verify historical data preservation and ownership isolation.
- [x] ✅ MP-02a **Coding done:** seller application/revision, admin approval/rejection/suspension/restoration, version guards and audit. See SELLER_ONBOARDING.md.
- [ ] MP-02b Verify onboarding, seller isolation and device/production behavior after migration.
- [x] ✅ MP-03a **Coding done:** seller product workspace, private uploads, storage inventory/previews and confirmed deletion of unreferenced media; saved/archived draft and catalog references are protected. See SELLER_WORKSPACE.md.
- [ ] MP-03b Larger media support and concurrency/security/device/production verification.
- [x] ✅ MP-04a **Coding done:** moderation/publication/withdrawal, shop showcase, seller identity, media checks, suspension/SEO filtering and server purchase eligibility. See MARKETPLACE_PURCHASING.md.
- [ ] MP-04b Enable external-shop purchasing only after approved commercial rules and migration/runtime acceptance; it remains disabled.
- [x] ✅ MP-05a **Coding done:** shop order grouping, scoped shipment updates, customer returns and seller/admin review, with prepared fulfillment migration. See SELLER_FULFILLMENT.md.
- [ ] MP-05b Mixed-shop checkout/allocation, cancellations/refunds and runtime/device acceptance. Platform mixed-order shipment/return handling is coded, unverified (2026-09-24).
- [x] ✅ MP-05c **Coding done:** shop dispatch/delivery and return approval/rejection/receipt email jobs with transactional enqueue and verified recipients; this does not extend legacy Gadgify return emails.
- [ ] MP-05d Verify shipment/return email regressions, worker operation and provider/device delivery acceptance.
- [ ] MP-06 Approved configurable fee rules and immutable item-level commission ledger.
- [ ] MP-07 Approved payment arrangement, earnings, payouts and settlement reconciliation.
- [x] ✅ MP-08a **Coding done:** order support conversations, escalation, admin resolution/audit and dispute email outbox with private staff routing and verified-customer notices.
- [ ] MP-08b Seller policies, worker operation, verified email delivery, direct inbound email forwarding setup and isolation/device/production acceptance.
- [ ] MP-09 Isolation/regression/migration/provider/mobile acceptance and controlled rollout.
- [x] ✅ MP-10a **Coding done:** optional admin-requested physical inspection per external-shop order, receipt/pass/fail, dispatch hold, return-to-shop/replacement records, private evidence photos, staff call notes, scoped shop views and seller email jobs. See QUALITY_INSPECTION.md; checked scope is source implementation only, as requested.
- [ ] MP-10b Decide mandatory inspection/central delivery, custody/transport costs, partial-item inspection and evidence retention; verify isolation, concurrency, migration prerequisites, email and phone/browser behavior before production acceptance.

- [ ] Session security: role-based idle/absolute expiry, legacy-session rejection, activity renewal and warning coded on 2026-09-22. No migration. Deferred checks and owner multi-tab/device/production acceptance remain pending; see SESSION_SECURITY.md.

## UI priority - numbered work (2026-09-22)

UI remains in scope but follows the newly prioritized marketplace work above. Preserve existing API/security behavior. All entries remain unchecked until their stated scope and deferred device/interaction checks are complete.

- [ ] UI-01 Styling organization and component-to-consumer inventory (including page-local controls): extracted App.css into ordered feature groups plus dedicated record-card/dialog styles; extraction preserved existing rule order. Tailwind v4 is now configured, and the Products catalog is the first Tailwind-first route; legacy app styling remains during incremental migration. Initial component inventory and shared button ownership consolidation added (2026-09-25); remaining pages, shared primitives and legacy override cleanup remain.
- [ ] UI-02 Visual foundation: shared spacing/radius tokens, readable controls, checkbox fixes and record cards implemented; shared button styling, font/control tokens and 16/24/32px page gutters consolidated (2026-09-25). Use the shared 4/8/12/16/24/32/48px spacing scale for consistent rhythm while preserving hierarchy; tour panel title/copy spacing now uses this scale. Fixed the global anchor color overriding foreground colors on primary/secondary CTA links (2026-09-26). Consolidated body, display, hard-coded legacy and Tailwind sans stacks onto one shared system sans family (2026-09-26); application-wide color, typography, card/field spacing and consumer verification remains. Shared header now uses responsive nav spacing, sentence-case 12px Log out, a proper magnifier and keyboard-usable search popover with Search/Close controls; focus outlines are slimmer with a restrained search-field treatment (2026-09-27). Visual and phone acceptance remain pending.
- [ ] UI-03 Shared dialog/drawer: native modal, focus restoration, inert background, scroll locking, pending dismissal guard and top-layer snackbar placement implemented; keyboard/mobile checks remain.
- [ ] UI-04 Admin: product/category and coupon editors, refund approval and customer-message composition moved into shared drawers; navigation is horizontally scrollable on small screens. Remaining admin forms/tables and all states need review.
- [ ] UI-05 Profile: personal details and address forms moved into drawers with record-card summaries. Deletion, keyboard, failed drafts and device review remain.
- [ ] UI-06 Catalog/product/reviews: homepage screenshot pass tightened mobile header/navigation and hero rhythm (2026-09-25); the Products route is the first Tailwind-first page, including its promo banner, desktop filter aside, mobile Radix Sheet, card/grid/filter/empty/loading states. Category matching now checks each category word case-insensitively to handle punctuation/spacing differences in free-text product categories; color matching is also case-insensitive. The filter title no longer inherits the oversized legacy global `h2` rule, and Clear filters keeps a compact label with a touch-sized target (2026-09-27). Home and Products share `ProductGrid` and `ProductCard`; the catalog uses normal CSS grid flow instead of absolute-position virtualization to keep scroll and end-of-list placement stable. Products now auto-fetches filtered cursor pages via an IntersectionObserver sentinel and retains loaded cards with a retry action after pagination errors (2026-09-27). The grid auto-fits 230px minimum tracks and cards cap at 260px. Cards reserve consistent compact slots for title/wishlist, seller, discount, rating and colors so cards and add actions align within each row; long titles clamp, current price is emphasized, and valid compare-at discounts render. Shared card cursors and title/price/discount typography hierarchy were refined 2026-09-26. Card cart actions now reflect shared cart quantities with remove/minus/plus controls and an animated count; per-product pending feedback distinguishes Adding, Removing and Updating without showing the add icon during pending work (2026-09-27); rendered/mobile acceptance remains pending. Reusable fractional `RatingStars` is shared by cards, detail summaries and reviews. Pagination feedback appears only during next-page requests and now uses a branded, reduced-motion-friendly status panel; background refreshes remain quiet. Product detail now has mouse-following 2.2× image magnification (replacing small competing hover scales), catalog-width Tailwind layout/gutters for gallery, ratings and review form, and a responsive title/price hierarchy and Tailwind review form/rating layouts and loading/error/empty review states (2026-09-27); failed-image fallback and exclusion from zoom/lightbox are implemented. Video thumbnails open in the lightbox without replacing the primary image, the duplicate short rule under Latest reviews was removed to align section dividers, and the summary explicitly shows 0.0 with 0 ratings / 0 reviews when empty; the pre-app product SEO fallback uses the shared storefront visual direction rather than browser-default text; rating-to-review sections have a matching divider and own-review editing now uses a labeled, 44px Tailwind secondary action (2026-09-27); source-only, interaction and mobile acceptance remain pending. Tailwind migration and rendered/mobile acceptance remain pending across Home/Wishlist and remaining detail/review components. Admin/seller price editing and validation plus the prepared schema migration are coded; apply migration, regenerate Prisma, verify rendered/mobile behavior and finish remaining catalog/review work. See [PRODUCT_PRICING.md](PRODUCT_PRICING.md).
- [ ] UI-07 Cart/checkout/orders: Gadgify checkout mobile addresses, reusable totals, frozen submission/retry state and persistent payment feedback coded (2026-09-25). Product card quantity controls use the shared cart cache and update mutation, keeping visible counts coordinated with the cart. Fixed server ESM import specifiers implicated in a production order-transaction module-resolution crash (2026-09-26); deployment/runtime acceptance and remaining cart/order UI review plus deferred keyboard/mobile/provider/regression checks remain pending.
- [ ] UI-08 Support/account/information pages: merge public Help guidance and the explicit website tour into a redesigned Support center; remove the separate `/help` route and primary navigation entry. Public Support uses the shared wide PageContainer and site gutters, matching Products. The explicit tour covers the main navigation routes available to the current role, with the arrow/outline on each active header control, destination-labeled Next/Previous controls, and no active underline competing with the spotlight. Guests skip authenticated-only routes; admin routes appear only for administrators. Rendered/mobile/keyboard acceptance remains pending. Review forms, conversations, recovery and policy readability; keep primary login/checkout flows as pages.
- [ ] UI-09 Navigation/loading/overlays and acceptance: After shared foundation work, address the reported startup loader and every loading/error/notification/overlay state using UI_UX_REVIEW_GUIDE.md. Audit every route/admin tab and component consumer on phone, tablet and desktop. Tests/lint/format and live checks remain deferred under owner instructions.

UI-09 source update: removed header geometry changes at the scroll threshold to address reported Support-page flicker. Stable sticky positioning and shadow-only scroll styling are implemented; rendered acceptance remains pending.

Owner requests continuous implementation without per-item permission pauses; visual polish review follows functionality. Confirmed business: Gadgify household products, India/INR, primarily Maharashtra. Rewards/policies/AI provider/medicines still need decisions.

## Coded, awaiting verification - E30/E31/E32

- [ ] E33 full-refund initiation/reconciliation: explicit admin approval, durable duplicate guard, provider checks and pending/failure UI are coded. See REFUND_OPERATIONS.md. Deferred checks and owner provider/mobile acceptance remain pending; partial refunds and scheduled reconciliation remain separate.

- [ ] E32 order notification retries: transactional jobs, bounded idempotent retries, admin processing and owner-run worker are coded. See NOTIFICATION_QUEUE.md. Verification, worker operations, other email flows and delivery events remain pending.

These entries are not untouched tasks: their stated implementation is present. The checkbox tracks verified completion, including the remaining scope written on each line. Earlier verified implementation scopes are ticked below; owner acceptance remains separate. This review did not rerun tests or establish production acceptance.

- [ ] E31 product SEO implementation is present: server product HTML metadata/structured data, active-product sitemap index/pages, robots responses, private-route headers and client navigation cleanup. `SEO_OPERATIONS.md` records configuration and checks. Tests and deployed crawler/preview/HMR acceptance remain pending; do not mark complete from source alone.

- [ ] Coupon management and checkout redemption are coded: admin draft/active/archive workflow, explicit tax treatment, server-calculated discounts, dates, minimums, caps, limits and transactional usage records. Checks, business approval, concurrency and production acceptance remain pending.
- [ ] Delivered-order return submission/status, admin shipment updates, tracking history and guarded order/shipment transitions are coded. Eligibility windows, carrier integration, collection, refund linkage and production acceptance remain pending.
- [ ] Recorded/dispatched/delivered email attempts use verified account email, milestone deduplication and admin accepted/unconfirmed history. Durable retry, delivery events, localization and provider acceptance remain pending.
- [ ] Private JPEG/PNG support attachments and paginated customer/admin conversations are coded. Migrations `20260920000000_support_attachments` and `20260920010000_support_replies` are prepared, not applied; scanning, documents, retention, reply emails and production acceptance remain pending.
- [ ] E30 route metadata foundation is coded and extended by E31 product metadata, structured data and sitemap/robots handlers above. Remaining work here is configured-origin, crawler/social-preview, navigation and deployment verification; do not reimplement those handlers as missing features.
- [ ] E30 verification is deferred by owner: no new test, lint, format, build, migration, browser, provider or production evidence is recorded. Keep E30 unchecked until its stated checks pass.

## Earlier verified implementation scopes - E21 to E28

- [x] ✅ E21 offline implementation: owned real Order Details, cart/address checkout preview, multi-rating and hex filters, safe route fallback, connectivity notices and footer placeholder removal. Checkpoint: 145 tests/build/types/format pass (PROJECT_STATUS E21/E22).
- [x] ✅ E22 offline implementation: support ticket creation/tracking/admin statuses, owned cancellation, idempotent request IDs and conditional Resend notifications, with prepared migration. See PROJECT_STATUS for bounded evidence.
- [ ] Owner applies support migrations/configures SUPPORT_EMAIL and validates support/customer receipt/privacy/device behavior. E30 image attachments and threaded replies are coded but unverified; durable retries and reply/status email notifications remain unimplemented.
- [ ] Complete remaining payment/refund scope and owner acceptance. E23 checkout and E25 reconciliation have bounded evidence below; E33 full-refund initiation is coded but unverified. Partial refunds, scheduled reconciliation and approved business rules remain open.
- [x] ✅ E23 bounded offline implementation: configured checkout quote/submission, atomic UUID retry protection, admin charge controls, customer Razorpay controls, strict capture matching and original-body webhook handling. 157 synthetic tests pass; see PROJECT_STATUS E23 and CHECKOUT_PAYMENTS.md.
- [ ] E23 owner acceptance: approve charges/policies, validate provider capture and Vercel raw webhooks, stock/retry concurrency and mobile behavior. Refunds, reconciliation jobs and remaining commerce rules are still pending.
- [x] ✅ E24 bounded offline implementation: connected admin message composition/history, verified-recipient validation, saved-before-send records and duplicate-ID protection. 161 synthetic tests pass; see PROJECT_STATUS E24.
- [ ] E24 owner acceptance: admin authorization, provider delivery/rejection, interrupted sends, account switching and phone form/history behavior. History beyond the latest 100 is now coded with cursor pagination (2026-09-24), unverified. Durable retries and delivery events remain incomplete.
- [x] ✅ E25 bounded offline refund integrity: replace manual refund status mutation with provider-backed full-refund reconciliation and reject manual REFUNDED edits through order/return controls. 164 synthetic tests pass; see PROJECT_STATUS E25.
- [ ] E25 owner acceptance and remaining refunds: verify provider full/partial/failed outcomes, audit legacy manually-refunded records, implement approved refund initiation/eligibility, partial refunds and durable audit/reconciliation. Verification does not issue refunds or establish bank settlement.
- [x] ✅ E26 bounded offline implementation: admin return history and guarded explicit review decisions, with owner/order consistency checks and no financial/stock effects. Fixed independent admin panel visibility; 169 tests pass (PROJECT_STATUS E26).
- [ ] E26 remaining return scope: E30 customer creation/status and manual shipment integration are coded but unverified. Approved eligibility/policy, full history/audit, collection/refund linkage and owner browser/device acceptance remain pending.
- [x] ✅ E27 bounded offline implementation: public Help page/navigation and explicit five-step route tour with previous/next/exit controls, without storage or API writes. 171 tests pass (PROJECT_STATUS E27).
- [ ] E27 owner keyboard/focus/phone acceptance and full English/Hindi/Marathi help/tour localization remain pending.
- [x] ✅ E28 bounded offline implementation: private first-purchase feedback in Orders/paid Details and admin Feedback, with owner-derived order, one-response constraint, retry reconciliation and quotas. 176 tests pass (PROJECT_STATUS E28).
- [ ] Owner applies purchase-feedback migration and validates eligibility, isolation, real concurrency and phone/provider-history behavior. Retention policy, editing, deeper history and localization remain pending.

## Previous task: customer order history (E20)

- [x] ✅ Connect Orders to private paginated customer history with minimal selected fields and loading/empty/error/retry states. 133 offline tests, types/build and formatting pass; evidence in PROJECT_STATUS E20.
- [ ] Owner production/mobile acceptance: own-account history, pagination, account switching, slow/error states and stored totals/status. E21/E23 subsequently implement Order Details and configured Checkout; their acceptance is tracked separately.

## Previous task: Profile page and saved addresses (E19)

- [x] ✅ Implement shared signed-in /profile for customers and admins, personal-details/password-confirmed phone updates, verification/recovery links and owned address create/edit/delete/default management. Nine new synthetic regressions pass; 129 total tests, offline build/types and formatting pass. See PROJECT_STATUS E19.
- [ ] Owner production acceptance: customer/admin profile, login phone changes, address mutations/defaults/order-reference conflicts, account isolation, 429/slow/offline failures and mobile keyboard/focus/layout. Email-address replacement, mobile verification and full localization remain separate work.

## Previous task: email verification (E18)

- [x] ✅ Implement verification page, account-email status, session-owned resend with IP/account quotas, secure signup links and duplicate/pending/error handling. All 120 offline tests and offline build/types pass; see PROJECT_STATUS E18 for scope.
- [ ] Owner production acceptance: signup and resend delivery, expired/used links, 429s, status refresh, existing login and Android/iOS interaction/accessibility. E19 common profile scope is verified separately; email changes, mobile verification and durable notifications remain pending.

## Previous task: password recovery and token claims (E16)

Owner: Codex for offline implementation; product owner for production/provider/device acceptance. Contract and acceptance scenarios: [PASSWORD_RECOVERY.md](PASSWORD_RECOVERY.md).

- [x] ✅ Implement Forgot password and Reset password pages, login entry, neutral email-request acknowledgment, one-time transactional reset/verification claims and reset-session revocation. Shared mobile form layout, failed drafts, duplicate guards and URL-token handling are implemented; all 108 offline tests, formatting and environment-disabled build pass with three existing lint warnings (PROJECT_STATUS E16).
- [ ] Product owner: verify delivery/opening of reset emails, new/old password login, revoked sessions, reused/expired links, simultaneous requests and Android/iOS recovery flows on production. Timing-enumeration resistance, recipient-level abuse controls and post-reset notification delivery remain security/notification work.

## Previous task: safe API errors (E15)

Owner: Codex for offline implementation and evidence; product owner for production acceptance.

- [x] ✅ Add safe dispatcher exception handling, malformed-path rejection, explicit route lookup and consistent error details; standardize newsletter/auth/method/health errors and preserve newsletter drafts and success responses. All 94 offline tests, formatting and environment-disabled build pass; three existing lint warnings remain (PROJECT_STATUS E15).
- [ ] Product owner: validate E15 on the deployed revision: existing success flows, newsletter error/confirmation feedback, safe unknown-route responses and matching error/request IDs. The Home newsletter now leaves an already-subscribed address editable and re-enables Submit after an edit (2026-09-27). Provider/browser/mobile acceptance remains pending; no deliberate production failures were triggered by Codex.

## Previous task: CSRF protection (E14)

Owner: Codex for offline implementation; product owner for production acceptance. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for the shared API contract and rollout.

- [x] ✅ Implement central CSRF bootstrap/token validation, session-scoped client handling and exact signed-webhook exception; 75 offline tests pass including existing regressions and E14 security cases. Evidence: PROJECT_STATUS E14.
- [ ] Product owner: validate E14 on production/preview hosts and mobile browsers, including login/logout, existing write flows, expired sessions, cross-tab behavior and provider callbacks. Deploy frontend/server together and refresh old tabs.

- [x] ✅ Owner reports CSRF working on the deployed application; supplied screenshot confirms X-CSRF-Token is attached to a same-origin request (E14 owner report, 2026-09-13). Broader rejection/device/provider acceptance above remains pending.

## Previous task: order inventory integrity (E13)

Owner: Codex for implementation and offline regression evidence; product owner for production validation. Scope: atomic stock reservation/cart consumption, one-time customer/admin cancellation restock, terminal-order protection and late-payment order-state guards. No new migration or provider refund implementation is included. Broader requirements remain in this backlog; validation tasks must not block unrelated implementation work.

- [x] ✅ Implement and test E13 order inventory integrity with serializable transactions, conditional updates and rollback; default suite now passes 56 tests. Offline client/API compilation and formatting pass; three pre-existing lint warnings remain.
- [ ] Product owner: validate E13 against production with controlled test orders, competing checkout/cancellation requests and delayed payment events. Real database concurrency and provider behavior are not established by the synthetic transaction tests.

## Release gates: security and resilience

- [ ] UI testing foundation: set up Playwright Test and @axe-core/playwright, preserve Node.js suites, and add route/state/mobile/validation/visual coverage per UI_UX_REVIEW_GUIDE.md. Setup/execution remain deferred; Vitest is optional later. Record browser, provider test-mode and real-device evidence separately.

These must be addressed before calling the application stable or production-ready:

- [ ] Complete the React Query server-state strategy across required page reads, private user-scoped cache keys, invalidation, stale data, optimistic rollback and deduplication. React Query is adopted for many reads; session/wishlist restoration remains guarded effects; E11 scopes private keys and shares header/cart reads, and E20-E23 integrate Orders/Order Details/Checkout reads with private scope. Earlier full-migration completion was overstated (E7).
- [ ] Complete and verify safe caching at API/client layers. Public/private headers and logout cache clearing exist; E11 adds private scoping, delayed-response guards and no-store errors; live account-switch/browser acceptance remains unverified (E7).
- [x] ✅ Prior production dependency-audit remediation: earlier recorded `npm audit --omit=dev` reported 0 vulnerabilities after aligning Prisma packages at 6.12.0 (historical evidence E6). A fresh release audit is tracked separately below.
- [ ] Complete user-input/rendered-content XSS review. HTTP(S) URL filtering and upload signature/MIME/base64/size checks exist. Current CSP is absent, including report-only mode; controlled CSP, external media, full content validation and live verification remain (E1, E7).
- [ ] Add authentication-aware rate limits to login, signup, password reset, review, upload, support, coupon, and admin endpoints. PostgreSQL counters and dispatcher policies are implemented for existing writes; E11 verifies migration status and live temporary-table SQL; production-host/browser checks and future support/coupon endpoints remain pending. See `RATE_LIMITING.md`.
- [ ] Handle too many requests with consistent `429` responses, retry guidance, request IDs, and snackbar/UI feedback. Structured 429s, typed client errors, translated snackbars and no automatic 429 retries are implemented and covered by automated tests; live browser acceptance remains pending.
- [ ] Perform a penetration test and document scope, findings, remediation, and retest evidence.
- [ ] Ensure customer data is scoped server-side to the authenticated customer or authorized admin. Do not share customer records through catalog, logs, browser storage, or broad API responses.
- [ ] Review the browser Network panel and production bundles for exposed secrets, private data, internal endpoints, and unnecessary responses.
- [x] ✅ Implement and test client/outbound-provider timeout wrappers: 30 seconds by default, with a 60-second long-running override and typed timeout errors (E1). This does not establish a database/function execution deadline.

Additional release checks:

- [ ] Re-run dependency/security checks against the release lockfile and record the result; historical audits do not certify a new release.
- [ ] Verify database/function execution budgets, client cancellation, retry/idempotency and ambiguous outcomes end to end.
- [ ] E11 verifies no pending migrations and passing live temporary-table SQL. Finish production-host/browser concurrency/429 recovery acceptance and schedule expired-counter cleanup.
- [ ] Complete API error localization and production recovery acceptance. E15 implements structured errors and safe dispatcher exception handling, including newsletter errors; offline scope is verified above. Full localized messages and live acceptance remain pending.
- [ ] Review CSRF protection, signup/verification/account enumeration, remaining ownership/CSRF and payment/webhook replay/state-transition gaps; E13 adds stock/cancellation concurrency guards with production acceptance still pending.
- [ ] Remediate and verify source-audit findings SEC-01 through SEC-06 in ARCHITECTURE_UI_UX_AUDIT.md against the security gates above; E11 repairs order-address validation, account/session scoping and error caching; retain full browser/customer-isolation and remaining security verification. These are detailed findings within the existing gates, not separate security completion claims.

## Product features

- [ ] Integrate the AI assistant with an approved provider, server-side secrets, moderation, usage limits, and auditability.
- [ ] Add a route tour/onboarding flow that is keyboard accessible and dismissible.
- [ ] Complete profile functionality: profile editing, password reset/change, address creation/update/delete/default selection, and validation.
- [ ] Add a help button and support entry points.
- [ ] Add a post-first-purchase feedback form to evaluate the customer experience.
- [ ] Add refer-a-friend incentives with abuse controls, attribution, eligibility, and reward status.
- [ ] Add cashback rules, ledger entries, balance display, eligibility, expiry, and reconciliation.
- [ ] Add admin coupon create/update/delete with active date range, usage limits, eligibility, and audit records.
- [ ] Add purchase-based discounts with explicit stacking and calculation rules.
- [ ] Add medicines only after confirming catalog, regulatory, prescription, fulfillment, privacy, and payment requirements.

## UI, routing, content, and operations

- [ ] P1 mobile-first: apply the shared layout/token/component standard in ARCHITECTURE_UI_UX_AUDIT.md across every route and admin tab. Most customers use phones; verify phone layouts first, then tablet/desktop. Include width variants, gutters/spacing, readable typography, touch targets, accessible mobile navigation/filters, keyboard/safe-area behavior, reduced motion and overlay clearance. Record real Android Chrome/iOS Safari and slow-network evidence or explicit device blockers using the documented matrix.
- [ ] Repair the audited action/read-state gaps (UX-01 through UX-08): shared header/page queries, cart quantity feedback and conflict locks, tracking pending/errors, admin load errors/upload progress, search debounce/cancellation, authentic content and no unused form fields. Preserve inputs and verify slow/error/duplicate-click behavior.

- [ ] Unknown routes such as `/admin/abc` should resolve to the relevant parent route (`/admin`) or a deliberate not-found route, consistently across client and server navigation.
- [ ] Replace the rating filter’s radio controls with checkboxes where multiple ratings can be selected.
- [ ] Show color filters as checkboxes with visible color swatches and hexadecimal values.
- [ ] Verify Orders navigation for authenticated users across responsive layouts. The link exists in SiteLayout; live acceptance pending.
- [ ] Verify and tighten Admin navigation visibility with a route back to the dashboard. E11 removes the current-route fallback; the link requires verified ADMIN role and content/API access remains separately guarded.
- [ ] Add and verify configured social links in header/footer/rail placements.
- [ ] Support messages must send through Resend to an environment-configured support address; never hard-code or expose the address in the client.
- [ ] When a support request is created, email the customer a confirmation that the ticket was received and will be handled promptly.
- [ ] Add a customer request page showing ticket status, resolution, cancellation, reasons, timestamps, and support responses.
- [ ] Update privacy, returns, refunds, terms, age language, and other policies for the actual ecommerce operation; obtain approved legal copy before publishing.
- [ ] Verify E11 session behavior in browsers: account/generation isolation, 401 expiry, awaited logout, BroadcastChannel invalidation and visibility recheck. Wishlist stays in memory; no customer payloads or credentials are persisted.
- [ ] Complete payment integration, server-side amount verification, webhooks, idempotency, failure states, refunds, and reconciliation.
- [ ] Remove hard-coded brand/product images and use configured or database-backed media with safe fallbacks.
- [ ] Review and replace unclear, placeholder, or inconsistent wording across the application.
- [ ] Remove the customer-care phone number until a real number is configured; do not show a placeholder number.
- [ ] Verify E11 compact product-detail loading indicator and stable layout on phones and assistive technology.
- [ ] Keep support submission in-app through the Resend API; do not open Outlook or another mail client. Support uploads must be validated and attached safely.
- [ ] Show an offline state immediately when connectivity is lost and a clear online notification when connectivity returns. Avoid losing unsaved form data.
- [ ] Add SEO metadata, canonical URLs, sitemap/robots behavior, structured product data, social previews, and crawl-safe route handling.

## Architecture and commerce requirements carried forward

- [ ] Complete structural code cleanup after the formatting baseline: focused page/domain components and hooks, typed API contracts instead of loose any, removal of duplicate/obsolete CSS and state, and resolution of existing React warnings with relevant regression evidence. Follow the security-first audit; do not combine behavior changes with broad mechanical rewrites.

These requirements from REQUIREMENTS.md and the original brief remain in scope alongside the product-owner list above:

- [ ] Complete database/admin-managed business identity, branding, contact, currency, locale, timezone, social/footer content, shipping and feature settings; verify a second-business deployment without source changes.
- [ ] Finish English/Hindi/Marathi localization across UI, validation, errors, emails, statuses and business content.
- [ ] Add API-configured independent home sections and complete catalog cursor loading, full facets and large-catalog performance verification.
- [ ] Fetch real Orders/Order Details data and use actual cart totals in Checkout; remove hardcoded delivered/paid dates and catalog-derived placeholder orders.
- [ ] Wishlist page deferred by user request: navigation is hidden and /wishlist redirects to /products. Reconsider the page later; before restoring it, render saved products outside the initial catalog and verify empty/error/account-switch states. Product heart actions remain available.
- [ ] Complete email/mobile-verification customer routes and profile/address workflows. E16 adds forgot/reset-password pages and atomic token claims; production password-recovery acceptance and mobile-only account recovery remain pending.
- [ ] Define verified-purchase/moderation eligibility. E11 removes generated fallback reviews; verify live customer review/error/empty states.
- [ ] Integrate actual provider refunds and complete configurable cancellation/returns/refund workflows, amounts, idempotency and auditability.
- [ ] Finish shipment/tracking integration and resolve the order-number versus internal-ID mismatch; add a configurable map/GPS provider only after confirmation.
- [ ] Connect admin Messages and Settings forms, complete customer/fulfillment/return operations and add real audit event persistence.
- [ ] Define appropriate admin permissions beyond the current CUSTOMER/ADMIN model.
- [ ] Implement durable localized transactional notification events, retries and admin failure visibility for the required account/order/payment/refund/delivery lifecycle.
- [ ] Add versioned localized policy/CMS storage, publication/approval and consent versions where applicable; provide missing cancellation/shipping/cookie pages as required.
- [ ] Verify shared design-system accessibility, keyboard/focus, light-theme contrast, responsive layout and overlay layering across all pages.
- [ ] Add end-to-end success/failure, authorization, provider, performance and release regression tests; E11 repairs/re-enables the legacy wishlist regressions; full end-to-end coverage remains pending.
- [ ] Establish CI, monitoring, backup/restore, migration, deployment and rollback procedures with evidence.

## Verified bounded milestones

These do not complete the broader release gates:

- [x] ✅ Order-address POST ownership validation, private cache generation guards, no-store errors and cart optimistic coordination pass synthetic regression tests; 38 tests in the default suite (E11). Live customer/browser acceptance remains pending.
- [x] ✅ Configured database migration status verified (three migrations, none pending) and live temporary-table rate-limit SQL checks pass after correcting environment initialization order (E11). This is point-in-time: subsequent .env edits removed DATABASE_URL and recovery verification is blocked until restored; it does not certify another database or production host.
- [x] ✅ Vercel local route/module/API transport regression repaired and verified on port 3100 (E12); production deployment and rendered browser checks remain pending.


- [x] ✅ Source formatting baseline and repeatable format/format:check workflow established with pinned Prettier and editor settings (E10). Formatting/debug checks, 20 tests and build/types pass; lint retains eight existing warnings. Structural refactoring remains pending.

- [x] ✅ Consolidated architecture/security/UI source audit and shared design standard recorded in ARCHITECTURE_UI_UX_AUDIT.md; Codex/Copilot workflow aligned (E9). Remediation and rendered/browser acceptance remain pending.

- [x] ✅ Existing login works on the user's deployment, as explicitly reported by the user (E4); new loader and rate-limit rollout remain separate.
- [x] ✅ Automated upload-validator regression scope passes for supported signatures, spoofed content, encoding/type mismatches and size boundaries (E1); live upload and broader XSS remain pending.
- [x] ✅ Documentation synchronized to the current source, page map and recorded evidence in this pass (E7, E8).

## Acceptance and documentation

Security increment: product and review upload validation now checks base64, declared/data-URL MIME agreement, decoded size, and supported signatures, with generated storage filenames. Automated tests pass; the XSS item stays pending until the remaining rendering, CSP, and live deployment checks are verified. See `PROJECT_STATUS.md` for scope and limitations.

Each item needs an owner/priority, implementation notes, API/data changes, security impact, and verification evidence. Update `PROJECT_STATUS.md`, `API_IMPLEMENTATION_PLAN.md`, and this file when scope changes. Keep the Codex (`AGENTS.md`, `CODEX_INSTRUCTIONS.md`) and Copilot (`.github/copilot-instructions.md`) instructions aligned with this backlog.


## Newsletter partial-success repair - E17

- [ ] Duplicate-subscription fix (2026-09-23): atomic creation/reactivation elects one provider sender; active subscribers receive 409 ALREADY_SUBSCRIBED with inline/snackbar error and disabled button. Regression cases updated; execution and owner production acceptance pending.

- [x] ✅ Saved-subscription confirmation failures reconcile to Subscribed with informational feedback and no replay; privacy-safe failure diagnostics and 111 offline tests verify the bounded behavior (PROJECT_STATUS E17).
- [x] ✅ Owner reports newsletter working on 2026-09-14 (PROJECT_STATUS E17 owner report). Exact provider configuration fix and independent delivery/device evidence were not supplied; this does not verify every notification flow.


## Policy publication - E29

- [x] ✅ Bounded offline E29: policy drafts/publication, version conflicts, immutable publication history/audit, published-only DTOs and additional policy routes. Prior verification: full 181-test pass plus expanded seven-case policy suite; see PROJECT_STATUS.
- [ ] Owner supplies approved policy/age text and validates publication/privacy/device behavior. Checkout consent, cookie consent, rollback/unpublish and legal/localization acceptance remain pending.

Current owner workflow (2026-09-15): defer format, lint and test commands until remaining implementation is finished. Newly added work stays unverified until the final checks; do not mark it completed just because code exists.
