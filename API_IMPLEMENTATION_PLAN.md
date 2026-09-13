# API implementation and remaining plan

Reviewed: 2026-09-12. This describes current files and known gaps. [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) owns completion; [PROJECT_STATUS.md](PROJECT_STATUS.md) owns verification evidence.

## Current layout

E10 formats the dispatcher/handlers/helpers and adds a shared development formatter. Endpoint URLs, authorization, response contracts and deployment consolidation are unchanged; the security/integration findings below remain pending.

```text
api/[...route].ts          Single Vercel entry point and route dispatcher
server/api/
  _lib/                   db, auth, http, email, sms, media, rate-limit, rate-limit-store
  auth/                   Login/signup/logout/me, verification and reset handlers
  admin/                  Products, categories, upload and operational handlers
  products/               Catalog/detail, reviews, own-review, review upload
  cart/                   Cart reads and mutations
  wishlist/               Wishlist reads and mutations
  orders/                 Order create/list/detail/cancel and shipment lookup
  payments/               Razorpay order and verification
  webhooks/               Razorpay webhook
  newsletter/             Subscribe
  categories.ts           Public categories
  health.ts               Database connectivity
prisma/
  schema.prisma
  migrations/             Initial schema, categories, rate-limit buckets
  seed.mjs                Ten default categories
```

Keep implementation helpers outside root api. Current Vercel routes use /api/(.*) to the dispatcher with route=$1, then filesystem handling and an extensionless SPA fallback excluding Vite virtual modules/source/dependencies/assets. E12 verifies local HTML/JavaScript/JSON content types. Vite alone does not execute these handlers. Runtime setup is documented in [README.md](README.md).

## Existing endpoint groups

| URLs under /api | Current behavior and limitations |
| --- | --- |
| health; categories; products; products/:id | Connectivity, database categories, active products/detail. Catalog returns pages of up to 24 and nextCursor; UI pagination incomplete. |
| auth/login, signup, logout, me | Password/session implementation, configured-admin bootstrap; user reports login working. Complete session/security verification pending. |
| auth/verify-email, mobile-request, mobile-verify, password-reset-request, password-reset | E16 adds forgot/reset pages and atomic one-time token claims; customer verification pages and live recovery acceptance remain pending. |
| cart; wishlist | Authenticated persistence; optimistic client updates. Concurrency/isolation/storage review pending. |
| products/:id/reviews; products/:id/reviews/mine; products/:id/review-upload | Public approved reviews and authenticated create/own edit/upload; one review per user/product. Upload byte checks implemented, live verification pending. |
| orders; orders/:id; orders/:id/tracking | User-scoped list/detail/tracking and create/cancel handlers. Customer order pages are not integrated. Address ownership, inventory concurrency and order rules need review. |
| payments/razorpay-order; payments/razorpay-verify; webhooks/razorpay | Provider request/signature/status handling exists. Checkout, raw-body verification, idempotency, replay/state ordering, money and refunds require end-to-end verification. |
| newsletter/subscribe | Persists subscription; optional audience/contact and confirmation email. Uses structured errors with saved/confirmation-failed distinction (E15); email branding is still hardcoded. |
| admin/products; admin/products/:id; admin/categories; admin/upload | Product create/edit/archive/stock, category creation and public media uploads. |
| admin/orders; payments; returns; customers; analytics; messages; settings; audit | Protected handlers. Refund changes DB flags only; audit returns an empty list; messages/settings UI incomplete. |

There is no Google OAuth handler, support-ticket API, profile/address CRUD API, coupon/referral/cashback API, AI endpoint, policy CMS, or durable notification worker. Do not infer working functionality from a schema model or handler filename.

## Data and configuration

Prisma defines users/accounts/sessions/tokens/addresses, categories/products/media/colors, reviews/media, cart/wishlist, orders/items/payments, shipments/events, returns, customer messages, store settings, newsletter subscriptions and rate-limit buckets. Only CUSTOMER and ADMIN roles are currently modeled. Policy version/consent, audit events, notification outbox, coupon/reward and tenant models are future work.

Application identity/content largely comes from src/config.ts and src/api/storefront.ts. Store settings have a generic admin API but are not a complete business CMS. The seed upserts Clothing, Sports, Home & Kitchen, Furniture, Footwear, Jewelry, Accessories, Watches, Electronics and Toys. It does not seed admin users; matching ADMIN_EMAIL/ADMIN_PASSWORD credentials bootstrap a missing admin at login.

## Environment names actually consumed

| Server-only setting | Purpose |
| --- | --- |
| DATABASE_URL | Prisma connection, sessions and shared rate-limit storage |
| ADMIN_EMAIL, ADMIN_PASSWORD | Configured admin login/bootstrap |
| RESEND_API_KEY, RESEND_FROM_EMAIL | Transactional email; verified sender/provider configuration required |
| RESEND_AUDIENCE_ID | Optional newsletter audience contact synchronization |
| TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER | Mobile verification transport |
| RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET | Payment requests/verification and webhook authentication |
| APP_URL | Configured link origin; reset destination implemented in E16, email-verification page still missing |
| BLOB_READ_WRITE_TOKEN | Vercel Blob SDK credential for upload access |
| NODE_ENV, VERCEL, VERCEL_ENV | Runtime cookie/security and proxy-address behavior |

SESSION_SECRET, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, Stripe keys, support destination settings and AI/map keys are not read by the current application handlers. They must not be presented as fixes for existing session failures or as proof integrations are available. Browser-prefixed variables must contain only intentionally public values; do not copy backend secrets into them.

## Error, timeout and abuse-control contracts

Shared JSON errors generally contain code, safe message and requestId. Namespace-wide validation/localization is incomplete; newsletter and some handlers still have different shapes. Typed client/provider timeout wrappers use 30 seconds by default and 60 seconds for explicit long-running calls. These wrappers do not guarantee a database/function execution deadline.

Public catalog/category/product/review handlers use short public cache headers; authenticated helpers and private handlers use no-store headers. Full response/cache isolation, error caching and per-user query keys still require verification.

[Rate-limit policies](RATE_LIMITING.md) run in the single dispatcher. 429 responses include RATE_LIMITED, retryAfterSeconds, requestId and Retry-After. Counter failures return RATE_LIMIT_UNAVAILABLE (503). Apply the additive third migration before deploying; no new external counter service or rate-limit secret is required. Session restoration, logout, normal GET reads and payment webhooks are excluded.

Product/review uploads accept supported image/video formats after MIME agreement, canonical base64, byte limit and signature checks, storing generated names/extensions. Existing encoded caps remain; provider body limits can be lower. Public Blob upload is not private-media authorization, decoding, malware scanning or moderation.

## Next implementation and verification

The current source audit is consolidated in [ARCHITECTURE_UI_UX_AUDIT.md](ARCHITECTURE_UI_UX_AUDIT.md). It identifies unchecked order-address ownership, pre-transaction stock/cancellation eligibility checks, database-only refunds, error cache headers, private query/session isolation and missing action/error states as priorities. These findings require remediation and tests; no API contract was changed by the audit.

Prioritize the open security gates, then complete the customer commerce and administration flows already described in REQUIREMENTS.md. In particular, connect real Orders/Order Details/Checkout and tracking identifiers; verify address ownership, stock concurrency, amounts and provider refunds; implement support/customer messaging and durable notifications; complete business settings, policy management, roles and localization.

Under the current owner workflow, use npm test, formatting, npm run lint and npm run build:offline. Do not inspect .env or run live/migration/provider checks; the owner validates production. The database-specific test and deployment/migration/cleanup order are in RATE_LIMITING.md. Tests/build alone do not establish live provider, authorization, multi-instance, delivery or checkout correctness.

Page consumers and missing routes are listed in [PAGE_INVENTORY.md](PAGE_INVENTORY.md). Keep this file synchronized when routes, environment usage, data models or response contracts change.

## E11/E12 contract changes

POST /api/orders requires a nonempty owned addressId. Missing, malformed, unknown and foreign addresses return the same 400 INVALID_ADDRESS before cart reads or order writes. GET order detail hides historical foreign shipping-address relations. Tracking matches internal ID or orderNumber while retaining userId scope. sendError always resets Cache-Control to private/no-store. Signup safely selects role alongside its already limited identity fields and returns id/email/name/role consistently with login and /me.

Client private keys are ['private', userId-or-guest, sessionGeneration, ...resource]. Private HTTP requests abort/discard stale-session responses and JSON bodies. Header/cart share src/api/cart.ts; mutations merge only their affected row and reconcile after all current mutations settle. No optimistic payment/order/refund success is introduced. Account changes clear private queries and copied route state; wishlist IDs are memory-only. Public category/product bootstrap reads are parallel and fail explicitly; catalog consumes cursor pages and cancellation.

Rate-limit SQL initialization now loads .env before dynamically importing Prisma. The configured database passes temporary-table SQL checks and migrate deploy reports no pending migrations. Other deployment databases, production host/browser acceptance and scheduled cleanup remain separate. Vercel routing uses one function throughout; implementation files remain under server/api.

## E13 order transaction contract

Order POST uses one Serializable transaction for owned-address/cart/price reads, conditional active-stock reservation, order/payment creation and cart clearing. Failed reservation returns 409 OUT_OF_STOCK; invalid cart returns 409 INVALID_CART; P2034 returns 409 CONFLICT with refresh guidance. No automatic transaction/write replay occurs. UUID order numbers replace timestamp-only numbers. No schema migration is required.

Customer PATCH action=cancel and admin PATCH status=CANCELLED share atomic status/restock logic. Existing CANCELLED is a 200 no-op; only PENDING/CONFIRMED is eligible for new cancellation. Other states or concurrent state changes produce 409; missing/foreign customer orders produce the same 404. Admin cannot reopen closed CANCELLED/REFUNDED orders through status editing. Generic admin fulfillment policy and true refunds remain separate requirements.

Razorpay verification/capture callbacks update order status only when currently PENDING. Recording provider payment status remains distinct; late captured funds on a cancelled order still require provider reconciliation/refund work. Existing payment signature/body/idempotency limitations are not certified by these guards.

Production validation is user-owned. Offline tests use injected stores and synthetic provider signatures; do not inspect .env or call a live database/provider during ongoing implementation. Use build:offline for type/frontend compilation without environment-file loading.

## E14 CSRF contract

All browser API writes now require X-CSRF-Token, obtained from GET /api/auth/csrf with X-CSRF-Bootstrap: 1 and the same cookie jar. apiFetch handles this centrally, including guest auth/newsletter writes. The dispatcher rejects invalid proof with private/no-store 403 before limiter/handler work. Only exact POST /api/webhooks/razorpay is exempt and still requires the provider signature. Reads, route paths and existing authorization remain intact. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for token lifecycle, same-origin requirements and owner rollout; production acceptance remains pending (E14).

## E15 safe error contract

API errors use `{ error: { code, message, requestId } }` with private/no-store caching. The dispatcher adds X-Request-Id, rejects malformed routes with 400 INVALID_PATH, returns 404 NOT_FOUND for unregistered routes and catches unexpected runtime exceptions as 500 INTERNAL_ERROR. It logs only the fixed api_unhandled_error event and a sanitized UUID; raw error/customer/provider data is omitted. Responses already sent are not rewritten. Module initialization, platform parsing and terminated transports remain outside this boundary.

Newsletter now uses structured 400 VALIDATION_ERROR, 405 METHOD_NOT_ALLOWED, 503/502 NEWSLETTER_UNAVAILABLE and 502 CONFIRMATION_EMAIL_FAILED. The latter explicitly means persistence completed but confirmation failed; no automatic retry is performed. Success stays 202 `{ subscribed: true, emailSent }`. The client accepts old string errors during rollout, rejects unconfirmed success and retains failed drafts. Shared auth/method/CSRF errors include IDs/messages; health failure keeps its previous monitoring fields and adds error details. Existing 429 metadata and neutral password-reset acceptance are preserved. See PROJECT_STATUS E15 for 94-test evidence; full localization and owner production acceptance remain pending.

The boundary follows [OWASP error-handling guidance](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html) on generic external failures; privacy limits these logs to correlation events rather than raw exceptions. Keep successes unchanged, use sendError for known failures, and never expose a caught error.message or replay an ambiguous write.

## E16 password recovery

Forgot/reset customer routes now call the existing POST /api/auth/password-reset-request and /api/auth/password-reset endpoints through apiFetch. Request acknowledgment is neutral and does not establish delivery. Existing APP_URL supplies a validated HTTPS origin for new fragment-token links; Resend settings remain unchanged. Reset claims a token once, changes the password, invalidates other reset links and revokes existing owner sessions in one Serializable transaction. Email/mobile verification shares that claim helper. Success DTOs are preserved; all responses are private/no-store. See [PASSWORD_RECOVERY.md](PASSWORD_RECOVERY.md) for payloads, validation, security limits and owner acceptance; 108 offline tests pass.


E17 newsletter clarification: the existing 502 CONFIRMATION_EMAIL_FAILED contract explicitly denotes a saved subscription. The client treats only that status/code combination as saved with unconfirmed email, without retrying. All other failures remain errors. Operational logs include phase, provider HTTP status when available and requestId only; consult the corresponding protected Resend logs for its actual reason. Do not expose provider bodies or recipient details to clients. No new environment variable or migration is required.
