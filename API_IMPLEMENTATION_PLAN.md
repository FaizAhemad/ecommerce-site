# API Implementation Plan

## Scope and current baseline

Build the backend for the existing Vite storefront using Vercel Node.js Functions, Prisma, and the existing Vercel PostgreSQL storage. The UI remains the current customer-facing client; API work will replace the local adapter incrementally.

Current baseline: the UI has Products search/filtering, Cart and Wishlist flows, protected checkout/order routes, Resend newsletter subscription, and i18n scaffolding. API handlers now cover catalog, authentication, email/mobile verification, cart, wishlist, orders, reviews, tracking, Razorpay, and newsletter persistence. The Prisma migration and production frontend integration are still pending.

## Principles

- Keep Prisma, database URLs, payment secrets, and Resend keys server-only.
- Validate every request at the API boundary.
- Return stable JSON error shapes that the UI can localize.
- Store money as integer minor units (for example, paise), never floating-point totals.
- Calculate prices, discounts, stock, delivery fees, and payment amounts on the server.
- Treat webhook handlers as idempotent and verify provider signatures.
- Use database transactions for cart checkout and order creation.

## Proposed structure

```text
api/
  _lib/
    db.ts                 Prisma client singleton
    auth.ts               session and authorization helpers
    validation.ts         request validation helpers
    errors.ts             stable API error responses
    email.ts              Resend client and templates
    payments.ts           Razorpay integration and verification
  auth/
    signup.ts
    login.ts
    logout.ts
    google.ts
    verify-email.ts
    mobile-request.ts
    mobile-verify.ts
    password-reset-request.ts
    password-reset.ts
  products/
    index.ts
    [id].ts
  cart/
    index.ts
    items.ts
  orders/
    index.ts
    [id].ts
  payments/
    razorpay-order.ts
    razorpay-verify.ts
  webhooks/
    razorpay.ts
  newsletter/
    subscribe.ts
prisma/
  schema.prisma
  migrations/
```

## Initial Prisma models

- User and OAuth account
- Session and email/mobile-verification tokens
- Address
- Product, ProductImage, ProductVideo, ProductColor
- Review and ReviewMedia
- Cart and CartItem
- Order and OrderItem
- Payment
- Shipment and tracking events
- Newsletter subscription/audit record

## Delivery sequence

### Priority 0 — admin operations (first implementation focus)

The Admin Dashboard is the operational source of truth. Complete these APIs and connect the existing `/admin` UI before polishing the remaining customer-facing integrations:

1. Product CRUD, media, categories, pricing, inventory, and publish/archive controls.
2. Order list/detail views, fulfillment status updates, cancellation, return, and refund workflows.
3. Payment reconciliation, Razorpay webhook history, COD records, and refund actions.
4. Customer search/detail, verification status, account actions, and role management.
5. Customer messaging with Resend delivery status and message history.
6. Analytics queries for revenue, orders, customers, products, conversion, and inventory risk.
7. Store settings for branding, shipping, tax, locale, policies, and notification templates.
8. Admin audit logs, rate limiting, and authorization tests for every admin route.

### Phase 1 — foundation (next implementation)

1. Verify the Vercel PostgreSQL connection and Prisma migrations in a safe environment.
2. Add `prisma/schema.prisma`, generated client, and a serverless-safe `api/_lib/db.ts` singleton.
3. Add `GET /api/health` with database connectivity status without exposing secrets.
4. Add shared validation, stable error responses, request IDs, and environment checks.

### Phase 2 — identity and catalog (implemented; migration pending)

5. Implement signup/login/logout, password hashing, email verification, and protected sessions.
6. Replace local catalog reads with `GET /api/products` and `GET /api/products/:id`, including server-side search, facets, rating, sorting, and cursor pagination.

### Phase 3 — customer commerce (implemented; migration pending)

7. Persist authenticated cart items and quantities; add wishlist read/add/remove endpoints.
8. Create orders transactionally from the server-owned cart, with server-calculated totals and stock checks.
9. Add Razorpay order creation, payment verification, webhook reconciliation, COD rules, and idempotency.

### Phase 4 — communication and operations (core handlers implemented)

10. Add Resend email service for verification, welcome, order, payment, shipping, and newsletter events.
11. Add reviews/media authorization, shipment status, tracking APIs, audit records, rate limits, and monitoring.
12. Connect the UI adapter to each verified API, then test preview and production deployments.

## First API milestone checklist

- [x] Create `prisma/schema.prisma` with User, Session, Product, ProductImage, Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, Payment, and NewsletterSubscription models.
- [ ] Configure the Vercel `DATABASE_URL` in the server environment and run the first migration.
- [x] Add `api/_lib/db.ts` Prisma singleton and `api/health.ts`.
- [x] Add shared HTTP error/request-id helpers and database-backed `GET /api/products` and `GET /api/products/:id` endpoints.
- [x] Add password hashing and HttpOnly session-cookie handlers for `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.
- [x] Add authenticated Cart, Wishlist, Orders, order tracking, product reviews, and Razorpay create/verify handlers.
- [x] Add admin product, order, customer, analytics, payment/refund, returns, messaging, settings, and audit endpoints.
- [x] Persist successful newsletter subscriptions in `NewsletterSubscription`.
- [x] Add email verification, password-reset request/confirm, Razorpay webhook reconciliation, and order cancellation handlers.
- [x] Add email/mobile verification tabs and mobile OTP endpoints (`/api/auth/mobile-request`, `/api/auth/mobile-verify`).
- [x] Add admin dashboard foundation with role-protected CRUD, operations, messaging, analytics, payments, returns, and settings sections.
- [~] Admin-first roadmap recorded above; product, order, customer, payment, messaging, analytics, settings, and audit work should be completed before final storefront handover.
- [x] Restore sessions with `GET /api/auth/me`, server logout, configured-admin bootstrap on matching credentials, and reusable `requireAdmin()` authorization.
- [x] Add admin product, order, customer, analytics, payment, returns, messaging, settings, and audit API routes.
- [x] Connect Admin tabs to live APIs; empty database states are supported until migration and seed data are available.
- [x] Validate admin product creation against duplicate names with a server-side conflict response.
- [ ] Confirm the health response in a Vercel preview before implementing auth or payments.

The API files can be type-checked locally with `npx tsc -p tsconfig.api.json`. The frontend build remains `npm run build`.

## API error contract

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need attention.",
    "fields": { "email": "Enter a valid email address." },
    "requestId": "..."
  }
}
```

Planned codes include `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYMENT_FAILED`, `RATE_LIMITED`, and `INTERNAL_ERROR`.

## Environment variables

Server-only:

```text
DATABASE_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_AUDIENCE_ID
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
APP_URL
SESSION_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Browser-safe values should use `VITE_` only when genuinely public, such as a Razorpay key ID needed by the checkout widget. Never expose database, Resend, OAuth secret, or Razorpay secret values.

## Definition of done for API foundation

- Prisma migration applies successfully to the Vercel database.
- API routes return typed success and error responses.
- Secrets are configured only in Vercel environment settings.
- Authentication and authorization are enforced server-side.
- Payment amounts are generated and verified server-side.
- Webhooks are signature-verified and idempotent.
- UI can use the API without changing the customer-facing layout.

## UI integration update ? September 7, 2026

- Cart POST is connected from product detail and listing buttons using productId and quantity; it increments an existing cart item. PATCH retains absolute-quantity semantics. Header counts use successful responses and initial cart loading.
- Wishlist mutations wait for server confirmation; local storage mirrors successful state instead of acting as a fallback for failed requests.
- Product review reads select media IDs/URLs, consumed by photo/video lists in both review views. Product load failures and HTTP 404 use separate UI states.
- Shared notification handling is specified in [NOTIFICATION_GUIDELINES.md](NOTIFICATION_GUIDELINES.md). Action outcomes use snackbars; field validation and blocking load failures retain inline recovery context.
- Build/type checking passed. Real server/database, authentication, upload/playback, concurrency, quantity-limit, and stopped-server scenarios still need integration verification. Checkout UI is still a placeholder; this update does not establish working payments.
- Navigation consumes the authenticated session and a protected admin capability check to expose Orders and Admin links consistently. Header authentication controls are kept separate from primary navigation.

The next API work must follow [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md), with security gates completed before feature expansion. Prioritize authorization/data isolation, rate limits and `429` handling, two-minute timeouts, dependency/XSS/network exposure audits, session/storage rules, support email through Resend, request tracking, and payment verification.
# Page and route inventory

Upload validation follow-up: `POST /api/admin/upload` and `POST /api/products/:id/review-upload` use `server/api/_lib/media.ts` before storage writes. Existing authentication, URLs, public Blob storage, response shapes, and request size caps remain. The shared validator checks canonical base64, matching supported MIME types, decoded byte limits (6,000,000 product / 1,500,000 review), and media signatures. Stored paths use UUIDs and canonical extensions instead of user filenames. Validation failures use the existing `400 VALIDATION_ERROR` contract. Signature checks do not replace full decoding, malware scanning, or content moderation. Provider request body limits can be lower than these application limits.

The API consumers and route owners are listed in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). Keep the inventory synchronized when API-backed page behavior changes.
