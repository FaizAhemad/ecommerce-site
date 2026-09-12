# Application backlog

The current page and route inventory is maintained in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). Any page or route change must update that inventory and the relevant status documentation in the same change.

Reviewed against the current workspace on 2026-09-12. This is the single completion checklist for product requirements, security gates and UI work. Other documents describe scope and evidence; they must not maintain competing completion lists.

Completion convention: `- [ ]` means pending, partial, blocked or awaiting required verification; `- [x] ✅` means the stated scope is implemented and verified, with evidence in [PROJECT_STATUS.md](PROJECT_STATUS.md). A code implementation or build alone does not complete a live integration. Preserve unverified work and business dependencies. Evidence IDs below refer to that status document.

## Release gates: security and resilience

These must be addressed before calling the application stable or production-ready:

- [ ] Complete the React Query server-state strategy across required page reads, private user-scoped cache keys, invalidation, stale data, optimistic rollback and deduplication. React Query is adopted for many reads; App/session/header reads remain direct effects, private keys omit user IDs, and Orders/Order Details/Checkout have no integrated page reads. Earlier full-migration completion was overstated (E7).
- [ ] Complete and verify safe caching at API/client layers. Public/private headers and logout cache clearing exist; account-switch isolation, private key scoping and error caching remain unverified (E7).
- [x] ✅ Prior production dependency-audit remediation: earlier recorded `npm audit --omit=dev` reported 0 vulnerabilities after aligning Prisma packages at 6.12.0 (historical evidence E6). A fresh release audit is tracked separately below.
- [ ] Complete user-input/rendered-content XSS review. HTTP(S) URL filtering and upload signature/MIME/base64/size checks exist. Current CSP is absent, including report-only mode; controlled CSP, external media, full content validation and live verification remain (E1, E7).
- [ ] Add authentication-aware rate limits to login, signup, password reset, review, upload, support, coupon, and admin endpoints. PostgreSQL counters and dispatcher policies are implemented for existing writes; migration, live database/host verification and future support/coupon endpoints remain pending. See `RATE_LIMITING.md`.
- [ ] Handle too many requests with consistent `429` responses, retry guidance, request IDs, and snackbar/UI feedback. Structured 429s, typed client errors, translated snackbars and no automatic 429 retries are implemented and covered by automated tests; live browser acceptance remains pending.
- [ ] Perform a penetration test and document scope, findings, remediation, and retest evidence.
- [ ] Ensure customer data is scoped server-side to the authenticated customer or authorized admin. Do not share customer records through catalog, logs, browser storage, or broad API responses.
- [ ] Review the browser Network panel and production bundles for exposed secrets, private data, internal endpoints, and unnecessary responses.
- [x] ✅ Implement and test client/outbound-provider timeout wrappers: 30 seconds by default, with a 60-second long-running override and typed timeout errors (E1). This does not establish a database/function execution deadline.

Additional release checks:

- [ ] Re-run dependency/security checks against the release lockfile and record the result; historical audits do not certify a new release.
- [ ] Verify database/function execution budgets, client cancellation, retry/idempotency and ambiguous outcomes end to end.
- [ ] Apply and verify the rate-limit migration, test live SQL/concurrency and host 429 recovery, and schedule expired-counter cleanup.
- [ ] Standardize remaining API error shapes and localized recovery; newsletter still returns legacy string errors.
- [ ] Review CSRF protection, signup/verification/account enumeration, order-address ownership, inventory concurrency and payment/webhook replay/state transitions.

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

- [ ] Unknown routes such as `/admin/abc` should resolve to the relevant parent route (`/admin`) or a deliberate not-found route, consistently across client and server navigation.
- [ ] Replace the rating filter’s radio controls with checkboxes where multiple ratings can be selected.
- [ ] Show color filters as checkboxes with visible color swatches and hexadecimal values.
- [ ] Verify Orders navigation for authenticated users across responsive layouts. The link exists in SiteLayout; live acceptance pending.
- [ ] Verify and tighten Admin navigation visibility with a route back to the dashboard. The current link also appears for authenticated users already on /admin; content/API access is separately guarded.
- [ ] Add and verify configured social links in header/footer/rail placements.
- [ ] Support messages must send through Resend to an environment-configured support address; never hard-code or expose the address in the client.
- [ ] When a support request is created, email the customer a confirmation that the ticket was received and will be handled promptly.
- [ ] Add a customer request page showing ticket status, resolution, cancellation, reasons, timestamps, and support responses.
- [ ] Update privacy, returns, refunds, terms, age language, and other policies for the actual ecommerce operation; obtain approved legal copy before publishing.
- [ ] Define session and local-storage behavior, expiry, logout clearing, cross-tab synchronization, and what data is safe to persist.
- [ ] Complete payment integration, server-side amount verification, webhooks, idempotency, failure states, refunds, and reconciliation.
- [ ] Remove hard-coded brand/product images and use configured or database-backed media with safe fallbacks.
- [ ] Review and replace unclear, placeholder, or inconsistent wording across the application.
- [ ] Remove the customer-care phone number until a real number is configured; do not show a placeholder number.
- [ ] Replace oversized product-detail loading text with a compact accessible loading indicator and stable layout.
- [ ] Keep support submission in-app through the Resend API; do not open Outlook or another mail client. Support uploads must be validated and attached safely.
- [ ] Show an offline state immediately when connectivity is lost and a clear online notification when connectivity returns. Avoid losing unsaved form data.
- [ ] Add SEO metadata, canonical URLs, sitemap/robots behavior, structured product data, social previews, and crawl-safe route handling.

## Architecture and commerce requirements carried forward

These requirements from REQUIREMENTS.md and the original brief remain in scope alongside the product-owner list above:

- [ ] Complete database/admin-managed business identity, branding, contact, currency, locale, timezone, social/footer content, shipping and feature settings; verify a second-business deployment without source changes.
- [ ] Finish English/Hindi/Marathi localization across UI, validation, errors, emails, statuses and business content.
- [ ] Add API-configured independent home sections and complete catalog cursor loading, full facets and large-catalog performance verification.
- [ ] Fetch real Orders/Order Details data and use actual cart totals in Checkout; remove hardcoded delivered/paid dates and catalog-derived placeholder orders.
- [ ] Render saved wishlist products outside the initially loaded storefront catalog and verify empty/error/account-switch states.
- [ ] Complete password-reset/email-verification customer routes and profile/address workflows using the existing backend where appropriate.
- [ ] Define verified-purchase/moderation eligibility and remove generated fallback reviews before presenting authentic customer feedback.
- [ ] Integrate actual provider refunds and complete configurable cancellation/returns/refund workflows, amounts, idempotency and auditability.
- [ ] Finish shipment/tracking integration and resolve the order-number versus internal-ID mismatch; add a configurable map/GPS provider only after confirmation.
- [ ] Connect admin Messages and Settings forms, complete customer/fulfillment/return operations and add real audit event persistence.
- [ ] Define appropriate admin permissions beyond the current CUSTOMER/ADMIN model.
- [ ] Implement durable localized transactional notification events, retries and admin failure visibility for the required account/order/payment/refund/delivery lifecycle.
- [ ] Add versioned localized policy/CMS storage, publication/approval and consent versions where applicable; provide missing cancellation/shipping/cookie pages as required.
- [ ] Verify shared design-system accessibility, keyboard/focus, light-theme contrast, responsive layout and overlay layering across all pages.
- [ ] Add end-to-end success/failure, authorization, provider, performance and release regression tests; repair/re-enable the legacy wishlist test before claiming current coverage.
- [ ] Establish CI, monitoring, backup/restore, migration, deployment and rollback procedures with evidence.

## Verified bounded milestones

These do not complete the broader release gates:

- [x] ✅ Existing login works on the user's deployment, as explicitly reported by the user (E4); new loader and rate-limit rollout remain separate.
- [x] ✅ Automated upload-validator regression scope passes for supported signatures, spoofed content, encoding/type mismatches and size boundaries (E1); live upload and broader XSS remain pending.
- [x] ✅ Documentation synchronized to the current source, page map and recorded evidence in this pass (E7, E8).

## Acceptance and documentation

Security increment: product and review upload validation now checks base64, declared/data-URL MIME agreement, decoded size, and supported signatures, with generated storage filenames. Automated tests pass; the XSS item stays pending until the remaining rendering, CSP, and live deployment checks are verified. See `PROJECT_STATUS.md` for scope and limitations.

Each item needs an owner/priority, implementation notes, API/data changes, security impact, and verification evidence. Update `PROJECT_STATUS.md`, `API_IMPLEMENTATION_PLAN.md`, and this file when scope changes. Keep the Codex (`AGENTS.md`, `CODEX_INSTRUCTIONS.md`) and Copilot (`.github/copilot-instructions.md`) instructions aligned with this backlog.
