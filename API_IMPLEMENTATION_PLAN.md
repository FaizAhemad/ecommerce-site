# API implementation and remaining plan

Reviewed: 2026-09-12. This describes current files and known gaps. [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) owns completion; [PROJECT_STATUS.md](PROJECT_STATUS.md) owns verification evidence.

## Current layout

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

Keep implementation helpers outside root api. Current Vercel configuration rewrites /api/:path* to the catch-all dispatcher and other paths to index.html. Vite alone does not execute these handlers. Runtime setup is documented in [README.md](README.md).

## Existing endpoint groups

| URLs under /api | Current behavior and limitations |
| --- | --- |
| health; categories; products; products/:id | Connectivity, database categories, active products/detail. Catalog returns pages of up to 24 and nextCursor; UI pagination incomplete. |
| auth/login, signup, logout, me | Password/session implementation, configured-admin bootstrap; user reports login working. Complete session/security verification pending. |
| auth/verify-email, mobile-request, mobile-verify, password-reset-request, password-reset | Backend handlers exist; customer verification/reset routes and complete flows missing. |
| cart; wishlist | Authenticated persistence; optimistic client updates. Concurrency/isolation/storage review pending. |
| products/:id/reviews; products/:id/reviews/mine; products/:id/review-upload | Public approved reviews and authenticated create/own edit/upload; one review per user/product. Upload byte checks implemented, live verification pending. |
| orders; orders/:id; orders/:id/tracking | User-scoped list/detail/tracking and create/cancel handlers. Customer order pages are not integrated. Address ownership, inventory concurrency and order rules need review. |
| payments/razorpay-order; payments/razorpay-verify; webhooks/razorpay | Provider request/signature/status handling exists. Checkout, raw-body verification, idempotency, replay/state ordering, money and refunds require end-to-end verification. |
| newsletter/subscribe | Persists subscription; optional audience/contact and confirmation email. Uses legacy string errors and some hardcoded branding. |
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
| APP_URL | Base URL in verification/reset email links; destination pages still missing |
| BLOB_READ_WRITE_TOKEN | Vercel Blob SDK credential for upload access |
| NODE_ENV, VERCEL, VERCEL_ENV | Runtime cookie/security and proxy-address behavior |

SESSION_SECRET, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, Stripe keys, support destination settings and AI/map keys are not read by the current application handlers. They must not be presented as fixes for existing session failures or as proof integrations are available. Browser-prefixed variables must contain only intentionally public values; do not copy backend secrets into them.

## Error, timeout and abuse-control contracts

Shared JSON errors generally contain code, safe message and requestId. Namespace-wide validation/localization is incomplete; newsletter and some handlers still have different shapes. Typed client/provider timeout wrappers use 30 seconds by default and 60 seconds for explicit long-running calls. These wrappers do not guarantee a database/function execution deadline.

Public catalog/category/product/review handlers use short public cache headers; authenticated helpers and private handlers use no-store headers. Full response/cache isolation, error caching and per-user query keys still require verification.

[Rate-limit policies](RATE_LIMITING.md) run in the single dispatcher. 429 responses include RATE_LIMITED, retryAfterSeconds, requestId and Retry-After. Counter failures return RATE_LIMIT_UNAVAILABLE (503). Apply the additive third migration before deploying; no new external counter service or rate-limit secret is required. Session restoration, logout, normal GET reads and payment webhooks are excluded.

Product/review uploads accept supported image/video formats after MIME agreement, canonical base64, byte limit and signature checks, storing generated names/extensions. Existing encoded caps remain; provider body limits can be lower. Public Blob upload is not private-media authorization, decoding, malware scanning or moderation.

## Next implementation and verification

Prioritize the open security gates, then complete the customer commerce and administration flows already described in REQUIREMENTS.md. In particular, connect real Orders/Order Details/Checkout and tracking identifiers; verify address ownership, stock concurrency, amounts and provider refunds; implement support/customer messaging and durable notifications; complete business settings, policy management, roles and localization.

Use npm test, npm run lint and npm run build for local verification. The build includes Prisma generation and both type-check targets. The database-specific test and deployment/migration/cleanup order are in RATE_LIMITING.md. Tests/build alone do not establish live provider, authorization, multi-instance, delivery or checkout correctness.

Page consumers and missing routes are listed in [PAGE_INVENTORY.md](PAGE_INVENTORY.md). Keep this file synchronized when routes, environment usage, data models or response contracts change.
