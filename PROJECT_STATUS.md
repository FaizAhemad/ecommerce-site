# Project Status

Last reviewed: 2026-09-06

## Current state

This repository is a **frontend foundation** for a reusable, white-label commerce platform. The customer UI and API handlers are implemented, while database migration, deployment configuration, and full frontend-to-API integration remain for handover.

## Implementation sequence

- [x] Frontend route and responsive UI foundation.
- [x] Initial loading retry state and protected-route demo behavior.
- [~] i18n foundation with English, Hindi, and Marathi JSON namespaces; remaining pages still need migration.
- [~] Global rendering fallback and storefront retry are in place; per-form/API error handling remains.
- [x] Add Node.js/TypeScript API foundation (see `API_IMPLEMENTATION_PLAN.md`).
- [~] Add Prisma schema and PostgreSQL connection; migration waits for deployment credentials.
- [x] Add secure authentication and protected sessions.
- [x] Add products, cart, wishlist, orders, reviews, tracking, and newsletter APIs.
- [x] Add Razorpay order creation, verification, and webhook handlers.
- [ ] Connect frontend to production APIs and deploy.
- [ ] Add realtime shipment/map tracking after order infrastructure is stable.

## API planning checkpoint

The backend approach is documented in [`API_IMPLEMENTATION_PLAN.md`](./API_IMPLEMENTATION_PLAN.md). API handlers now cover authentication, email/mobile verification, catalog, cart, wishlist, orders, reviews, tracking, payments, and newsletter persistence. The next implementation task is to configure the Vercel PostgreSQL connection and run the first migration.
- [~] Added a home newsletter subscription UI and Vercel Resend subscription endpoint. Configure `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, and optional `RESEND_FROM_EMAIL`; transactional order/auth emails remain backend work.

## Done

- Vite, React, and TypeScript storefront application scaffold.
- Centralized starter business configuration in `src/config.ts` for identity, contact details, locale/currency, branding, feature flags, and starter catalog data.
- API-shaped storefront adapter in `src/api/storefront.ts`, including catalog query and product-detail contracts.
- Responsive customer-facing routes for home, products, product detail, cart, support, privacy, and returns.
- Grid-only catalog UI with API-shaped search, category filtering, price sorting, and a loading/sentinel structure intended for future pagination. The local adapter currently simulates those query operations.
- Product-detail media UI supporting image/video data when supplied, plus a local review-submission prototype.
- Local, CSS-generated placeholder product art; no third-party product media is hotlinked.
- Light Ink-and-Citron design tokens, responsive layouts, keyboard focus styling, carousel controls, and basic accessible labels.
- Privacy and return-policy placeholder pages that explicitly request approved business content.
- Local cart-count interaction for visual prototyping.
- Enhanced cart page with item quantities, totals, and checkout navigation; added a responsive demo payment page with card, UPI, and cash-on-delivery options. Live payment processing is not connected.
- Cart rows now use compact quantity stepper controls and no longer render empty media placeholder boxes.
- Checkout now presents Razorpay and pay-on-delivery choices, including cash or card at the doorstep, with delivery details, method-specific messaging, and demo order feedback. Razorpay order creation/signature verification and COD eligibility remain backend work.
- Added a `/track-order` customer page with order-number lookup, demo delivery timeline, and footer navigation. Live tracking events still require an order/shipping backend.
- Added `/login` and `/signup` screens with email/password and Google sign-in entry points. Authentication is UI-only until a secure backend provides OAuth verification, password hashing, HTTPS, and session handling.
- Added Email/Mobile verification tabs in the auth UI. Email verification uses Resend; mobile verification uses OTP delivery through the Twilio-compatible SMS hook.
- Added an `/orders` page with recent order cards, delivery statuses, totals, track-order links, and customer-care support. It currently uses demo data until authenticated order APIs are available.
- Added protected `/cart`, `/wishlist`, `/checkout`, `/orders`, and `/orders/:id` routes. Unauthenticated visitors are sent to the login screen.
- Added browser-persisted wishlist controls, product-card heart buttons, a wishlist count in the navbar, and a wishlist page.
- Renamed customer-facing Shop navigation to Products (`/products`) and removed Bag terminology in favor of Cart.
- Added responsive navbar search with Enter submission, outside-click close behavior, query-string filtering, and a search-results state on the Products page.
- Added a shared responsive navigation layout with active route styling, Cart/Wishlist counts, authentication link, sticky-header behavior, and scroll-to-top navigation.
- Added i18next/react-i18next with English, Hindi, and Marathi locale namespaces under `src/i18n/locales`. Navbar and wishlist copy use translations; remaining pages still need migration.
- Added an initial localized error-content contract and a retryable storefront loading state. Remaining hardcoded page copy should be migrated into the content contract as backend/locales are finalized.
- Virtualized product-grid rendering with a local volume fixture (currently reduced for visual review; expandable to 1,000 items) to validate catalog performance without changing the card layout.
- API-derived catalog facets for categories and colors, plus rating filtering and product color swatches.
- Full-height, sticky desktop filter rail with mobile collapse/expand behavior and clear-filters support.
- Scroll-aware compact sticky header and floating back-to-top control.
- Refined footer spacing, borders, responsive columns, and link wrapping.
- Configurable Instagram, YouTube, and WhatsApp links with brand-colored fixed social rail, hover rotation, and footer placement.
- Source requirement documents: `REQUIREMENTS.md`, `TARGET.md`, and the original `requirement.md` brief.

## In progress / prototype limitations

- `getStorefront`, `getProducts`, and `getProduct` are local in-memory adapters, not HTTP/API calls.
- Catalog filtering and sorting work only on the small local catalog. Cursor pagination is typed but not implemented.
- The current facet values are derived by the local adapter from fixture data; production facets should be returned by the catalog API.
- The cart currently stores only a count in React state; it has no persistent server-backed line items or checkout state.
- Product media, product details, ratings, and review submission are presentation/prototype data only.
- Routing is a lightweight `history` implementation, not a router library with route-level loading/error handling.
- Customer-facing strings are only partially localized. i18n is configured, but page, filter, error, checkout, and footer copy still needs migration.
- Wishlist and cart are browser/demo state only; they are not synchronized to a user account.
- Product listing/detail and health API functions are scaffolded, but require the migrated database before they can serve production data.
- Authentication API handlers are scaffolded with scrypt password hashing and HttpOnly session cookies; the frontend still uses demo authentication until these endpoints are integrated.
- Authenticated Cart, Wishlist, Orders, order tracking, product reviews, and Razorpay create/verify handlers are now available; all require the Prisma migration and frontend integration.
- Newsletter subscriptions are recorded in the database after the Resend contact succeeds.
- Email verification, password reset, Razorpay webhook reconciliation, and order cancellation handlers are available.
- Signup/login support email or mobile verification paths; mobile OTP delivery requires SMS credentials in deployment.

## API development (next path)

Follow the staged plan in [`API_IMPLEMENTATION_PLAN.md`](./API_IMPLEMENTATION_PLAN.md):

1. Configure Vercel environment variables and run the Prisma migration.
2. Verify `/api/health`, authentication, OTP, payments, and webhook routes in preview.
3. Connect the existing UI adapter to the API one domain at a time and remove demo state only after each API is verified.
4. Add integration, authorization, payment, and end-to-end tests before launch.

## Remaining work

### Platform and data

- Select and document backend, database, ORM, storage, migrations, environment configuration, structured errors, request IDs, and safe API responses.
- Implement persistent data models for business configuration, catalog/media/inventory, users/roles, carts, orders, payments, shipments/tracking, reviews, policies, notifications, and audit records.
- Replace local adapters with authenticated API calls, real pagination, filtering, product details, and home-section CMS responses.

### Customer commerce

- Complete frontend integration for authentication, email/mobile verification, password reset, and customer profiles.
- Persistent cart, checkout, taxes/shipping eligibility, payment-provider abstraction, verification/webhooks, orders, cancellations, returns, refunds, and order history.
- Configurable product options, inventory, review eligibility/moderation, shipment and tracking flows.

### Admin, content, and localization

- Role-aware admin application and authorization.
- Admin/configuration workflows for business profile, branding, policies, shipping, locales, features, catalog/media, inventory, orders, and notification failures.
- Complete i18n migration for `en-US`, `hi-IN`, and `mr-IN`.
- Versioned, localized policy records and pages for all applicable policies.
- Approved business-provided product media and legal policy content.

### Operations and quality

- Asynchronous transactional notifications with retry and failure tracking.
- Authoritative, tool-based AI assistant with safe refusal behavior.
- Verified external integrations for payments, email, storage, AI, maps, shipping, and tracking where needed.
- Unit, integration, API, authorization, webhook, and end-to-end tests.
- CI that runs formatting, linting, type checking, tests, and production builds.
- Deployment, monitoring, backup, migration, and rollback documentation.

## Business input still required

Do not invent these decisions in code:

- Operating country/state, legal jurisdiction, tax/GST treatment, and currency rules.
- Business name/branding assets, approved contact details, supported locales, and timezone.
- Product catalog, real pricing/inventory, and business-supplied images/videos.
- Delivery areas, charges, estimates, courier/tracking requirements, and live-location need.
- Payment, email, storage, AI, maps, and shipping providers.
- Cancellation, return, refund, and review eligibility rules.
- Approved and localized legal-policy text.
- Admin roles and permissions.

## Documentation note

`TARGET.md` is the current phased plan and should be treated as the primary implementation roadmap. `REQUIREMENTS.md` is the detailed product/architecture specification. `requirement.md` appears to be the original, more verbose brief and contains encoding artifacts; retain it as reference, but avoid using it as the source of truth when it conflicts with the other two documents.

`README.md` should also be corrected in a future documentation pass: it says the UI supports a light/dark-mode toggle, while `TARGET.md` and the implementation are light-only. Keep API secrets server-side; only genuinely public browser values may use `VITE_` variables.
