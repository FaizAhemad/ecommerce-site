# API Implementation Plan

## Scope

Build the backend for the existing Vite storefront using Vercel Node.js Functions, Prisma, and the existing Vercel PostgreSQL storage. The UI remains the current customer-facing client; API work will replace the local adapter incrementally.

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
- Session and email-verification token
- Address
- Product, ProductImage, ProductVideo, ProductColor
- Review and ReviewMedia
- Cart and CartItem
- Order and OrderItem
- Payment
- Shipment and tracking events
- Newsletter subscription/audit record

## Delivery sequence

1. Verify Vercel PostgreSQL connection and Prisma migrations in a safe environment.
2. Add Prisma schema, generated client, and serverless-safe database helper.
3. Add shared validation and error response contracts.
4. Implement signup/login/logout and protected session checks.
5. Replace product/catalog reads with database-backed APIs and server-side filtering.
6. Persist cart items and quantities for authenticated users.
7. Create orders transactionally from the server-owned cart.
8. Add Razorpay order creation, payment verification, and webhook reconciliation.
9. Add Resend email service for verification, welcome, order, payment, and shipping events.
10. Add reviews and media-upload authorization.
11. Add shipment status and tracking APIs.
12. Connect the UI adapter to API routes, then test preview and production deployments.

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
