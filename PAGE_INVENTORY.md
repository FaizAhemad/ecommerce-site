# Page and route inventory

Reviewed against [src/router.tsx](src/router.tsx) on 2026-09-12. Routing uses browser History API and a component switch, not the react-router package. This lists actual behavior; desired behavior belongs in [REQUIREMENTS.md](REQUIREMENTS.md), and completion is tracked only in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md).

The app waits for storefront/session checks before rendering navigation and route content. The new session loader prevents a temporary guest form while /api/auth/me is pending. Login/logout invalidate older probes. The loader has build evidence; live refresh verification remains pending.

## Registered pages

| Route | Component | Access | Current implementation and gaps |
| --- | --- | --- | --- |
| / | HomePage | Public | API catalog slices plus locally configured hero/story/sections and newsletter. Full section CMS pending. |
| /products | ShopPage | Public | Query-backed search/category/sort/color/rating filtering. API returns nextCursor but UI does not load subsequent pages. Rating radios and CSS color swatches remain. |
| /product/:id | ProductDetailPage | Public; review writes require session | Product/media/review reads, own-review edit pencil, media uploads. Generated fallback reviews remain. Live review ownership/media checks pending. |
| /support | SupportPage | Public | Email/phone links via mailto/tel. No support ticket form or Resend support submission. |
| /track-order | TrackOrderPage | Public page; API requires session | Manual tracking query; UI prompts for order number while API expects internal order ID. Error handling/provider integration incomplete. |
| /privacy | PolicyPage (privacy) | Public | Placeholder asking for approved content. |
| /returns | PolicyPage (returns) | Public | Placeholder asking for approved content. |
| /refund-policy | PolicyPage (refund) | Public | Placeholder asking for approved content. |
| /terms | PolicyPage (terms) | Public | Placeholder asking for approved content. |
| /terms-and-conditions | PolicyPage (terms) | Public | Terms alias. |
| /login | AuthPage (login) | Public | Password login by email/mobile identifier. Authenticated visitors render HomePage at this path. |
| /signup | AuthPage (signup) | Public | Registration with email/mobile selection. OTP/verification/reset customer UI incomplete. |
| /cart | CartPage | Authenticated | API-backed line items and quantity/removal, query cache updates. |
| /wishlist | WishlistPage | Authenticated | API IDs/local optimistic state; displays only products present in initial storefront data. |
| /checkout | PaymentPage | Authenticated | Placeholder totals from first catalog products; informational snackbar on submit, no payment/order creation. |
| /orders | OrdersPage | Authenticated | Static empty state/count; does not query order history. |
| /orders/:id | OrderDetailPage | Authenticated | Catalog-derived placeholder items and hardcoded delivered/paid details; does not fetch this order. |
| /admin | AdminPage | Administrator for page content | Products/categories CRUD subset and operational reads; see tab map below. Unauthorized users get login or access-required content. |
| /debug-error | DebugErrorPage | Intentional throw only in development | In production renders a development-only notice. |
| Any unmatched path | HomePage fallback | Public fallback | Includes unknown /admin/* paths. No parent-route redirect/not-found handling yet. |

Missing pages include profile/address management, password reset, email verification, support request tracking, AI/tour/help flows, and shipping/cancellation/cookie policy pages. Auth emails reference /reset-password and /verify-email, but those routes are not registered.

The navbar includes Orders for authenticated users. Admin visibility currently uses authenticated state plus either admin state or current /admin path; the page/API still apply authorization. Final responsive/role-visibility verification is pending.

## Admin tabs

All tabs are component state under /admin, not separate URL routes.

| Tab | Data/behavior |
| --- | --- |
| Overview / Analytics | Reads /api/admin/analytics; renders statistics. |
| Products | Reads products; create/edit, strict category select/add, image/video upload, primary image, colors, stock, archive and immediate list updates. |
| Orders | Reads orders; status controls use admin update handler. Full fulfillment verification pending. |
| Payments | Reads payment data; refund handler currently changes database status only, not provider funds. |
| Returns | Reads returns; complete workflow remains pending. |
| Customers | Reads customer data/order counts; no full account-management UI. |
| Messages | Unconnected form; Send message button has no handler. |
| Settings | Fetches settings; informational panel rather than full settings editor. |

## Server-state coverage

| Area | Implemented data boundary | Remaining |
| --- | --- | --- |
| Storefront/Home | ['storefront'] plus API categories/products merged with local config | Full catalog facets and independent CMS sections |
| Shop | ['catalog', filters] | Progressive cursor consumption and robust error states |
| Product/reviews | ['product', id], ['product-reviews', id], ['my-review', id] | Cached initial product fallback, account-scoped private key, remove generated feedback |
| Cart/wishlist | ['cart'], ['wishlist'] and direct header/optimistic calls | Explicit user isolation, missing catalog items and cross-tab handling |
| Orders/detail/checkout | No page API read | Connect actual orders, totals and checkout |
| Tracking | ['tracking', enteredId] | ID/number mapping, errors and authenticated isolation |
| Login/signup/session | Mutation/session state and direct /api/auth/me | Verification/reset pages and full session lifecycle tests |
| Admin | ['admin', section] via fetchQuery, zero stale/gc retention | Functional messages/settings, role/account transition verification |

React Query is the chosen strategy, not RTK. Logout clears the client; not all private keys are user-scoped. No claim of complete migration follows from this map.

## Shared page behavior

Action outcomes use [five-second snackbars](NOTIFICATION_GUIDELINES.md). Failed inputs remain; successful product creation resets its form. Product/review uploads use shared byte/MIME/signature validation. Rate-limit errors use translated retry guidance and suppress automatic retries. See [required database rollout](RATE_LIMITING.md) before deploying these write policies.

When a route, page, access rule or data boundary changes, update this inventory and [PROJECT_STATUS.md](PROJECT_STATUS.md) in the same change. Update the corresponding backlog status only after its acceptance criteria are implemented and verified.
