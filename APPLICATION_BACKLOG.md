# Application backlog

The current page and route inventory is maintained in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). Any page or route change must update that inventory and the relevant status documentation in the same change.

Reviewed against the current workspace on 2026-09-13. This is the single completion checklist for product requirements, security gates and UI work. Other documents describe scope and evidence; they must not maintain competing completion lists.

Completion convention: `- [ ]` means pending, partial, blocked or awaiting required verification; `- [x] ✅` means the stated scope is implemented and verified, with evidence in [PROJECT_STATUS.md](PROJECT_STATUS.md). A code implementation or build alone does not complete a live integration. Preserve unverified work and business dependencies. Evidence IDs below refer to that status document.

## Current task: email verification (E18)

- [x] ? Implement verification page, account-email status, session-owned resend with IP/account quotas, secure signup links and duplicate/pending/error handling. All 120 offline tests and offline build/types pass; see PROJECT_STATUS E18 for scope.
- [ ] Owner production acceptance: signup and resend delivery, expired/used links, 429s, status refresh, existing login and Android/iOS interaction/accessibility. Full profile/email-change/mobile verification and durable notifications remain pending.

## Previous task: password recovery and token claims (E16)

Owner: Codex for offline implementation; product owner for production/provider/device acceptance. Contract and acceptance scenarios: [PASSWORD_RECOVERY.md](PASSWORD_RECOVERY.md).

- [x] ✅ Implement Forgot password and Reset password pages, login entry, neutral email-request acknowledgment, one-time transactional reset/verification claims and reset-session revocation. Shared mobile form layout, failed drafts, duplicate guards and URL-token handling are implemented; all 108 offline tests, formatting and environment-disabled build pass with three existing lint warnings (PROJECT_STATUS E16).
- [ ] Product owner: verify delivery/opening of reset emails, new/old password login, revoked sessions, reused/expired links, simultaneous requests and Android/iOS recovery flows on production. Timing-enumeration resistance, recipient-level abuse controls and post-reset notification delivery remain security/notification work.

## Previous task: safe API errors (E15)

Owner: Codex for offline implementation and evidence; product owner for production acceptance.

- [x] ✅ Add safe dispatcher exception handling, malformed-path rejection, explicit route lookup and consistent error details; standardize newsletter/auth/method/health errors and preserve newsletter drafts and success responses. All 94 offline tests, formatting and environment-disabled build pass; three existing lint warnings remain (PROJECT_STATUS E15).
- [ ] Product owner: validate E15 on the deployed revision: existing success flows, newsletter error/confirmation feedback, safe unknown-route responses and matching error/request IDs. Provider/browser/mobile acceptance remains pending; no deliberate production failures were triggered by Codex.

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

These must be addressed before calling the application stable or production-ready:

- [ ] Complete the React Query server-state strategy across required page reads, private user-scoped cache keys, invalidation, stale data, optimistic rollback and deduplication. React Query is adopted for many reads; session/wishlist restoration remains guarded effects; E11 scopes private keys and shares header/cart reads, and Orders/Order Details/Checkout have no integrated page reads. Earlier full-migration completion was overstated (E7).
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

- [x] ? Saved-subscription confirmation failures reconcile to Subscribed with informational feedback and no replay; privacy-safe failure diagnostics and 111 offline tests verify the bounded behavior (PROJECT_STATUS E17).
- [x] ? Owner reports newsletter working on 2026-09-14 (PROJECT_STATUS E17 owner report). Exact provider configuration fix and independent delivery/device evidence were not supplied; this does not verify every notification flow.
