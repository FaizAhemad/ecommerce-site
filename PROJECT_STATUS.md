# Project Status

Last reviewed: 2026-09-07

## Current state

This repository contains the customer storefront, protected API handlers, and an admin control center. Production database migration, deployment configuration, and final end-to-end verification remain for handover.

## Implementation sequence

- [x] Frontend route and responsive UI foundation.
- [x] Initial loading retry state and protected-route demo behavior.
- [~] i18n foundation with English, Hindi, and Marathi JSON namespaces; remaining pages still need migration.
- [~] Global rendering fallback and storefront retry are in place; per-form/API error handling remains.
- [x] Add Node.js/TypeScript API foundation (see `API_IMPLEMENTATION_PLAN.md`).
- [~] Add Prisma schema and PostgreSQL connection; schema is ready, but the production migration waits for deployment credentials.
- [x] Add secure authentication and protected sessions.
- [x] Add products, cart, wishlist, orders, reviews, tracking, and newsletter APIs.
- [x] Add server-side duplicate product-name validation and admin product media upload support.
- [x] Add Razorpay order creation, verification, and webhook handlers.
- [~] Connect frontend catalog reads to `/api/products` and cart reads/quantity updates to `/api/cart`; wishlist, checkout, and order screens still need full server synchronization.
- [ ] Configure Vercel environment variables, migrate Prisma, and deploy.
- [ ] Add realtime shipment/map tracking after order infrastructure is stable.

## API planning checkpoint

The backend approach is documented in [`API_IMPLEMENTATION_PLAN.md`](./API_IMPLEMENTATION_PLAN.md). API handlers now cover authentication, email/mobile verification, catalog, cart, wishlist, orders, reviews, tracking, payments, newsletter persistence, and protected admin operations. The next handover task is to configure the Vercel PostgreSQL connection, run the first migration, and verify the live API.
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
- Disabled the local demo catalog and demo order/tracking records; storefront and tracking now require database/API data.
- Added a protected Admin Dashboard foundation at `/admin` with catalog, orders, payments, customers, messaging, analytics, settings, and health areas.
- Added server-authorized admin APIs for products, orders, customers, analytics, payments/refunds, returns, messaging, settings, and audit access. The Admin UI now connects Products, Overview, Orders, Customers, Messages, and Settings to these APIs.
- Added session restoration on page refresh, server logout, configured-admin bootstrap from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, and server-side `requireAdmin()` authorization.
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

1. Complete the Admin-first operations milestone: product CRUD, orders, payments/refunds, customers, messaging, analytics, settings, and audit logs.
2. Configure Vercel environment variables and run the Prisma migration.
3. Verify `/api/health`, authentication, OTP, payments, and webhook routes in preview.
4. Connect the existing UI adapter to the API one domain at a time and remove demo state only after each API is verified.
5. Add integration, authorization, payment, and end-to-end tests before launch.

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

## September 7, 2026: layout, product feedback, and notifications

- Standardized responsive page gutters in App.css; product details, ratings, and review forms share a centered 1120px maximum width with mobile gutters preserved.
- Review GET responses include saved media. Latest reviews and the all-reviews drawer display photo thumbnails and playable videos; submitted attachments appear immediately.
- Product request failures now show a connection-error state with retry. Missing products show a dedicated not-found state and Browse products; neither displays Add to cart.
- Add-to-cart callbacks pass the product ID to the API, disable buttons while pending, and update counts after success. POST increments existing quantities; PATCH replaces quantities. Cart quantity changes now check responses and notify failures.
- Wishlist changes wait for the API; failed requests no longer pretend to succeed through local storage. Wishlist controls sit outside product images beside the price.
- Removed redundant cart success text beneath cards. Shared queued, dismissible snackbars now handle action feedback across authentication, subscriptions, reviews, admin saves, cart/wishlist actions, and tracking request errors. See [message guidelines](NOTIFICATION_GUIDELINES.md) for inline-versus-snackbar decisions.
- Selected filenames, field validation, empty states, loading states, and blocking page errors remain inline. Admin duplicate-file browser alerts are replaced with snackbars.
- Checkout remains a placeholder: attempting payment now explains unavailability without claiming an order/payment was submitted. No payment integration was completed in this pass.
- Verification: production build passed; lint completed with React warnings. Live API/browser scenarios have not been verified in this pass.

## Optimistic interaction follow-up

Cart additions and wishlist toggles now update visible counts/hearts immediately, then save in the background. Failed saves roll back the affected change and retain snackbar feedback. Cart writes are serialized and final counts reconciled; wishlist state uses shared product locks and version checks against stale reads. This supersedes the earlier wait-before-updating behavior described above. Cart quantity editing still waits for confirmation. Production build and two mocked wishlist concurrency/rollback tests passed (`node --test tests/wishlist-optimistic.test.mjs`). Live backend/browser behavior and cart concurrency still require integration verification.

## Form reset follow-up

Product creation resets native fields and the separate accumulated image/video selection cache only after a successful API save. File listeners are scoped to the product form; product fields are disabled while saving. Authentication explicitly resets native fields and controlled password state after success. Reviews clear comment, rating, and attachments after success and prevent edits during submission. Newsletter already clears email after success. Failures retain input. Search/tracking retain query context; checkout and admin messaging remain unimplemented submission flows and must not clear input as though saved. Production build passed; live browser submission/reset verification remains outstanding.

## Admin product list refresh

Successful product creation now inserts the product returned by POST directly at the top of the admin list, without waiting for another GET or a page refresh. Background list reads bypass browser cache and retain locally confirmed creations missing from older snapshots, with ID deduplication. Form reset and success notification follow the state update. Production build passed; live browser verification remains outstanding.

## Admin product editing

Product rows now offer Edit. The form loads name, category, description, price, stock, colors, and retained photos/videos. Admins can remove existing media, upload additions, choose a primary image, save changes through PATCH, or cancel. The product list updates from the successful response without refresh; stock and visibility edits also update list state. PATCH validates names, category, price/stock, duplicate names, and color values; color/media replacements run in the product transaction. List GET includes videos. Save errors retain form values and show snackbar feedback. Production build passed; live authenticated edit, media upload/removal, and rollback verification remain outstanding.

## Database-backed category management

Product categories are now stored in the `Category` table and served by `/api/categories`. The admin product form uses a strict select control. Admins can add a category from the Products section through the protected `/api/admin/categories` endpoint; the new option is available immediately in the product form. Product create/edit APIs validate the selected category against the database. The migration seeds the existing fixed categories and preserves legacy product category values. Applying the migration and live authenticated verification remain pending until a working PostgreSQL connection is available.

`prisma db seed` is now configured through `prisma/seed.mjs`. It idempotently upserts the same ten default categories, so it can safely be run after migrations or against an existing database.

The temporary Vercel SPA rewrite was removed after it caused Vite/Vercel dev routing loops. Local Vite development uses its built-in SPA fallback for `/admin`, `/orders`, and `/product/:id`; production routing should be configured through the deployment framework without overriding Vite’s dev middleware.

Local Vite development now uses host `127.0.0.1` and port `3000` with a strict port check so Windows IPv6 binding failures cannot prevent startup and the browser, API origin, and HMR URL cannot silently drift to another port. If port 3000 is already occupied, stop the other process before starting the app.

The storefront loader now treats non-JSON API responses from Vite-only local development as unavailable data and keeps the shell usable until the Vercel API runtime is connected. This prevents a local `/api/categories` module response from crashing the application.

Vite uses the standard React Fast Refresh plugin in development. CSP is intentionally absent from the local Vite response so its required inline preamble is not blocked.

Product detail review submission now clears the saved form values while keeping the review form visible; the success snackbar provides confirmation instead of replacing the form with an empty section.

Review submission errors now preserve the API message in the snackbar, including authentication, duplicate-review, validation, and media-upload failures.

Added the authenticated `/api/products/:id/reviews/mine` endpoint and product-detail edit mode. The server scopes reads and updates by the session user, while the client updates the public review cache after a successful edit without sending a customer ID.

The edit form is now opt-in: customers without an existing review see no Edit review action; customers with one see it only beside their own review and can load it into the form.

The latest reviews section was refined so the heading and View all action share a clear row, each review has consistent vertical rhythm, and the customer-only Edit review action is a compact accessible pencil icon grouped with its review.

The newsletter form now uses the shared client request timeout wrapper, preventing a subscription request from hanging indefinitely and preserving the existing snackbar error handling.

Newsletter responses now report whether the Resend confirmation email was actually accepted. The success state can be clicked to start another subscription, and failed confirmation delivery is surfaced instead of being reported as a silent success. The project now declares Node 22 LTS in `package.json` and `.nvmrc` because Node 24 can trigger a libuv shutdown assertion in the Vercel/Vite process on Windows.

Review media continues to upload one request per selected image or video and then saves all returned URLs in one review request. A synchronous submit lock now prevents rapid clicks from issuing duplicate review creates and causing a false “already reviewed” conflict.

The `npm run dev` command now checks for Node 22 LTS before starting, so Windows Node 24 users receive a clear setup message instead of the repeated `UV_HANDLE_CLOSING` native crash. The package-level Node engine restriction was removed so deployment platforms can select their supported build runtime; `.nvmrc` remains the local development recommendation.

Removed the Vite `closeBundle` hook that called `process.exit(0)`. That forced exit could occur after Vercel reported the build complete but before deployment output upload finished. The normal Vite build lifecycle now completes cleanly; local production build verification passes.

Added a minimal `vercel.json` with the explicit `npm run build` command and `dist` output directory. It leaves API function discovery and runtime selection to Vercel while making the static output path deterministic.

Consolidated the API handlers under `server/api` and added the root `api/[...route].ts` dispatcher. Existing `/api/*` URLs and dynamic `id` parameters are preserved, while Vercel now packages one serverless function instead of exceeding the Hobby plan limit. Local `npm run build` and `npx vercel build --yes` both pass; the generated output contains one function.

Snackbars now automatically dismiss after five seconds while retaining a manual Dismiss action. The duration is centralized as `SNACKBAR_DURATION_MS` in `NotificationProvider`.

## Product-owner backlog

The complete pending security, resilience, feature, and UI backlog is recorded in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md). It is also referenced by [AGENTS.md](AGENTS.md), [CODEX_INSTRUCTIONS.md](CODEX_INSTRUCTIONS.md), and [.github/copilot-instructions.md](.github/copilot-instructions.md). These items remain open; earlier build checks do not constitute production security verification.

## Navigation and header follow-up

The primary navbar now includes Orders for signed-in users and Admin for users with confirmed admin access. Admin access is also confirmed through the protected analytics endpoint when an older session response omits its role field. Duplicate authentication controls were removed from the navbar; sign-in/log-out remains in the header action area. A conflicting CSS rule that hid the final navbar link was removed, so Admin remains visible and active on `/admin`. Build verification passed after this change.

## Session restoration follow-up

Refresh now has an explicit pending session state. Once storefront data is ready, a compact accessible loader remains until `/api/auth/me` settles; navigation and page content mount afterward, preventing a temporary login form or guest navbar on authenticated routes. Login/logout invalidate earlier probes, and effect cleanup ignores stale results. The URL is preserved. Failed or expired session checks retain the existing unauthenticated fallback and request timeout. `npm run build` passed and `npm run lint` completed with existing warnings. Live Vercel refresh verification is pending; the broader session/storage backlog remains open.

The initial `/api/auth/me` probe is now guarded against stale unauthenticated responses. A probe that began before login can no longer overwrite the successful login session, preventing protected cart, wishlist, analytics, and refresh navigation from being incorrectly reset to 401/login. Production build verification passed; live Vercel login/API verification remains required.

## Security implementation started

Added a shared 30-second default timeout with a user-safe timeout error in `src/api/http.ts`. Long-running media uploads and Razorpay provider calls use a 60-second override. Existing storefront, authentication, cart, wishlist, admin, review, tracking, and newsletter API calls use the wrapper. Server-side outbound provider calls use the same policy through `api/_lib/http.ts` (Resend and Twilio use the 30-second default). `tests/http-timeout.test.mjs` verifies default and long-running client cancellation, typed errors, and server provider cancellation; `npm test` passes. Request actions already prevent duplicate submissions while pending. The timeout backlog item is complete for the implemented timeout contract; live deployment monitoring remains an operational follow-up. `npm run build` passes. `npm audit` could not reach the npm advisory endpoint in this environment, so dependency status remains unverified.

## Server-state strategy implementation started

Added `@tanstack/react-query` and a shared `QueryClient` in `src/api/queryClient.ts`. The public storefront/configuration request uses the `['storefront']` query key and the filter-driven shop listing uses a stable `['catalog', filters]` key with a 30-second stale window, five-minute garbage-collection window, one retry, and no focus refetch. Product details/reviews, cart, wishlist, tracking, and current admin reads now use explicit query keys; review/cart mutation results update their query data, and logout clears the client. The complete page-by-page migration map is documented in `PAGE_INVENTORY.md`. The React Query backlog item is complete for all current page server reads; new pages must add a scoped key and invalidation rule before shipping. `npm run build` passes.

## Safe caching completed

Public catalog, category, product, and review GET handlers now send short `public` cache headers. Authenticated user, cart, wishlist, order, tracking, payment, and admin paths send `private, no-store` headers through the shared HTTP/auth helpers. This prevents private responses from being reused across users while allowing limited public catalog caching. `npm run build` passes.

## Dependency audit review

`npm audit --omit=dev` initially reported three high-severity findings through Prisma's transitive `deepmerge-ts@7.1.5` dependency (`GHSA-ggr8-5vv4-36mx`). The approved remediation aligned `prisma` and `@prisma/client` at `6.12.0`; the escalated audit verification now reports `0 vulnerabilities`. `npm run build` and `npm test` pass after regeneration. The dependency-vulnerability backlog item is complete; Prisma should be upgraded together as a pair when a newer compatible security release is approved.

## XSS and input-safety review started

Upload validation increment: both product/admin and customer/review upload endpoints now use one validator for bounded canonical base64, MIME agreement, decoded size, and JPEG/PNG/GIF/WebP/MP4/WebM signatures. HTML/SVG disguised as supported media is rejected before storage; generated UUID filenames and canonical extensions prevent client filenames controlling stored extensions. This follows the layered approach in the [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). This is header/signature validation, not full media decoding, malware scanning, or a complete XSS defense; files with forged valid signatures and directly supplied external media URLs need further review.

Verification: `npm test` passes all 8 timeout/media tests, including supported signature fixtures, spoofed HTML/SVG, MIME mismatches, malformed/empty/truncated inputs, and exact size boundaries. The timeout test import was corrected for the earlier move to `server/api`. `npm run build` passes; lint passes with existing warnings. No real customer records, emails, or Blob uploads were created during verification. Authenticated live upload/playback and final CSP verification remain pending, so the overall security item is not marked complete.

Added server-side URL validation for product, review, image, and video media so only HTTP(S) URLs are persisted, and restricted upload content types to supported image/video formats. React rendering contains no `dangerouslySetInnerHTML` or raw `innerHTML` usage. The XSS backlog item remains open until the full rendered-content review, CSP policy, and authenticated browser verification are complete. `npm run build` passes.
The deployment CSP configuration was removed after it interfered with the Vite React refresh preamble in the active development environment. The source scan still finds no raw HTML rendering, media URLs are HTTP(S)-validated, upload MIME types are restricted, and the production build passes. The XSS item remains open until CSP can be introduced and verified through the actual production host without blocking required flows.
# Page inventory

The implemented route and page list is maintained in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). It covers all routes currently registered in `src/router.tsx`, their owning components, access requirements, and known page-level gaps. Keep it synchronized whenever page behavior changes.
