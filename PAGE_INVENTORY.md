# Page and route inventory

2026-09-27 Orders empty-state CTA: its dark Tailwind anchor inherited the global link color and rendered without readable content. It now uses the shared primary-button variant, with a text fallback if the configured continue-shopping label is empty. Other dark CTA matches were checked: they are actual buttons or already use the shared primary variant, so link inheritance does not affect them. Rendered/mobile acceptance remains pending.

2026-09-27 launch navigation and Orders pass: shared header now shows Home, Products, Orders and Support for all roles; admin/seller/profile/shop links are removed from the primary navigation, and the tour targets only visible routes (Orders appears for signed-in users). `/orders` now uses Tailwind for responsive order cards and explicit loading/error/empty/pagination states, with direct order-detail and track links. Product Details uses the same shared cart action as catalog cards. Local route and phone review remain pending.

2026-09-28 shared cart action refinement: AddToCartButton uses the muted sage surface with a clearer plus action; the quantity group has semantic remove styling, quieter minus action, and a differentiated count display across ProductCard, Product Details and Cart. All variants use 48px height and 44px icon targets; rendered/device acceptance pending.

2026-09-27 ProductCard rating empty state: cards with genuine reviews show the persisted average and review count; products without reviews show a compact `No reviews yet` label instead of empty stars and a fabricated-looking `0.0` score. Local desktop check pending after HMR; phone/tablet and automated verification remain pending.

2026-09-27 ProductCard optional data: absent seller attribution now takes no space, and fallback `Default` color metadata no longer appears as a product swatch; only named color variants render. Compare-at details remain conditional on valid saved pricing, while the CTA stays bottom-aligned. Local Products desktop screenshot checked; phone/tablet and automated verification remain pending.

2026-09-27 Home/catalog merchandising: Home uses a product-led generated hero and catalog-facet category links; Products promo slides use separate imagery for Home & Kitchen, practical gadgets and playful accessories/toys. Products category query parameters seed and track the selected facet. Local desktop visual check confirmed the page/campaign artwork loads; full slide-by-slide, phone and tablet acceptance remains pending.

2026-09-26 typography foundation: one shared system sans family now backs the body/display tokens, Tailwind `font-sans`, legacy page styles and native form controls. Font sizes/weights continue to set hierarchy. Route-by-route rendered and device review remains pending.

2026-09-27 shared header: navigation spacing is responsive, Home uses consistent title case, Log out is compact and sentence case, and Search opens a focused popover with labeled submit/close actions, Escape dismissal and focus return for both close paths. Global keyboard focus is a thinner two-pixel outline; search input uses a restrained border/glow. Desktop browser interaction checked locally; full route and phone/tablet review remains pending.

2026-09-27 ProductCard cart pending state: per-product intent labels distinguish Adding, Removing and Updating after optimistic quantity changes; the plus affordance is hidden during busy requests. The reported last-item removal was reproduced; the fix is source-only, and verification remains pending.

2026-09-26 product cart action: cards on Home, Products and Wishlist read the shared private cart query and expose remove at quantity one, decrement at higher quantities, plus increment, and an animated count. Per-product pending state disables actions; no duplicate write or separate client quantity store was added. Browser interaction, rollback and phone acceptance remain pending.

2026-09-25 owner homepage screenshot review: mobile header/navigation occupied excessive vertical space because links wrapped; hero heading and copy were oversized for the viewport and hero art began after a large gap. Source fix tightens the mobile header, keeps navigation horizontally scrollable, reduces hero spacing/art height and improves mobile heading/body sizing. Rendered recheck is still required after the browser review limit clears.

UI handoff: [LUNA_ANALYSIS.md](LUNA_ANALYSIS.md) defines the visual language and full page/component review map; [ASTRA_CHANGES.md](ASTRA_CHANGES.md) records the implementation sequence. The component inventory below is source coverage evidence, not a completion checklist.

2026-09-25 coverage requirement: UI_UX_REVIEW_GUIDE.md now requires a component-to-consumer inventory alongside routes/admin tabs, including page-local controls, notifications and overlays. Record style owner, variants, consumers, applicable states and evidence references when the audit runs. This inventory has not yet been completed; no rendered coverage implied.

2026-09-25 review process: follow UI_UX_REVIEW_GUIDE.md and reconcile this inventory with router/App/admin tabs before each full UI review. Include startup/session states and standalone marketplace routes, not only registered-page table entries. `/products` initial loading now uses card-shaped image, metadata, rating and action skeletons with reduced-motion support; loaded cards now style seller attribution and phone spacing consistently. Rendered phone/tablet/desktop acceptance remains separate. No new browser coverage established.

2026-09-25 catalog sizing refinement: Home, `/products`, and Wishlist share square image sizing; the Products loading skeleton reserves the same content rows as the loaded card, including color swatches and action controls. 2026-09-26 density refinement: the catalog grid auto-fits 230px minimum tracks (up to the shared 260px card cap); card title-to-price spacing is reduced. Products pagination loads bounded cursor pages and renders loaded cards in normal CSS grid flow to keep row heights and page scroll stable. Responsive rendered comparison remains pending.

2026-09-26 card readability pass: restored a subtle border and shadow around the card shell. Product title now spans the content width above the price and wishlist row, so short names no longer wrap into single letters beside a long price. Browser and device comparison remain pending.

2026-09-26 wishlist/card consistency refinement: the wishlist control sits beside the title with a quiet outline treatment, away from the product image. Shared cards and the Products skeleton reserve matching compact slots for title/wishlist, seller attribution, discount, rating and swatches, keeping card and add-action sizes aligned within each row. Keyboard focus and phone tap-target rendering remain pending browser/device verification.

2026-09-27 catalog filters: category matching now requires every meaningful category word using case-insensitive substring checks, tolerating punctuation, casing and spacing differences in free-text category values; color matching ignores case. The filter heading is insulated from the legacy global `h2` size rule, and the clear action now has compact text while retaining a 44px touch target. Tailwind utilities still style the native search/select/checkbox controls; the phone drawer remains Radix-backed. API query fixture passes; local API/data and rendered/device acceptance remain pending.

2026-09-26 styling migration: Tailwind v4 utilities now own the Products catalog layout, promo banner, shared ProductCard, filter controls, loading/empty states and wishlist placement. Desktop filters remain sticky in an aside; phone filters open in a Radix Dialog Sheet with focus trapping/restoration and a visible close/done action. Existing global theme variables remain the brand source; other routes and Admin remain on the legacy stylesheet pending their migration. Build/source verification is distinct from browser/device visual acceptance.

2026-09-27 automatic pagination: `/products` observes a small sentinel after the grid and fetches the next cursor page before it reaches the viewport; the query key carries active search/category/sort/color/rating filters, so each filtered collection paginates independently. A synchronous lock prevents duplicate requests, failures retain loaded cards and show a retry action, and a manual fallback appears only if IntersectionObserver is unavailable. Active loading now uses a compact branded status panel with a reduced-motion spinner and explanatory copy. Browser/device acceptance remains pending.

2026-09-26 shared product-card affordance: pointer cursors identify the clickable image/title, wishlist, and add-to-cart controls across Home, Products, and Wishlist; disabled actions use a not-allowed cursor. Blank card areas remain non-clickable. Rendered interaction acceptance remains pending.

2026-09-26 shared product-card type hierarchy: titles use a semibold sans face in the deep brand color; selling price is emphasized, original price is muted/struck through, and valid savings use a quiet green pill. Only configured compare-at prices produce discount messaging. Contrast and long-text rendering remain pending.

2026-09-26 grid scroll regression correction: after screenshot evidence showed the row measurement patch still allowed cards to jump during scroll, removed absolute-position virtualization. `ProductGrid` now shares the ProductCard across Home and Products and lets CSS grid size rows naturally; Products loads additional cursor pages automatically as the customer scrolls. Rendered acceptance remains pending.

2026-09-26 Home CTA contrast: global inherited anchor color no longer overrides the shared primary/secondary button colors on CTA links. The Home “Explore the collection” action now uses the common high-contrast primary treatment; rendered contrast acceptance remains pending.

2026-09-25 /checkout: phone-first saved-address cards, India eligibility, coupon controls and reusable server-total breakdown. An order attempt freezes the visible cart/address/quote; explicit retries retain the original request. Empty/loading/error/unavailable and persistent submission feedback remain on the page. Payment stays in owned Order Details, now with persistent status feedback. Address creation continues through the shared Profile workflow. Device/browser verification deferred.

2026-09-25 Admin Messages: composition uses shared FormDialog with draft resume and recorded-message view. Close/reopen preserves input while the panel remains mounted; pending submission blocks dismissal. Inline errors and saved/provider-acceptance feedback remain visible. Shared history cards and controls retained; device/keyboard checks deferred.

2026-09-24 Admin Messages: 25-record older/newer history pages and refresh-latest controls replace the latest-100 cutoff. Composer drafts survive navigation; send feedback is session guarded. Rendered/keyboard/mobile acceptance pending.

2026-09-24 mixed-order extension: /admin/fulfillment can manage Gadgify groups within mixed orders; /orders/shipments accepts owned delivered-group returns for those items. Gadgify-only legacy links remain. UI/device verification pending.

2026-09-24 inspection: /admin/fulfillment includes optional per-order quality actions, evidence images and staff call notes. /seller/orders exposes only the authorized shop's shared findings/photos; /orders/shipments exposes status/dispatch hold only. Inspection filtering and status badges are available. Uses the shared drawer and mutation lock with focused ShopInspection styling. Browser/keyboard/mobile and concurrency acceptance remain pending.


2026-09-24: Admin Notifications includes shop shipment/return jobs using existing status and retry controls. Customer/seller fulfillment screens continue to report saved updates independently of email delivery. No email delivery/browser/device verification performed.


2026-09-27 Home newsletter duplicate state: the existing address remains editable while already subscribed; editing it clears the duplicate state and re-enables Submit. A confirmed new subscription still locks the completed form. Component fixture coverage added; rendered/mobile acceptance remains pending.

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

The app waits for storefront/session checks before rendering navigation and route content. The new session loader prevents a temporary guest form while /api/auth/me is pending. Login/logout invalidate older probes. The fixed startup scene keeps Gadgify branding visible with four decorative, reduced-motion-aware product-art tiles and customer-facing loading copy; it does not change session checks. Build evidence is available; rendered/mobile and live refresh verification remain pending.

## Registered pages

E31 adds initial server product HTML at `/product/:id` with current metadata/structured data and 404/503 handling; client navigation updates the same metadata. `/sitemap.xml` and `/robots.txt` are public text/XML endpoints through the sole API dispatcher, not React pages. Private route headers and configured-origin checks are added; see SEO_OPERATIONS.md. Runtime/crawler/HMR acceptance remains unverified.

| Route | Component | Access | Current implementation and gaps |
| --- | --- | --- | --- |
| / | HomePage / SiteTour | Public | API catalog slices plus locally configured hero/story/sections and newsletter. The explicit route tour points to the current Home navigation link. Full section CMS pending. |
| /shops | ShopsPage / SiteTour | Public | Shop discovery and shop detail routes. The explicit route tour points to the current Shops navigation link. |
| /seller | SellerPage / SiteTour | Signed-in | Seller workspace entry. The explicit route tour includes Sell with us for signed-in customers and points to its current navigation link. |
| /products | ShopPage / SiteTour | Public | Query-backed search/category/sort/color/rating filtering. Shared ProductCard uses edge-to-edge square product images without an outer frame, catalog-color swatches, long-title clamping, fractional `RatingStars`, and optional compare-at markdown only when persisted original price exceeds selling price; checkout continues to use selling price. 300ms debounced cancellable search, explicit initial-load error/retry and automatic cursor pagination on scroll with a next-page retry state. During the explicit route tour, the active Products navigation link is highlighted and pointed to; Next navigates to Cart for signed-in users. Multiple rating bands and database-backed hex swatches implemented (E21); complete catalog facets remain pending. Product pricing migration is prepared but unapplied; generated client/runtime acceptance pending. |
| /product/:id | ProductDetailPage | Public; review writes require session | Product/media/review reads, shared fractional rating stars in the rating summary and review rows, own-review edit pencil and media uploads. Product image magnifies 2.2× around the mouse pointer; click/tap or keyboard activation opens the media lightbox. Video thumbnails open in the lightbox without replacing the primary image; empty summaries explicitly show 0.0 with 0 ratings / 0 reviews, and the duplicate short divider below Latest reviews was removed. The server-rendered SEO handoff before app startup is styled to match the storefront and includes a responsive lead image. A consistent divider separates the rating distribution from latest reviews; own-review editing uses a labeled, touch-sized secondary button. Failed images are removed from lightbox navigation, shown as unavailable and cannot be zoomed; missing media remains a non-interactive placeholder. The main image fills its rounded viewport without the exposed tone frame. Product summary, rating distribution, review rows and the bounded review form use Tailwind spacing and controls. Gallery, ratings and review form align to the catalog container and gutters. Source-reviewed; rendered/mobile zoom and review states remain unverified. |
| /support | SupportPage / SiteTour | Public | Unified Support and Help center aligned to the shared wide PageContainer and page gutters: quick links, help topics, explicit interactive route tour started only by the customer, support contact, guest sign-in guidance, and authenticated private support form with saved-ticket handling and bounded JPEG/PNG attachments. Tour highlights and points to the active Support navigation link; destination-labeled Next controls navigate to the next route. Title/copy rhythm uses shared spacing steps. Whole-app spacing audit, rendered tour/mobile interaction and ticket migration/scanning acceptance remain pending. |
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
| /profile | ProfilePage / ProfileForms / SiteTour | Signed-in customers and admins; guests see login | Personal details, password-confirmed phone change, read-only email/status/recovery links, owned address CRUD/default and order-use protection. During the explicit route tour, the active Profile navigation link is highlighted and pointed to. Offline scope E19; owner device/production acceptance pending. |
| /cart | CartPage / SiteTour | Authenticated | Shared header/page query with optimistic quantity/removal, per-product locks, affected-row rollback and checkout guard while saving. Product thumbnails use ordered image metadata, open in an accessible modal preview, and fall back safely on missing/failed images. Quantity controls reuse AddToCartButton. Item list and order summary use responsive Tailwind layout, with a sticky desktop summary and stacked phone layout. During the explicit route tour, the active Cart header control is highlighted and pointed to. Loading/error/empty states are styled; rendered phone/tablet/keyboard review remains pending. |
| /wishlist | WishlistRedirect | Public redirect | Temporarily hidden by request; replaces the URL with /products. Header link removed. WishlistPage is retained but inactive; product hearts and saved-item APIs remain available. |
| /checkout | PaymentPage | Authenticated | Real cart/address selection, private server quote and idempotent order submission when explicitly configured; navigates to order payment (E23). |
| /orders | OrdersPage / SiteTour | Authenticated | Private paginated customer history with stored totals/items/status, Tailwind loading/empty/error/retry states, responsive order cards, and links to owned order details and tracking (E20). During the explicit route tour, the active Orders navigation link is highlighted and pointed to; rendered/device/production acceptance pending. |
| /orders/:id | OrderDetailPage | Authenticated | Private order/items/totals/address/payment/shipment query, discount summary, payment controls and delivered-order return request/status. E30 source is unverified. |
| /admin | AdminPage / SiteTour | Administrator for page content | Products/categories CRUD subset and operational reads; see tab map below. Authorized administrators get tour steps for Admin, Support requests and Sellers; unauthorized users get login or access-required content. |
| /debug-error | DebugErrorPage | Intentional throw only in development | In production renders a development-only notice. |
| Any unmatched path | NotFoundPage / AdminRedirect | Public fallback | Unknown /admin/* redirects to /admin; other unknown routes show not-found. Invalid encoded IDs are rejected. |

AI flows remain missing; E29 adds shipping/cancellation/cookie policy routes. Reset emails now resolve to /reset-password (E16); /verify-email is registered in E18.

The launch navbar exposes Home, Products, Orders and Support across roles; restricted destinations such as Profile/Admin/Seller remain available only through their existing direct/footer/admin workflows and continue to rely on route/API authorization. Rendered responsive/role-visibility verification is pending.

## Admin tabs

All tabs are component state under /admin, not separate URL routes.

| Tab | Data/behavior |
| --- | --- |
| Overview / Analytics | Reads /api/admin/analytics; renders statistics. |
| Products | Reads products; create/edit, strict category select/add, primary image, colors, stock, archive and immediate list updates. Admin media uploads use a CSRF-protected, admin-authorized Vercel Blob client token to avoid function body limits; video max is 10 MB and image max is 6 MB. Vercel production acceptance remains pending. |
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
| SiteLayout / PageContainer / layout-and-feedback.css | All routed pages; form/reading/content/wide widths, header/footer | Central gutters aligned to 16/24/32px; page-specific inner spacing still needs review. Shared responsive navigation and search popover behavior source-reviewed and desktop-interaction checked; route/phone focus acceptance pending. |
| controls.css primary/secondary buttons | Shared class consumers across storefront, cart, checkout, profile, seller/admin and dialogs | Three competing base definitions replaced with one. Shared padding, typography, radius, wrapping and touch size. Contextual selectors need consumer review. Source only. |
| index.css tokens | Global control and typography foundations | Added font family, 44px control and missing spacing tokens. Legacy hard-coded typography remains for later batches. |
| NotificationProvider / layout-and-feedback.css | Global snackbars including dialog portal; error/success/info | Dismiss target now at least 44px. Existing queue, five-second lifetime and announcements preserved. Overlay/phone checks pending. |
| FormDialog / FormDialog.css | Contextual editors across account, commerce and marketplace | Existing shared implementation identified; focus/backdrop/notification combinations require rendered review. |
| record-cards.css / feature cards | Record lists, product/order cards | Shared record style exists; other card variants not yet fully inventoried. |

This is a partial source inventory, not completed component or route acceptance. Continue with startup/loading, fields, cards and page-local controls per UI_UX_REVIEW_GUIDE.md.
