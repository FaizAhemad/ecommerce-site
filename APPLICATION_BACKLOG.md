# Application backlog

The current page and route inventory is maintained in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). Any page or route change must update that inventory and the relevant status documentation in the same change.

This is the product owner’s pending backlog after the initial application stabilization work. All items below remain open until implementation and verification are recorded in `PROJECT_STATUS.md`.

Completion convention: keep unfinished work as `- [ ]`. When a point is implemented and verified, change it to `- [x] ✅` and add the test or deployment evidence to `PROJECT_STATUS.md`. Do not add the green tick for code that only builds locally.

## Release gates: security and resilience

These must be addressed before calling the application stable or production-ready:

- [x] Adopt a deliberate server-state strategy with React Query. Define cache keys, invalidation, stale data behavior, optimistic rollback, and request deduplication. Public storefront, catalog, product/review, tracking, cart, wishlist, and admin page reads are migrated; private cache is cleared on logout.
- [x] Add safe caching at the API and client layers. Public catalog/category/product/review reads use short public cache headers; authenticated customer, payment, order, wishlist, and admin responses use private no-store headers and the client cache is cleared on logout.
- [x] Audit and remediate `npm` vulnerabilities. Prisma and `@prisma/client` are aligned at 6.12.0; `npm audit --omit=dev` reports 0 vulnerabilities after remediation.
- [ ] Review all user-controlled input and rendered content for XSS. React output encoding, HTTP(S)-only media URLs, supported upload MIME validation, and a CSP report-only rollout are in place; final enforced CSP verification remains.
- [ ] Add authentication-aware rate limits to login, signup, password reset, review, upload, support, coupon, and admin endpoints.
- [ ] Handle too many requests with consistent `429` responses, retry guidance, request IDs, and snackbar/UI feedback.
- [ ] Perform a penetration test and document scope, findings, remediation, and retest evidence.
- [ ] Ensure customer data is scoped server-side to the authenticated customer or authorized admin. Do not share customer records through catalog, logs, browser storage, or broad API responses.
- [ ] Review the browser Network panel and production bundles for exposed secrets, private data, internal endpoints, and unnecessary responses.
- [x] Set a maximum API request timeout of 60 seconds (30 seconds by default, with a 60-second long-running override). Return a typed timeout response/message, cancel client work, and avoid duplicate non-idempotent retries. Controlled client and server timeout tests pass; request actions already prevent duplicate submissions while pending.

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
- [ ] Keep Orders visible in the authenticated navbar.
- [ ] Keep an Admin navbar item visible for confirmed admins, with a clear route back to the admin landing page.
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

## Acceptance and documentation

Each item needs an owner/priority, implementation notes, API/data changes, security impact, and verification evidence. Update `PROJECT_STATUS.md`, `API_IMPLEMENTATION_PLAN.md`, and this file when scope changes. Keep the Codex (`AGENTS.md`, `CODEX_INSTRUCTIONS.md`) and Copilot (`.github/copilot-instructions.md`) instructions aligned with this backlog.
