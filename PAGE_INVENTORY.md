# Page and route inventory

2026-09-25 owner homepage screenshot review: mobile header/navigation occupied excessive vertical space because links wrapped; hero heading and copy were oversized for the viewport and hero art began after a large gap. Source fix tightens the mobile header, keeps navigation horizontally scrollable, reduces hero spacing/art height and improves mobile heading/body sizing. Rendered recheck is still required after the browser review limit clears.

UI handoff: [LUNA_ANALYSIS.md](LUNA_ANALYSIS.md) defines the visual language and full page/component review map; [ASTRA_CHANGES.md](ASTRA_CHANGES.md) records the implementation sequence. The component inventory below is source coverage evidence, not a completion checklist.

2026-09-25 coverage requirement: UI_UX_REVIEW_GUIDE.md now requires a component-to-consumer inventory alongside routes/admin tabs, including page-local controls, notifications and overlays. Record style owner, variants, consumers, applicable states and evidence references when the audit runs. This inventory has not yet been completed; no rendered coverage implied.

2026-09-25 review process: follow UI_UX_REVIEW_GUIDE.md and reconcile this inventory with router/App/admin tabs before each full UI review. Include startup/session states and standalone marketplace routes, not only registered-page table entries. `/products` initial loading now uses card-shaped image, metadata, rating and action skeletons with reduced-motion support; loaded cards now style seller attribution and phone spacing consistently. Rendered phone/tablet/desktop acceptance remains separate. No new browser coverage established.

2026-09-25 catalog sizing refinement: Home, `/products`, and Wishlist share square image sizing; the Products loading skeleton reserves the same content rows as the loaded card, including color swatches and action controls. 2026-09-26 density refinement: the catalog grid auto-fits 230px minimum tracks (up to the shared 260px card cap), while virtualization measures the available catalog width to render the same number of columns; card title-to-price spacing is reduced. Responsive rendered comparison remains pending.

2026-09-26 card readability pass: restored a subtle border and shadow around the card shell. Product title now spans the content width above the price and wishlist row, so short names no longer wrap into single letters beside a long price. Browser and device comparison remain pending.

2026-09-26 wishlist/card consistency refinement: the wishlist control sits beside the title with a quiet outline treatment, away from the product image. Shared cards and the Products skeleton reserve matching compact slots for title/wishlist, seller attribution, discount, rating and swatches, keeping card and add-action sizes aligned within each row. Keyboard focus and phone tap-target rendering remain pending browser/device verification.

2026-09-25 /checkout: phone-first saved-address cards, India eligibility, coupon controls and reusable server-total breakdown. An order attempt freezes the visible cart/address/quote; explicit retries retain the original request. Empty/loading/error/unavailable and persistent submission feedback remain on the page. Payment stays in owned Order Details, now with persistent status feedback. Address creation continues through the shared Profile workflow. Device/browser verification deferred.

2026-09-25 Admin Messages: composition uses shared FormDialog with draft resume and recorded-message view. Close/reopen preserves input while the panel remains mounted; pending submission blocks dismissal. Inline errors and saved/provider-acceptance feedback remain visible. Shared history cards and controls retained; device/keyboard checks deferred.

2026-09-24 Admin Messages: 25-record older/newer history pages and refresh-latest controls replace the latest-100 cutoff. Composer drafts survive navigation; send feedback is session guarded. Rendered/keyboard/mobile acceptance pending.

2026-09-24 mixed-order extension: /admin/fulfillment can manage Gadgify groups within mixed orders; /orders/shipments accepts owned delivered-group returns for those items. Gadgify-only legacy links remain. UI/device verification pending.

2026-09-24 inspection: /admin/fulfillment includes optional per-order quality actions, evidence images and staff call notes. /seller/orders exposes only the authorized shop's shared findings/photos; /orders/shipments exposes status/dispatch hold only. Inspection filtering and status badges are available. Uses the shared drawer and mutation lock with focused ShopInspection styling. Browser/keyboard/mobile and concurrency acceptance remain pending.


2026-09-24: Admin Notifications includes shop shipment/return jobs using existing status and retry controls. Customer/seller fulfillment screens continue to report saved updates independently of email delivery. No email delivery/browser/device verification performed.


2026-09-23 home newsletter: duplicate active email receives a persistent inline “This email is already subscribed.” error plus existing five-second snackbar, retains the email and disables resubmission. Server rejects repeat provider work across requests. Browser/mobile acceptance pending.


2026-09-23: /seller/products adds Manage media storage, showing upload count/bytes, image/video preview, attached/unused status and confirmation before deletion. Shared drawer/pending guards and dedicated responsive CSS are implemented; keyboard, mobile and error-state acceptance remain pending.


2026-09-23: Admin Notifications includes dispute jobs and a missing-private-support-configuration notice without exposing the inbox. Order support drawers retain saved-conversation semantics independently of provider failures. Rendered/device verification is deferred.


2026-09-23: /seller/orders, /orders/shipments and /admin/fulfillment now include support conversation filters and order-specific messages/escalation; only admins resolve. /support and footer show the public configured support contact while directing customers to the form. No mailto redirect to private recipients. Keyboard/mobile/auth checks remain pending.


2026-09-23 publication: /products and /product/:id display seller identity and purchase availability; /shops/:slug links published product details. Seller edits withdraw catalog visibility until approval. Admin seller approval now publishes catalog projections; existing product editor remains for Gadgify. Browser/mobile acceptance pending. See MARKETPLACE_PURCHASING.md.


2026-09-23 fulfillment: /seller/orders now provides scoped shipment actions and return review; /admin/fulfillment provides oversight; /orders/shipments provides owned shop details and return requests. Shared drawers include loading/error/empty states, versioned actions and preserved drafts. Gadgify returns remain on original order details. Authenticated, keyboard and phone acceptance is pending. See SELLER_FULFILLMENT.md.


2026-09-23 marketplace route batch: /seller/products (approved-member drafts/media), /seller/orders (private snapshot-item reads), /admin/seller-products (admin content moderation), /shops and /shops/:slug (approved showcase only). Connected to onboarding/review through SellerNavigation and admin links. Shared drawers, paging and explicit failure/empty/pending states are coded but unverified. No purchasing/payout controls are exposed; see SELLER_WORKSPACE.md.

MP-02 adds /seller (login-required own application/status, rejected revision) and /admin/sellers (administrator paginated review and access decisions). Both use reading-width layouts and shared form drawers. Navigation adds Sell with us and admin Sellers. Approval requires the unapplied ownership migration; device/auth/concurrency acceptance remains pending. See SELLER_ONBOARDING.md.

MP-01: no seller page or route is registered. Shop/ownership foundations and migration are prepared only. Existing storefront/admin routes remain single-store until MP-02–MP-05 add the required seller workflows and enforcement.

Session update 2026-09-22: signed-in routes share activity renewal and last-minute warning; expiry clears private identity/cache. Login issues role-limited sessions; old 30-day cookies require fresh login. Multi-tab/mobile/browser acceptance remains pending; see SESSION_SECURITY.md.

Shared header scroll fix (2026-09-22): all routes, including Support, keep a consistently sticky header with stable height/padding. Scroll state controls only its shadow. Desktop/mobile scrolling acceptance remains pending.

UI priority 2026-09-22: /profile uses personal-detail/address drawers and summary cards. /admin Products/Coupons/Payments use product/category, coupon and refund drawers; small-screen admin navigation is horizontally scrollable. Shared modal focus/scroll and notification placement changed. All affected success/failure/loading/keyboard/device states remain unverified. Numbered UI scope is in APPLICATION_BACKLOG.md.

E33 Admin Payments adds independent loading/error states, explicit full-refund approval/reason and provider verification. Latest 100 selected payment records; no optimistic financial success. Mobile/browser acceptance remains pending; see REFUND_OPERATIONS.md.

E32: Admin Notifications adds queue states, attempt counts, retry eligibility and a guarded processing action. Recipient/payload data remains private. Browser/mobile checks and worker scheduling remain pending; see NOTIFICATION_QUEUE.md.

Reviewed against [src/router.tsx](src/router.tsx) on 2026-09-12. Routing uses browser History API and a component switch, not the react-router package. This lists actual behavior; desired behavior belongs in [REQUIREMENTS.md](REQUIREMENTS.md), and completion is tracked only in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md).

The app waits for storefront/session checks before rendering navigation and route content. The new session loader prevents a temporary guest form while /api/auth/me is pending. Login/logout invalidate older probes. The loader has build evidence; live refresh verification remains pending.

## Registered pages

E31 adds initial server product HTML at `/product/:id` with current metadata/structured data and 404/503 handling; client navigation updates the same metadata. `/sitemap.xml` and `/robots.txt` are public text/XML endpoints through the sole API dispatcher, not React pages. Private route headers and configured-origin checks are added; see SEO_OPERATIONS.md. Runtime/crawler/HMR acceptance remains unverified.

| Route | Component | Access | Current implementation and gaps |
| --- | --- | --- | --- |
| / | HomePage | Public | API catalog slices plus locally configured hero/story/sections and newsletter. Full section CMS pending. |
| /products | ShopPage | Public | Query-backed search/category/sort/color/rating filtering. Shared ProductCard uses edge-to-edge square product images without an outer frame, catalog-color swatches, long-title clamping, fractional `RatingStars`, and optional compare-at markdown only when persisted original price exceeds selling price; checkout continues to use selling price. 300ms debounced cancellable search, explicit error/retry and cursor Load more. Multiple rating bands and database-backed hex swatches implemented (E21); complete catalog facets remain pending. Product pricing migration is prepared but unapplied; generated client/runtime acceptance pending. |
| /product/:id | ProductDetailPage | Public; review writes require session | Product/media/review reads, shared fractional rating stars in the rating summary and review rows, own-review edit pencil and media uploads. Only server reviews are displayed; compact product loader. Live review ownership/media checks pending. |
| /support | SupportPage | Public | Authenticated support form with saved-ticket handling; after creation customers can add private bounded JPEG/PNG attachments. Migrations/scanning/device acceptance pending. |
| /support-requests | SupportPage list | Authenticated for API; guest login guidance | Owned paginated tickets, status/reason, open cancellation, private attachments and paginated replies. Migrations/device acceptance pending. |
| /admin/support | SupportPage admin | Administrator | Paginated tickets, private attachment access, conversations and guarded status/resolution updates; migrations/device acceptance pending. |
| /track-order | TrackOrderPage | Public page; API requires session | Owned order number/internal-ID lookup shows carrier, reference and latest manually recorded events. Live carrier integration remains incomplete. |
| /privacy | PolicyPage (privacy) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /returns | PolicyPage (returns) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /refund-policy | PolicyPage (refund) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /terms | PolicyPage (terms) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
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
| /orders/:id | OrderDetailPage | Authenticated | Private order/items/totals/address/payment/shipment query, discount summary, payment controls and delivered-order return request/status. E30 source is unverified. |
| /admin | AdminPage | Administrator for page content | Products/categories CRUD subset and operational reads; see tab map below. Unauthorized users get login or access-required content. |
| /debug-error | DebugErrorPage | Intentional throw only in development | In production renders a development-only notice. |
| Any unmatched path | NotFoundPage / AdminRedirect | Public fallback | Unknown /admin/* redirects to /admin; other unknown routes show not-found. Invalid encoded IDs are rejected. |

AI flows remain missing; E29 adds shipping/cancellation/cookie policy routes. Reset emails now resolve to /reset-password (E16); /verify-email is registered in E18.

The navbar includes Orders and Profile for authenticated users. Admin visibility now requires verified ADMIN role; the page/API still apply authorization. Final responsive/role-visibility verification is pending.

## Admin tabs

All tabs are component state under /admin, not separate URL routes.

| Tab | Data/behavior |
| --- | --- |
| Overview / Analytics | Reads /api/admin/analytics; renders statistics. |
| Products | Reads products; create/edit, strict category select/add, image/video upload, primary image, colors, stock, archive and immediate list updates. |
| Orders | Reads orders; status selector keeps confirmed values on failure and reconciles on success. E13 guards cancellation/restock and closed states; full fulfillment/production verification pending. |
| Payments | Reads payments and verifies a provider-reported full Razorpay refund (E25); never issues refunds. Legacy manual status action rejected; initiation/partial refunds and live acceptance pending. |
| Returns | Private latest-100 history and guarded review with mandatory reason. E30 adds delivered-order customer submission/status; refund/stock effects, approved eligibility, collection and live acceptance remain pending. |
| Customers | Reads customer data/order counts; no full account-management UI. |
| Messages | Private latest-100 history and transactional email form for verified customers; UUID duplicate protection and accepted/unconfirmed feedback (E24). Provider/device acceptance and durable delivery tracking remain pending. |
| Feedback | Private latest-100 first-purchase ratings/comments/order numbers (E28); unapplied migration and owner/device acceptance pending. |
| Settings | Private settings query and validated checkout fee/tax/availability editor (E23); broader store configuration remains incomplete. |
| Coupons | Draft/activate/archive, dates, minimums, caps, usage limits and checkout redemption configuration; E30 checks/business approval pending. |
| Shipments | Guarded carrier/reference/status updates and customer-visible event history; external carrier integration pending. |
| Notifications | Private order-email attempt history with accepted/unconfirmed semantics; durable retry/delivery tracking pending. |

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


E29: existing policy pages now query published-only text in the selected language, with loading/error/unpublished states. Added /shipping, /cancellation and /cookies under the reading layout, with footer links. Admin Policies saves drafts and explicitly publishes approved text with version/history/audit. No approved copy or consent completion is implied.

## Component coverage inventory - first source batch (2026-09-25)

| Component/style owner | Consumers and variants | Findings / evidence |
| --- | --- | --- |
| SiteLayout / PageContainer / layout-and-feedback.css | All routed pages; form/reading/content/wide widths, header/footer | Central gutters aligned to 16/24/32px; page-specific inner spacing still needs review. Source only. |
| controls.css primary/secondary buttons | Shared class consumers across storefront, cart, checkout, profile, seller/admin and dialogs | Three competing base definitions replaced with one. Shared padding, typography, radius, wrapping and touch size. Contextual selectors need consumer review. Source only. |
| index.css tokens | Global control and typography foundations | Added font family, 44px control and missing spacing tokens. Legacy hard-coded typography remains for later batches. |
| NotificationProvider / layout-and-feedback.css | Global snackbars including dialog portal; error/success/info | Dismiss target now at least 44px. Existing queue, five-second lifetime and announcements preserved. Overlay/phone checks pending. |
| FormDialog / FormDialog.css | Contextual editors across account, commerce and marketplace | Existing shared implementation identified; focus/backdrop/notification combinations require rendered review. |
| record-cards.css / feature cards | Record lists, product/order cards | Shared record style exists; other card variants not yet fully inventoried. |

This is a partial source inventory, not completed component or route acceptance. Continue with startup/loading, fields, cards and page-local controls per UI_UX_REVIEW_GUIDE.md.
