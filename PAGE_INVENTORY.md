# Page and route inventory

Reviewed against [src/router.tsx](src/router.tsx) on 2026-09-12. Routing uses browser History API and a component switch, not the react-router package. This lists actual behavior; desired behavior belongs in [REQUIREMENTS.md](REQUIREMENTS.md), and completion is tracked only in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md).

The app waits for storefront/session checks before rendering navigation and route content. The new session loader prevents a temporary guest form while /api/auth/me is pending. Login/logout invalidate older probes. The loader has build evidence; live refresh verification remains pending.

## Registered pages

| Route | Component | Access | Current implementation and gaps |
| --- | --- | --- | --- |
| / | HomePage | Public | API catalog slices plus locally configured hero/story/sections and newsletter. Full section CMS pending. |
| /products | ShopPage | Public | Query-backed search/category/sort/color/rating filtering. 300ms debounced cancellable search, explicit error/retry and cursor Load more. Multiple rating bands and database-backed hex swatches implemented (E21); complete catalog facets remain pending. |
| /product/:id | ProductDetailPage | Public; review writes require session | Product/media/review reads, own-review edit pencil, media uploads. Only server reviews are displayed; compact product loader. Live review ownership/media checks pending. |
| /support | SupportPage | Public | Authenticated support form with saved-ticket and conditional receipt handling (E22); migration/provider acceptance and attachments pending. |
| /support-requests | SupportPage list | Authenticated for API; guest login guidance | Owned paginated tickets, status/reason and open cancellation; migration/device acceptance pending. |
| /admin/support | SupportPage admin | Administrator | Paginated tickets and guarded status/resolution updates; migration/device acceptance pending. |
| /track-order | TrackOrderPage | Public page; API requires session | Guarded pending lookup accepts owned order number or internal ID; handles not-found and request errors. Provider integration remains incomplete. |
| /privacy | PolicyPage (privacy) | Public | Placeholder asking for approved content. |
| /returns | PolicyPage (returns) | Public | Placeholder asking for approved content. |
| /refund-policy | PolicyPage (refund) | Public | Placeholder asking for approved content. |
| /terms | PolicyPage (terms) | Public | Placeholder asking for approved content. |
| /terms-and-conditions | PolicyPage (terms) | Public | Terms alias. |
| /login | AuthPage (login) | Public | Password login by email/mobile identifier. Authenticated visitors render HomePage at this path. |
| /signup | AuthPage (signup) | Public | Registration with email/mobile selection. Email-verification and password-recovery pages exist; mobile OTP UI remains pending. |
| /forgot-password | PasswordRecoveryPage (forgot) | Public | Email-based recovery request, neutral acknowledgment, pending/error states and failed draft retention; owner delivery/mobile acceptance pending (E16). |
| /reset-password | PasswordRecoveryPage (reset) | Public; one-time token authorizes reset | New/confirmed password, missing-link recovery, fragment/legacy query support, session revocation and normal login after success; owner acceptance pending (E16). |
| /verify-email | EmailVerificationPage | Public token confirmation; session required for status/resend | Explicit confirmation, safe token URL cleanup, verified status, owned resend, pending/errors; owner mobile/provider acceptance pending (E18). |
| /profile | ProfilePage / ProfileForms | Signed-in customers and admins; guests see login | Personal details, password-confirmed phone change, read-only email/status/recovery links, owned address CRUD/default and order-use protection. Offline scope E19; owner device/production acceptance pending. |
| /help | HelpPage / SiteTour | Public; tour destinations retain normal auth gates | Help disclosures and five-step explicit route tour with back/next/exit, memory-only state and no writes (E27). Device/focus/localization acceptance pending. |
| /cart | CartPage | Authenticated | Shared header/page query with optimistic quantity/removal, per-product locks, affected-row rollback and checkout guard while saving. |
| /wishlist | WishlistRedirect | Public redirect | Temporarily hidden by request; replaces the URL with /products. Header link removed. WishlistPage is retained but inactive; product hearts and saved-item APIs remain available. |
| /checkout | PaymentPage | Authenticated | Real cart/address selection, private server quote and idempotent order submission when explicitly configured; navigates to order payment (E23). |
| /orders | OrdersPage | Authenticated | Private paginated customer history with stored totals/items/status and loading/empty/error/retry states (E20); owner mobile/production acceptance pending. |
| /orders/:id | OrderDetailPage | Authenticated | Private real order/items/totals/address/payment/shipment query; eligible pending Razorpay orders have guarded payment controls (E23). |
| /admin | AdminPage | Administrator for page content | Products/categories CRUD subset and operational reads; see tab map below. Unauthorized users get login or access-required content. |
| /debug-error | DebugErrorPage | Intentional throw only in development | In production renders a development-only notice. |
| Any unmatched path | NotFoundPage / AdminRedirect | Public fallback | Unknown /admin/* redirects to /admin; other unknown routes show not-found. Invalid encoded IDs are rejected. |

Missing pages include AI flows and shipping/cancellation/cookie policy pages. Reset emails now resolve to /reset-password (E16); /verify-email is registered in E18.

The navbar includes Orders and Profile for authenticated users. Admin visibility now requires verified ADMIN role; the page/API still apply authorization. Final responsive/role-visibility verification is pending.

## Admin tabs

All tabs are component state under /admin, not separate URL routes.

| Tab | Data/behavior |
| --- | --- |
| Overview / Analytics | Reads /api/admin/analytics; renders statistics. |
| Products | Reads products; create/edit, strict category select/add, image/video upload, primary image, colors, stock, archive and immediate list updates. |
| Orders | Reads orders; status selector keeps confirmed values on failure and reconciles on success. E13 guards cancellation/restock and closed states; full fulfillment/production verification pending. |
| Payments | Reads payments and verifies a provider-reported full Razorpay refund (E25); never issues refunds. Legacy manual status action rejected; initiation/partial refunds and live acceptance pending. |
| Returns | Private latest-100 real history and guarded requested-to-approved/rejected review with mandatory reason (E26). No refund/stock effects; customer submission, logistics and live acceptance pending. |
| Customers | Reads customer data/order counts; no full account-management UI. |
| Messages | Private latest-100 history and transactional email form for verified customers; UUID duplicate protection and accepted/unconfirmed feedback (E24). Provider/device acceptance and durable delivery tracking remain pending. |
| Feedback | Private latest-100 first-purchase ratings/comments/order numbers (E28); unapplied migration and owner/device acceptance pending. |
| Settings | Private settings query and validated checkout fee/tax/availability editor (E23); broader store configuration remains incomplete. |

## Server-state coverage

| Area | Implemented data boundary | Remaining |
| --- | --- | --- |
| Storefront/Home | ['storefront'] plus API categories/products merged with local config | Full catalog facets and independent CMS sections |
| Shop | ['catalog', filters] | Progressive cursor consumption and robust error states |
| Product/reviews | ['product', id], ['product-reviews', id], privateKey('my-review', id) | Product revalidation and account-scoped own-review key implemented; live review/media acceptance remains |
| Cart/wishlist | privateKey('cart') shared header/page hook; private wishlist query and memory-only hearts | Live browser account-switch acceptance; deferred wishlist page completeness |
| Orders/detail/checkout | Orders uses privateKey(orders) and paginated API history | Detail uses privateKey(order,id); checkout uses shared cart/profile plus privateKey(checkout,cartRevision). Provider/device acceptance pending |
| Tracking | privateKey('tracking', enteredId) | Owned ID/number mapping, pending/errors and private keys implemented; provider/browser verification remains |
| Login/signup/session | Mutation/session state and direct /api/auth/me | Verification pages, mobile-only recovery and full session lifecycle acceptance |
| Admin | privateKey('admin', section) via fetchQuery, zero stale/gc retention | Functional messages/settings, role/account transition verification |

React Query is the chosen strategy. Existing private resources use account/generation keys; confirmed logout cancels/removes private cache and resets route-local/optimistic state. Orders/detail/checkout now use private queries; full migration and live account/device acceptance are not claimed.

## Shared page behavior

E10 source formatting covers all page components; routing, access rules and UI behavior in this inventory are unchanged. A formatter pass is not page integration or responsive verification.

Mobile-first acceptance applies to every registered page and admin tab: phone widths 320–430px, portrait/landscape, software keyboard, touch controls, safe-area/overlay clearance and slow/offline states, followed by tablet/desktop checks. The owner confirms most customers use phones. Use the audit's detailed matrix and record per-page/device evidence before completing responsiveness.

[ARCHITECTURE_UI_UX_AUDIT.md](ARCHITECTURE_UI_UX_AUDIT.md) supplies the target width variants, spacing scale and per-page migration/acceptance matrix for every route above and each admin tab. E11 implements PageContainer width variants and shared spacing/touch/mobile foundations across these routes; individual rendered acceptance remains pending. Source review alone does not establish rendered spacing, accessibility or responsive acceptance.

Action outcomes use [five-second snackbars](NOTIFICATION_GUIDELINES.md). Failed inputs remain; successful product creation resets its form. Product/review uploads use shared byte/MIME/signature validation. Rate-limit errors use translated retry guidance and suppress automatic retries. See [required database rollout](RATE_LIMITING.md) before deploying these write policies.

When a route, page, access rule or data boundary changes, update this inventory and [PROJECT_STATUS.md](PROJECT_STATUS.md) in the same change. Update the corresponding backlog status only after its acceptance criteria are implemented and verified.

E11 applies the common layout to every registered route: wide for home/catalog/admin, content for cart/orders/checkout/product, reading for support/tracking/policies, form for authentication. Phone navigation wraps, filter fields collapse behind an accessible disclosure, social links move to footer, and form inputs use 16px text. Admin panels have explicit loading/error/retry and sequential upload progress with retry reuse. Auth no longer collects an unused address. These are implementation descriptions, not real-device certification.

E13 changes the Admin Orders status interaction only; no new route or customer checkout integration is claimed. Closed-order selectors are disabled and new cancellation is offered only for PENDING/CONFIRMED orders. Server authorization and transactional state guards remain authoritative. The owner handles production/mobile acceptance; Codex uses offline validation without .env inspection.

E14 adds shared CSRF preparation to existing login/signup, newsletter, cart/hearts, review/media and admin write interactions through apiFetch; no page route or layout changes. GET /api/auth/csrf is an API bootstrap, not a customer page. Reads including /me stay unchanged. Pending feedback, failed drafts and five-second snackbars remain under existing page controls. Owner production/mobile acceptance is pending; see [CSRF_PROTECTION.md](CSRF_PROTECTION.md).

E15 updates the Home newsletter interaction only: structured/legacy API errors reach the existing snackbar, failed email input stays intact, synchronous duplicate submits are blocked and the confirmed Subscribed button stays disabled. Success copy contains no provider-configuration instructions. No route or CSS/layout changes. Offline component/transport fixtures verify this bounded behavior; owner rendered/mobile/provider acceptance remains pending. Malformed server API paths now receive safe JSON errors; client-page fallback behavior is unchanged.

E16 adds Forgot password and Reset password using PasswordRecoveryPage within the existing shared form-width layout. Login includes the recovery link and displays sign-in guidance after reset. States include neutral email acknowledgment, missing/invalid link recovery, matching-password validation, pending/duplicate locks, preserved failed drafts and server-confirmed login navigation. Unmount cancels transport; no mutation retries. Tokens are removed from the visible URL after capture.

| Added route | Required owner acceptance |
| --- | --- |
| /forgot-password | Email input/keyboard, pending, neutral success, 429/offline failure, retained email and explicit new request on 320-430px phones |
| /reset-password | Fragment/legacy-query link, missing/expired/used token, confirmation mismatch, password manager, pending/errors, focus, session revocation and normal login |

These states have source/component-fixture evidence, not rendered Android/iOS or provider acceptance. See PASSWORD_RECOVERY.md and PROJECT_STATUS E16.


E17 home newsletter: persisted subscriptions with failed confirmation now show Subscribed and an informational notice. Other signup failures preserve the address. No route or layout changes. Component-fixture evidence covers reconciliation; owner phone/browser/provider acceptance remains pending.


E18 adds the Account email header link for signed-in customers/admins. Verify /verify-email as guest, unverified/verified account, email-less mobile account, invalid/expired/used token and slow/429/offline responses. Header wrapping and new page keyboard/focus/320-430px acceptance are owner-owned and pending.


E19: Profile replaces the Account email header link; email verification remains reachable from Profile and email links. Admin Settings continues to configure the store. Profile uses the existing form-width PageContainer. Owner matrix includes customer/admin/guest, no email/phone/address, default switching, addresses referenced by orders, wrong password, conflicts, pending/duplicate actions, account switch and phone keyboard/focus/reflow. Source and synthetic fixtures do not certify rendered responsiveness.


E28 Orders and captured/refunded Order Details include an independent first-purchase feedback form/status. Feedback failures do not block the order page. Admin Feedback is a separate read-only tab; see PURCHASE_FEEDBACK.md for migration and acceptance.
