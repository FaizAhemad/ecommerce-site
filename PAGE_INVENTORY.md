# Page and route inventory

## Products mobile loading/grid review - 2026-10-03

`/products` initial loading used an `auto-fit` grid with a 230px minimum track, which displayed one skeleton column on phones while the loaded shared `ProductGrid` uses two. The loading grid now uses the same two-column phone rule and gaps as `ProductGrid`, switching to the same auto-fill desktop tracks at the MUI `md` breakpoint. A delayed, mocked Playwright test captures the loading and loaded phone states, checks both columns at 320/360/390/430px, and captures the loaded desktop state. Chromium test passed; screenshots use synthetic products and no live API/database/provider. The 768px tablet and real mobile browser/device checks, plus broader filter/error/accessibility states, remain pending. See PROJECT_STATUS.md and the Products checkpoint in PAGE_REVIEW_PLAN.txt.

## Startup loader mobile review - 2026-10-03

The app bootstrap screen is rendered before SiteLayout. Its narrow-screen scene previously kept a fixed 230px height and hid the fourth art tile; the mobile rules now scale with viewport height, retain four balanced tiles, compact further for short phone viewports, and include safe-area padding. This is a source-level correction based on the reported mobile issue; no rendered screenshot/device check was possible under the current no-local-service/browser validation restriction. Reduced-motion rules remain in place. See PROJECT_STATUS.md; UI-09/RB-02 acceptance remains pending.

## Home page UI/UX review - 2026-10-03

Home renders a MUI hero, category links, a reusable featured-collections carousel with manual controls and a catalog CTA, two shared `ProductGrid`/`ProductCard` sections, a story panel and the shared newsletter form inside the shared site shell. Product cards now show up to two lines of the approved product description beneath the name; the public catalog DTO bounds this excerpt to 240 characters. The carousel appears only when configured promotions exist and fits its content on narrow screens with 44px indicator targets. Existing 1440px/390px Chromium snapshots show no visible horizontal overflow at those widths; the e2e overflow assertion also covers 320, 360, 430, 768, 1280 and 1440px. Snapshot catalog data is synthetic and repetitive, so it cannot validate live merchandising or image diversity. Source review corrected unsupported popularity/recency copy and added an explicit empty-catalog state. Regression tests now cover carousel navigation/catalog action and card description display but have not been run in a browser. Still pending: owner review, missing/failed image behavior, keyboard and screen-reader semantics, enlarged text/zoom, newsletter loading/duplicate/saved-but-email-failed/success states, and real Android/iOS checks. The shared SiteLayout header remains in migration; footer/social links use shared MUI. Evidence and limits: PROJECT_STATUS.md.

## Page review and Playwright start - 2026-10-03

2026-10-03 SPA navigation fix: shared seller/admin marketplace navigation buttons now invoke the router's `pushState` navigation handler; fulfillment cross-links do the same. Playwright verifies the document remains mounted across seller routes, admin section tabs and admin tool routes. Ten Home suite checks and the offline build pass; production and real-device acceptance remain pending.

2026-10-03 responsive baseline snapshots: Playwright captures the page route inventory and all 14 admin sections full-page at 1440px desktop and 390px phone widths (106 images across 53 states). Synthetic-only data means unmocked private APIs may show loading/error/empty states. `/help` is captured as a public MUI help hub. Home phone/desktop screenshots were inspected: the hero, category cards, product cards, subscription form and footer fit without horizontal overflow; admin phone layout stacks its content and uses a swipeable shared navbar. Continue per-page screenshot review and record any owner-requested visual changes.

The requested ordered route review and navbar visibility matrix are listed in [PAGE_REVIEW_PLAN.txt](PAGE_REVIEW_PLAN.txt); APPLICATION_BACKLOG.md remains the only completion checklist. Playwright Test/Chromium is added for local-only browser checks. The Home batch has eleven passing Chromium checks using synthetic API routes, including role-aware navigation, direct-admin denial, guest cart/newsletter protections, responsive overflow and SPA navigation through seller links, admin section tabs and admin tool routes. This is not evidence of production, WebKit/Safari, keyboard/screen-reader, manual screenshot, or real-device acceptance. The public `/help` MUI hub is registered and includes direct links to public/private journeys; its guided-tour CTA is an explicit action.

## WhatsApp local intake utility - 2026-09-30

tools/whatsapp-intake is a separate Windows command-line service with generated Products/Needs review/Messages workbook sheets. No website route, admin tab, Vercel dispatcher, CSRF exception or live Product write was added. Provider/setup and Excel visual acceptance remain pending; future review/correction UI remains unimplemented.

## Route-code loading coverage - 2026-09-30

All 19 routed page components now load on demand via React.lazy. A shared inline MUI Suspense status reserves space inside the persistent SiteLayout. Existing route permissions/redirects and App error recovery remain in place. Home no longer eagerly imports Admin, Orders, checkout, support or seller page modules. Failed network/deployment chunk loads retain the existing explicit reload recovery. Browser cold-load, navigation and real-device acceptance remain pending; build/test evidence is in PROJECT_STATUS.md.

## Shared MUI/grid coverage - 2026-09-30

Existing consumers of src/components/DataGrid.tsx inherit the header-filter, native sorting/pagination, direct-jump and body-only spinner refinement. Shared MUI consumers inherit theme/control state fixes. Actual application-grid stories cover default, empty, initial load, refresh, 1,200 pages and phone-width fixtures. Interaction evidence is in PROJECT_STATUS.md; all route/admin-tab rendered and device acceptance remains pending.

## Admin MUI coverage - 2026-10-02

All 14 `/admin` tabs use the shared MUI workspace and grid; product inline editors, product form, payment/refund review, checkout settings, customer messages, return review, feedback, policies, coupons, shipment updates and notification history use shared MUI surfaces and controls. Standalone `/admin/support`, `/admin/fulfillment`, `/admin/sellers` and `/admin/seller-products` use MUI page layouts, record cards, status feedback and primary actions/forms. Shared seller navigation, ticket conversations and private attachment controls also use MUI. `ShopInspection` and some nested operational/media surfaces still need review. Offline build passes; browser, keyboard, responsive and real-device evidence remains pending.

2026-10-02 `/admin/seller-products` review drawer: the shared MUI submit action explicitly submits its form, triggering the versioned approve/request-changes workflow. Browser interaction and production acceptance remain pending.

2026-09-29 App startup loader: the standalone pre-layout loading screen now has staggered card entrance, subtle pointer parallax, a pulsing brand mark and animated status dots. Decorative images remain hidden from assistive technology; the status stays a single polite announcement, and reduced-motion preference disables motion. Offline build and component suite pass; no browser/device observation is claimed.

2026-09-29 Payment feedback: order pages distinguish awaiting payment, payment not completed, capture pending and paid. A failed Razorpay attempt is server-verified before Payment becomes FAILED; Order stays PENDING to allow retry. Authorization does not confirm or fulfill an order; late failure events cannot downgrade authorization/capture/refund. Only unpaid PENDING orders can retry. Ambiguous/mismatched provider results leave status unchanged and tell the customer to refresh or contact care. Production/provider/browser acceptance remains pending.
2026-09-29 Home newsletter partial-success state: when Resend delivery cannot be confirmed after the subscription is saved, the form explains the saved outcome and keeps an enabled path to enter a different email. The action does not replay the same signup or resend the welcome email. Already-subscribed addresses remain editable. Three focused offline form tests and the offline build pass; rendered/browser/provider acceptance remains pending.

2026-09-29 Admin MUI migration batch 1: `/admin` workspace shell/section navigation, shared `DataGrid` used by Products/Orders/Customers, and the common FormDialog editor drawer now use the customized MUI component system. All data/query behavior, server filtering/sorting/pagination, pending guards and permissions are preserved. The admin tab-specific editors/panels and standalone `/admin/support`, `/admin/fulfillment`, `/admin/sellers`, and `/admin/seller-products` still include legacy UI and remain in the migration scope. Build/component evidence in PROJECT_STATUS.md; responsive browser/device checks pending.

2026-09-29 Shared DataGrid pagination/loading: refreshes retain current rows and no longer render skeleton rows; initial empty loads keep a reserved body row with the centered progress indicator. The footer uses one standard MUI rows-per-page label/range and supports direct page entry plus first/previous/next/last controls for large server-paginated result sets. Tests cover row retention and a 1,000-page jump; rendered/device checks remain pending.

2026-09-29 DataGrid pagination layout: explicitly group the range and page navigation with a compact responsive footer; first/last controls collapse away on phone widths while direct page entry remains available. Rendered confirmation is pending.

2026-09-29 DataGrid toolbar/footer refinement: removed the match-count chip and column-filter toggle; column filters remain visible below headings. Global search is right-aligned. Footer now groups page size on the left and result range before navigation on the right using a compact responsive MUI layout. Component tests/build evidence is recorded in PROJECT_STATUS.md; screenshot/device validation remains pending.

2026-09-29 MUI sizing pass: Products carousel uses fixed responsive image/text frames so slide copy or image proportions cannot resize the carousel; its dot controls override global button minimum dimensions. Filter text/select inputs use a 44px control height. Home hero artwork now has a lower responsive max height and wider aspect ratio. Build and component tests pass; rendered browser/device review remains pending.

2026-09-29 Products MUI migration: `/products` page layout, featured carousel, desktop/mobile filters and fields, catalog skeleton, retry/empty states and pagination feedback now use the customized `src/components/mui` components and responsive `sx` layout. Existing debounced search, cursor pagination, filters and retry behavior are retained. Shared product cards and cart actions were already MUI. Source and component-test evidence is in PROJECT_STATUS.md; browser and phone/tablet review remains pending.

2026-09-28 Orders/Order Details/tracking owner screenshots: migrated Order Details and Track Order to Tailwind layouts with a shared status timeline. Order progress is based on saved order status; only placement time and persisted shipment events receive timestamps. The detail/tracking DTOs select owned shipment-event fields only. Orders now places eligible purchase feedback after the order cards; feedback and returns use compact Tailwind surfaces and readable fields. Source review only; rendered/mobile/keyboard and API acceptance remain pending.

2026-09-27 Orders empty-state CTA: its dark Tailwind anchor inherited the global link color and rendered without readable content. It now uses the shared primary-button variant, with a text fallback if the configured continue-shopping label is empty. Other dark CTA matches were checked: they are actual buttons or already use the shared primary variant, so link inheritance does not affect them. Rendered/mobile acceptance remains pending.

2026-09-27 launch navigation and Orders pass: shared header now shows Home, Products, Orders and Support for all roles; admin/seller/profile/shop links are removed from the primary navigation, and the tour targets only visible routes (Orders appears for signed-in users). `/orders` now uses Tailwind for responsive order cards and explicit loading/error/empty/pagination states, with direct order-detail and track links. Product Details uses the same shared cart action as catalog cards. Local route and phone review remain pending.

2026-09-28 shared cart action refinement: AddToCartButton uses the muted sage surface with a clearer plus action; the quantity group has semantic remove styling, quieter minus action, and a differentiated count display across ProductCard, Product Details and Cart. All variants use 48px height and 44px icon targets; rendered/device acceptance pending.
2026-09-29 ProductCard cart width consistency: the shared quantity stepper now follows the ProductCard `fullWidth` setting, so its width matches the Add to cart CTA before and after adding an item. Cart/detail compact variants retain their existing width. Offline build and component tests pass; rendered phone/desktop confirmation remains pending.
2026-09-29 Products incremental loading: added responsive bottom spacing beneath the “Finding a few more good finds” status card so it no longer crowds the footer divider. Offline build and component tests pass; rendered mobile/desktop confirmation remains pending.

2026-09-27 ProductCard rating empty state: cards with genuine reviews show the persisted average and review count; products without reviews show a compact `No reviews yet` label instead of empty stars and a fabricated-looking `0.0` score. Local desktop check pending after HMR; phone/tablet and automated verification remain pending.

2026-09-27 ProductCard optional data: absent seller attribution now takes no space, and fallback `Default` color metadata no longer appears as a product swatch; only named color variants render. Compare-at details remain conditional on valid saved pricing, while the CTA stays bottom-aligned. Local Products desktop screenshot checked; phone/tablet and automated verification remain pending.

2026-09-29 Home MUI migration: HomePage, its shared ProductGrid/ProductCard, rating stars, cart quantity/add controls, and newsletter form now use dedicated components from `src/components/mui`. Replaced Home utility classes with responsive MUI `sx` layouts and removed Home-only hero/section/newsletter legacy CSS. ProductCard/ProductGrid/AddToCartButton/RatingStars are shared, so this also migrates those components on Products, Cart, Product Details and other consumers; remaining page-local structures on those routes are still legacy. Preserved catalog data, navigation, wishlist/cart handlers, image alt text, newsletter duplicate handling, and responsive two-to-five category/product grids. Offline build and component interaction checks passed; visual/browser/phone/tablet checks remain pending.
2026-09-29 Home MUI contrast follow-up: primary link buttons inherit MUI contrast colors after excluding `.MuiButton-root` from the legacy link color reset; product badge chips are suppressed when badge data is empty. Build/component tests pass; rendered confirmation is pending.
2026-09-27 Home/catalog merchandising: Home uses a product-led generated hero and catalog-facet category links; Products promo slides use separate imagery for Home & Kitchen, practical gadgets and playful accessories/toys. Products category query parameters seed and track the selected facet. Local desktop visual check confirmed the page/campaign artwork loads; full slide-by-slide, phone and tablet acceptance remains pending.


2026-09-30 planned coverage: REBRAND_IMPLEMENTATION_PLAN.md maps every registered storefront/account/policy/shop/seller route, all 14 admin tabs, standalone admin routes, startup, shared primitives and recovery states to RB-01?RB-09. SCHEMA_EVOLUTION_PLAN.md links underlying data dependencies. MUI coverage remains partial; planning does not mark any additional component or route migrated. Browser/device acceptance remains pending.
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

2026-09-29 styling migration direction: owner wants MUI as the only UI system. A shared theme, provider, export barrel, component catalog, initial Storybook groups, and component test foundation are added under `src/components/mui`; the Products phone filter now uses MUI Drawer instead of Radix. Tailwind utilities and legacy feature CSS remain temporarily across storefront/admin routes and must be migrated before their packages/build integration can be removed. Rendered/mobile/browser acceptance remains pending.

2026-09-27 automatic pagination: `/products` observes a small sentinel after the grid and fetches the next cursor page before it reaches the viewport; the query key carries active search/category/sort/color/rating filters, so each filtered collection paginates independently. A synchronous lock prevents duplicate requests, failures retain loaded cards and show a retry action, and a manual fallback appears only if IntersectionObserver is unavailable. Active loading now uses a compact branded status panel with a reduced-motion spinner and explanatory copy. Browser/device acceptance remains pending.

2026-09-26 shared product-card affordance: pointer cursors identify the clickable image/title, wishlist, and add-to-cart controls across Home, Products, and Wishlist; disabled actions use a not-allowed cursor. Blank card areas remain non-clickable. Rendered interaction acceptance remains pending.

2026-09-26 shared product-card type hierarchy: titles use a semibold sans face in the deep brand color; selling price is emphasized, original price is muted/struck through, and valid savings use a quiet green pill. Only configured compare-at prices produce discount messaging. Contrast and long-text rendering remain pending.

2026-09-26 grid scroll regression correction: after screenshot evidence showed the row measurement patch still allowed cards to jump during scroll, removed absolute-position virtualization. `ProductGrid` now shares the ProductCard across Home and Products and lets CSS grid size rows naturally; Products loads additional cursor pages automatically as the customer scrolls. Rendered acceptance remains pending.

2026-09-26 Home CTA contrast: global inherited anchor color no longer overrides the shared primary/secondary button colors on CTA links. The Home “Explore the collection” action now uses the common high-contrast primary treatment; rendered contrast acceptance remains pending.

2026-09-28 /checkout: phone-first saved-address cards, direct Add delivery address FormDialog using the existing owner-scoped address API with a validated two-letter country code, itemized order summary and server quote. A newly saved address is selected immediately; address form failures preserve its draft. When checkout is unconfigured, the cart item subtotal remains visible and is explicitly distinguished from delivery/tax/discount and final payable total. An order attempt freezes the visible cart/address/quote; explicit retries retain the original request. Payment stays in owned Order Details. Build passed; browser/device and owner configuration/provider acceptance remain pending.

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

Session update 2026-09-29: customer and admin sessions use a 12-hour absolute cap with the existing 30-minute / 15-minute idle limits; renewals stop at the absolute deadline. Same-profile tabs bootstrap from the shared HttpOnly cookie, including within one Incognito/InPrivate session; normal and private contexts remain isolated, and closing all private windows ends that private session. Source reviewed; authenticated browser/device acceptance remains pending. See SESSION_SECURITY.md.

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
| / | HomePage / PromoCarousel / SiteTour | Public | API catalog slices plus locally configured hero, featured-collections carousel, categories, story, product sections and newsletter. HomePage and shared purchase/product controls use Gadgify MUI components; shared component conversion partially carries to Products/Cart/Product Details. The explicit route tour points to the current Home navigation link. Full section CMS pending. |
| /shops, /shops/:slug | ShopsPage | Administrator or authenticated user with an active membership in an approved non-platform shop | Private shop management/discovery view. Guests are sent to sign-in; customers and pending/unapproved sellers see an access explanation. The API independently enforces the same access rule. Published product image/video bytes remain available to the Gadgify catalog; customers browse and order through Gadgify's /products page and do not see shop names or shop links on product cards/details. |
| /seller | SellerPage / SiteTour | Signed-in | Seller application saves business address/mobile and private shop-level GST declaration. Registered sellers provide a format-checked GSTIN; non-registered sellers must provide a reason and may add an enrolment ID. Approved sellers can update GST details; updates are private, versioned and audited and pause external-shop ordering until admin review. UI says a reason alone is not eligibility. The shared header shows “Sell with us” to guests and “Seller workspace” after sign-in. Applying does not mark account email verified. |
| /seller/products | SellerCatalogPage | Approved shop membership | Versioned drafts and product moderation; admin proposes a fixed INR/unit or percentage of discounted item price; seller can accept or decline exact offer version. Up to 10 mixed image/video attachments per product; 1 MB/file. Accepted offer enables Gadgify checkout after migration/runtime prerequisites; settlement remains manual. |
| /products | ShopPage / SiteTour | Public | MUI page shell, promo carousel, desktop filter rail, mobile Drawer, shared product cards and query-backed filters. Seller items show an offer-pending state until the shop accepts the exact version; server checkout eligibility remains authoritative. Browser/mobile acceptance pending. |
| /product/:id | ProductDetailPage | Public; review writes require session | Product/media/review reads, shared fractional rating stars in the rating summary and review rows, own-review edit pencil and media uploads. Product image magnifies 2.2× around the mouse pointer; click/tap or keyboard activation opens the media lightbox. Video thumbnails open in the lightbox without replacing the primary image; empty summaries explicitly show 0.0 with 0 ratings / 0 reviews, and the duplicate short divider below Latest reviews was removed. The server-rendered SEO handoff before app startup is styled to match the storefront and includes a responsive lead image. A consistent divider separates the rating distribution from latest reviews; own-review editing uses a labeled, touch-sized secondary button. Failed images are removed from lightbox navigation, shown as unavailable and cannot be zoomed; missing media remains a non-interactive placeholder. The main image fills its rounded viewport without the exposed tone frame. Product summary, rating distribution, review rows and the bounded review form use Tailwind spacing and controls. Gallery, ratings and review form align to the catalog container and gutters. Source-reviewed; rendered/mobile zoom and review states remain unverified. |
| /support | SupportPage / SiteTour | Public | Unified Support and Help center with responsive quick links (one column on narrow phones, two on tablet, four on wide desktop), larger FAQ row hit areas and answer spacing, restrained heading scale, contact panel and authenticated private support form with saved-ticket handling and bounded JPEG/PNG attachments. Tour highlights and points to the active Support navigation link; destination-labeled Next controls navigate to the next route. Offline build passes; rendered 320–430px phone/tablet/keyboard, tour and ticket migration/scanning acceptance remain pending. |
| /support-requests | SupportPage list | Authenticated for API; guest login guidance | Owned paginated tickets, status/reason, open cancellation, private attachments and paginated replies. Migrations/device acceptance pending. |
| /admin/support | SupportPage admin / SupportTicketCard | Administrator | MUI inbox, private attachment and conversation surfaces with paginated tickets and guarded status/resolution updates; migrations and device acceptance pending. |
| /admin/fulfillment | FulfillmentPage (admin) / ShopInspection | Administrator | MUI fulfillment overview, filters, order cards, return/shipment actions, support conversation and quality inspection panel. Portions of fulfillment detail/media presentation remain under review; migration/device acceptance pending. |
| /admin/sellers | SellerPage (admin) | Administrator | MUI seller-application records, private GST/contact fields, separate GST eligibility and shop-access decisions, guarded review dialog and pagination. Shop approval requires explicit GST review approval; pending/needs-info/rejected GST status pauses marketplace purchase eligibility. Product moderation remains separate. Admins can edit review notes and correct status with versioned server-side membership changes. Migration and production/device acceptance remain pending. |
| /admin/seller-products | SellerCatalogPage (admin) | Administrator | MUI moderation cards; product approval proposes a fixed INR/unit or discounted-price percentage; declined offers can be revised. Prepared migration and production/device acceptance remain pending. |
| /track-order | TrackOrderPage / OrderTimeline | Public page; API requires session | Owned order number/internal-ID lookup shows current status, carrier/reference and chronological saved shipment events; shared timeline explains order progress. Only recorded placement and shipment event times are shown. Live carrier integration remains incomplete. |
| /privacy | PolicyPage (privacy) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /returns | PolicyPage (returns) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /refund-policy | PolicyPage (refund) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /terms | PolicyPage (terms) | Public | Published-only localized query with loading/error/unpublished states; approved text remains owner-supplied (E29). |
| /terms-and-conditions | PolicyPage (terms) | Public | Terms alias. |
| /login | AuthPage (login) | Public | Password login by email/mobile identifier. Uses the shared 48px MUI TextField size; legacy account CSS no longer overrides MUI labels/input padding or Stack spacing. Authenticated visitors render HomePage at this path. |
| /signup | AuthPage (signup) | Public | Registration with email/mobile selection and the same shared MUI field sizing as Login and password recovery. Email-verification and password-recovery pages exist; mobile OTP UI remains pending. |
| /forgot-password | PasswordRecoveryPage (forgot) | Public | Email-based recovery request uses the shared 48px MUI TextField, neutral acknowledgment, pending/error states and failed draft retention; owner delivery/mobile acceptance pending (E16). |
| /reset-password | PasswordRecoveryPage (reset) | Public; one-time token authorizes reset | New/confirmed password use the same shared MUI TextField size, with missing-link recovery, fragment/legacy query support, session revocation and normal login after success; owner acceptance pending (E16). |
| /verify-email | EmailVerificationPage | Public token confirmation; session required for status/resend | Explicit confirmation, safe token URL cleanup, verified status, owned resend, pending/errors; owner mobile/provider acceptance pending (E18). |
| /profile | ProfilePage / ProfileForms / SiteTour | Signed-in customers and admins; guests see login | Uses shared content-width PageContainer with responsive personal-detail and saved-address cards; account verification/reset links remain distinct. Personal and address editors use the native FormDialog drawer with focus restoration, Escape/pending guards, preserved drafts and inline failure feedback. Phone changes still require current password and clear verification; address ownership/default/order-use rules unchanged. Offline build passes; rendered phone/tablet, keyboard, account-switch and production acceptance pending. |
| /cart | CartPage / SiteTour | Authenticated | Shared header/page query with optimistic quantity/removal, per-product locks, affected-row rollback and checkout guard while saving. Product thumbnails use ordered image metadata, open in an accessible modal preview, and fall back safely on missing/failed images. Quantity controls reuse AddToCartButton. Item list and order summary use responsive Tailwind layout, with a sticky desktop summary and stacked phone layout. During the explicit route tour, the active Cart header control is highlighted and pointed to. Loading/error/empty states are styled; rendered phone/tablet/keyboard review remains pending. |
| /wishlist | WishlistRedirect | Public redirect | Temporarily hidden by request; replaces the URL with /products. Header link removed. WishlistPage is retained but inactive; product hearts and saved-item APIs remain available. |
| /checkout | PaymentPage | Authenticated | Responsive saved-address selection and itemized summary with server-calculated coupon, launch delivery of ₹0 (legacy per-product fees ignored), optional tax (omitted means zero) and total. Customer is told payment follows order creation and continues on the owned Order Details page. Submission freezes the original cart/address/quote/UUID for explicit retry, never optimistically confirms payment. Prepared Product/OrderItem migration is unapplied; checkout enablement, Razorpay configuration, rendered phone/tablet/keyboard and provider/production acceptance remain pending. Regional delivery remains blocked pending approved origin/service zones and carrier rates. |
| /orders | OrdersPage / PurchaseFeedback / SiteTour | Authenticated | Guest header/footer hide the private Orders destination. Direct access opens sign-in and returns the user to the requested order route after successful authentication. Signed-in users see private paginated history with stored totals/items/status, loading/empty/error/retry states, responsive order cards and owned details/tracking. Rendered/device/production acceptance pending. |
| /orders/:id | OrderDetailPage / OrderTimeline / PurchaseFeedback / CustomerReturns | Authenticated | Private order/items/totals/address/payment/shipment query with shared progress timeline, actual recorded delivery-event timestamps, compact item/summary/address/payment cards and delivered-order return request/status. Order progress uses saved status; the UI does not fabricate per-stage timestamps. E30 source is unverified. |
| /admin | AdminPage / SiteTour / DataGrid | Administrator for page content | Guest access directs to sign-in; signed-in non-admins receive an access-required explanation and storefront return link. Admin customer/account rows show human-readable Customer or Administrator role badges; role is always the server-assigned value, never inferred by email/name. Responsive MUI workspace with 14 section controls and MUI-backed tab panels plus separate operational routes. Unauthorized admin-only route states distinguish sign-in from insufficient privileges. Rendered phone/tablet/desktop, role/account and keyboard checks remain unverified. |
| /debug-error | DebugErrorPage | Intentional throw only in development | In production renders a development-only notice. |
| Any unmatched path | NotFoundPage / AdminRedirect | Public fallback | Unknown /admin/* redirects to /admin; other unknown routes show not-found. Invalid encoded IDs are rejected. |

AI flows remain missing; E29 adds shipping/cancellation/cookie policy routes. Reset emails now resolve to /reset-password (E16); /verify-email is registered in E18.

Guest navbar/footer expose public storefront destinations; Orders appears only after sign-in. Direct private routes keep server/API authorization and now return to the requested path after sign-in. Admin-only routes show a clear sign-in or insufficient-role state. Rendered responsive/role-visibility verification is pending.

2026-10-02 shared navigation update (superseded 2026-10-03): Shops was public. Current behavior is recorded in the /shops route entry above; UI and API now require Admin or approved seller membership.

2026-10-02 seller email gate override: seller application submission and admin approval no longer require verified email. The account verification flag remains unchanged; seller email notification recipient checks remain intact. Offline build/source coverage pending; production application and approval are owner-verified only.

Catalog stock availability and a bounded excerpt of the approved public description are supplied by the public product API and displayed by shared ProductCard on Home and Products. Card pricing is condensed into one aligned price/status block, with compare-at price and discount together below it. Product SKU choices/sizes are not implemented; see [PRODUCT_VARIANTS.md](PRODUCT_VARIANTS.md).
ProductCard and ProductDetailPage use the shared AddToCartButton’s default “N in cart” quantity label, shared cart query, pending feedback and decrement/remove behavior. Product Detail bounds the action width; CartPage retains the compact numeric quantity. Rendered phone/tablet and keyboard checks remain pending.

## Admin tabs

All tabs are component state under /admin, not separate URL routes.

| Tab | Data/behavior |
| --- | --- |
| Overview / Analytics | Reads /api/admin/analytics; renders product, customer, order and revenue totals. Customer behavior reporting, consent controls and aggregate product recommendations are not implemented; see Customer usage insights in APPLICATION_BACKLOG.md. |
| Products | Reads products; shared DataGrid filters by product/category, selling/original price, stock and visibility. Selling/original price, stock and visibility can be changed inline through validated APIs. Delivery is free at launch; legacy per-item fees are hidden and ignored by checkout. Create/edit, strict category select/add, primary image, colors, archive and server-query reconciliation remain available. Admin media uploads use a CSRF-protected, admin-authorized Vercel Blob client token to avoid function body limits; video max is 10 MB and image max is 6 MB. Shipping migration and Vercel production acceptance remain pending. |
| Orders | Reads orders; shared DataGrid filters by order number, total and status. Status selector keeps confirmed values on failure and reconciles on success. E13 guards cancellation/restock and closed states; full fulfillment/production verification pending. |
| Payments | Reads payments and verifies a provider-reported full Razorpay refund (E25); never issues refunds. Legacy manual status action rejected; initiation/partial refunds and live acceptance pending. |
| Returns | Private latest-100 history and guarded review with mandatory reason. E30 adds delivered-order customer submission/status; refund/stock effects, approved eligibility, collection and live acceptance remain pending. |
| Customers | Reads customer data/order counts; shared DataGrid filters by name, email, role and order count; no full account-management UI. |
| Messages | Private latest-100 history and transactional email form for verified customers; UUID duplicate protection and accepted/unconfirmed feedback (E24). Provider/device acceptance and durable delivery tracking remain pending. |
| Feedback | Private latest-100 first-purchase ratings/comments/order numbers (E28); unapplied migration and owner/device acceptance pending. |
| Settings | Private settings query and validated checkout fee/tax/availability editor (E23); broader store configuration remains incomplete. |
| Coupons | Draft/activate/archive, dates, minimums, caps, usage limits and checkout redemption configuration; E30 checks/business approval pending. |
| Shipments | Guarded carrier/reference/status updates and customer-visible event history; external carrier integration pending. |
| Notifications | Private order-email attempt history with accepted/unconfirmed semantics; durable retry/delivery tracking pending. |

Admin overlay inventory: product/category editor, coupon editor, refund approval and customer-message composition use the shared FormDialog; profile/address, checkout address, seller workflow and contextual record editors also consume it. Dialog focus, close/pending, error, draft-preservation and phone/tablet states require per-consumer rendered checks; see UI-03/UI-04 in APPLICATION_BACKLOG.md.

## Server-state coverage

| Area | Implemented data boundary | Remaining |
| --- | --- | --- |
| Storefront/Home | ['storefront'] plus API categories/products merged with local config | Full catalog facets and independent CMS sections |
| Shop | ['catalog', filters] | Progressive cursor consumption and robust error states |
| Product/reviews | ['product', id], ['product-reviews', id], privateKey('my-review', id) | Product revalidation and account-scoped own-review key implemented; live review/media acceptance remains |
| Cart/wishlist | privateKey('cart') shared header/page hook; private wishlist query and memory-only hearts | Live browser account-switch acceptance; deferred wishlist page completeness |
| Orders/detail/checkout | Orders uses privateKey(orders) and paginated API history | Detail uses privateKey(order,id); checkout uses shared cart/profile plus privateKey(checkout,cartRevision). Provider/device acceptance pending |
| Tracking | privateKey('tracking', enteredId) | Owned ID/number mapping, pending/errors and private keys implemented; shared OrderTimeline consumes minimal selected event fields; provider/browser verification remains |
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
| SiteLayout / PageContainer / layout-and-feedback.css | All routed pages; form/reading/content/wide widths, header/footer | Central gutters aligned to 16/24/32px; page-specific inner spacing still needs review. Header remains legacy migration work. Footer and social links now use shared MUI components, with one footer social group, white-on-brand icons, responsive link columns and a divider/back-to-top row. Route/phone focus and rendered acceptance pending. |
| controls.css primary/secondary buttons | Shared class consumers across storefront, cart, checkout, profile, seller/admin and dialogs | Three competing base definitions replaced with one. Shared padding, typography, radius, wrapping and touch size. Contextual selectors need consumer review. Source only. |
| index.css tokens | Global control and typography foundations | Added font family, 44px control and missing spacing tokens. Legacy hard-coded typography remains for later batches. |
| NotificationProvider / layout-and-feedback.css | Global snackbars including dialog portal; error/success/info | Dismiss target now at least 44px. Existing queue, five-second lifetime and announcements preserved. Overlay/phone checks pending. |
| FormDialog / FormDialog.css | Contextual editors across account, commerce and marketplace | Existing shared implementation identified; focus/backdrop/notification combinations require rendered review. |
| DataGrid | Shared table UI; current consumers are /admin Products, Orders and Customers | Global search and enable/disable per-column filters directly under headers (disabling clears column criteria), server sorting and 10/25/50 pagination, select filters, server match count, reset/empty states and keyboard-focusable horizontal scrolling. Admin GET handlers validate allowlisted sort/filter fields and return only the requested page with totals. Extend this component for additional page tables instead of creating page-specific grids. Rendered filter/sort/pagination interaction, focus, zoom and phone/tablet checks pending. |
| record-cards.css / feature cards | Record lists, product/order cards | Shared record style exists; other card variants not yet fully inventoried. |

This is a partial source inventory, not completed component or route acceptance. Continue with startup/loading, fields, cards and page-local controls per UI_UX_REVIEW_GUIDE.md.

## Products filter scenarios - 2026-10-03

Expanded `e2e/products.spec.ts` with synthetic server-side filtering for the untouched default query, category-only, color-only and rating-only cases, combined multi-value category/color/rating/debounced-search/sort, clearing to default, URL category state and a valid no-results response with the clear-filters recovery action. This scenario is authored but not yet run: the local dev server stopped, and the installed Node 24.18.0 is rejected by the project�s Node 22 guard. Validation pending; keep broader server-error/retry and tablet/device/accessibility checks open.

Empty color-facet state: FilterSidebar now omits the color heading, options and adjacent divider when no colors are returned. Added a mocked Playwright test for phone drawer and desktop sidebar; it is unverified pending the Node 22 test run.
The empty-facet component assertion passed in Vitest (1/1 selected): the rating legend remains and the Color legend is absent. Browser-level phone/desktop verification remains pending.

Product Details review update (2026-10-03): source changes add shared MUI availability chips and a valid crossed-out original price/discount, and replace the guest review form with a sign-in action. The page still needs full MUI migration and rendered phone/desktop acceptance; see PROJECT_STATUS.md.

Support page review update (2026-10-03): the public Support page now routes guest order-help cards to sign-in with guest-specific wording, and its authenticated request form uses shared MUI TextField, Button and Alert components. Added mocked Playwright cases for guest desktop/phone screenshots and no-overflow, successful ticket record/email wording, retained drafts on API failure, and signed-in private ticket list. Spec discovery succeeds; browser execution/screenshots remain pending under Node 22. Existing migration, inbox authorization and attachment caveats remain in SUPPORT_REQUESTS.md and PROJECT_STATUS.md.

Login review update (2026-10-03): password/email/mobile controls and method buttons now use shared MUI; authentication responses use safe server wording inline and preserve the draft on failure. Added mocked phone/desktop snapshots plus wrong-credential, mobile-identifier, rate-limit, customer redirect and administrator redirect scenarios. Remaining shell/page migration and rendered/keyboard/real-device acceptance are pending. See PROJECT_STATUS.md.

Signup review update (2026-10-03): AuthPage now bounds display names to 2-100 characters and passwords to 8-128; server signup enforces the same limits and reuses centralized email/international-phone patterns. Duplicate contact errors no longer assume the duplicate is an email. Mocked Playwright discovery now includes signup success and conflict/draft-retention cases. SMS/provider delivery and mobile OTP user experience remain gated/pending; see EMAIL_VERIFICATION.md and project status.

Password recovery review update (2026-10-03): Forgot/Reset forms now use shared MUI controls and persistent inline validation/server errors; password mismatch and expired-link failures preserve drafts. Reset token continues to be captured in memory, removed from URL, and omitted from screenshots/logs. Added six mocked Playwright states for neutral acknowledgment, API failure, missing token, mismatch, expired token and successful return to login. Browser execution, real email delivery, session revocation and device acceptance remain pending; see PASSWORD_RECOVERY.md.

Email verification review update (2026-10-03): migrated verification outcomes, status/retry and actions to shared MUI Alert/Button/Stack/Typography. Ownership model remains unchanged: guests may confirm a token; only signed-in account can view status or resend, and recipient is server-derived. Added mocked token-confirmation, resend success/failure, mobile-only no-email and URL-cleanup cases. Provider delivery and browser/device acceptance remain pending.

Profile review update (2026-10-03): profile shell/loading/error, verification status, security actions and editable profile/address controls now use shared MUI components. Phone changes still require current password; API ownership/version/transaction rules are unchanged. Added mocked route scenarios for guest sign-in gate, empty address/responsive layout, reauthenticated phone update and first-address save. Address delete/default-switch/order-referenced conflict, account switch and real-device states remain pending.

Cart review update (2026-10-03): migrated route loading/empty/fatal-error/retry, count, order summary and navigation actions to shared MUI. A failed background refresh now keeps cached items visible with a warning/retry action; a first-load failure still shows a blocking error, and optimistic quantity rollback is unchanged. Added mocked guest gate, empty cart, responsive saved cart/summary and failed-quantity rollback cases. Checkout/payment status remains authoritative at Checkout/API; browser execution and real-device acceptance pending.

2026-10-03 Checkout: shared MUI fields/actions/alerts now cover saved-address entry, coupon, quote, checkout error and pending action. Existing secure checkout contract is unchanged. Orders history states and actions use shared MUI Chip/Skeleton/Alert/Button/CircularProgress. Rendered route and phone/tablet acceptance remain unverified.

2026-10-03 Order detail/tracking/return views: MUI status/loading/error/actions and tracking/return form controls applied; private DTO and payment/return authorization contracts unchanged. Safe tracking requires sign-in. Source pass only; no Playwright/browser/device verification.

2026-10-03 Shops: public directory/showcase migrated to shared MUI cards, buttons, loading/error/empty states and media feedback. Server projection and private shop data boundaries unchanged. Rendered and real-device checks pending.

2026-10-03 Seller routes: application and fulfillment routes already use shared MUI controls; seller catalog remaining media selection/removal, review/archive actions converted. Public shops are separately migrated. No seller drafts/media/publication/fee logic changed. Browser and required migration/production verification remain pending.

2026-10-03 Admin and policy views: main admin tab shell/grid controls use MUI; data types are explicit for admin analytics/products/orders/customers. Shared MUI policy loading/error/missing content and route access/404 fallbacks are implemented. Feature controls remain subject to tab-by-tab rendered QA and backend authorization checks.


2026-10-03 Help/tour: public `/help` MUI hub added; route supports links for catalog, tracking, policy, account and Support. Tour remains opt-in and lazy-loaded only on Support. Screenshot and focus acceptance pending.

2026-10-03 Shared component consumers advanced: private customer feedback on Orders/Order Details, seller media storage, seller order records and product image preview received MUI source updates. See PROJECT_STATUS.md. The changes preserve data contracts and mutation guards; browser/mobile/focus verification is pending.

2026-10-03 Support/recovery/session follow-up: customer ticket fields, retry/load-more, recovery resubmit and session continuation controls now use customized MUI. No support, password, or session contracts changed. Browser and device acceptance remains pending.

2026-10-03 Shared navigation coverage: global header actions now use customized MUI buttons, icon buttons and search field while retaining existing auth-based nav visibility and logout behavior. Source/build only; validate keyboard, role states and responsive widths in browser/device review.

2026-10-03 Product Details follow-up: remaining page-local review form, review actions and product gallery/lightbox controls migrated to customized MUI. Upload limits and review eligibility were preserved. Source/build only; product media, focus, phone/tablet and authenticated review browser checks remain pending.

2026-10-03 Checkout/Payment follow-up: route-level empty/error/address-selection actions migrated to MUI. Existing owned-address and payment-attempt safeguards are preserved. Source/build only; customer browser/provider/device acceptance remains pending.

2026-10-03 source consumer scan: PaymentPage and ProductDetailPage page-local controls were migrated; CheckoutSubmit retry and CartPage image-preview action now use shared MUI. `rg` scan found no direct button/input/select/textarea markup in `src/pages` or `src/components`. This does not replace route-state, keyboard, responsive or real-device browser testing; all such acceptance remains pending.

2026-10-03 Admin tab source audit: all 14 sections and their grid/dialog consumers inspected. Remaining feedback notice, product media preview list and grid text cells now use shared MUI. No native form controls or page-local CSS classes remain in AdminPage except the hidden-state wrapper. Source/build only; all role-based rendered tab states, mobile/keyboard and production checks remain pending.

2026-10-03 standalone admin/seller routes: fulfillment, seller applications/catalog, inspection and support-ticket components source-audited; no remaining native controls or className styles found in inspected files. Seller media storage layout moved off its feature CSS to shared MUI responsive grid/cards; two unused CSS files removed. Source/build only; browser, keyboard, tablet/phone and owner acceptance remain pending.

2026-10-03 customer route/navigation update: Wishlist and Orders layouts are MUI-based. The Playwright source now clicks each guest-visible primary destination and adds role-specific customer Orders/Profile and Admin destination captures at desktop and phone sizes; run output is blocked because Chromium is not installed, so screenshot files are not yet present. Login and guest-cart sign-in use the same AuthPage and a shared 620px page container; a bounding-box regression test compares their card widths. Offline build passes; no rendered result is claimed.

2026-10-03 Support route update: both public Support and customer Support Requests list states now use shared MUI layout, accordions, help cards, alerts, contact forms and pagination actions. Request data ownership and writes are unchanged. Source/build only; browser screenshots/device verification remains pending.

2026-10-03 shared-header visual fix: cart badge CSS now targets a dedicated header count class instead of the last nested span, preventing MUI touch-ripple decoration from appearing as an extra dot. Test asserts there is exactly one count badge. Offline build passes; capture/inspect the rendered header once Chromium is available.

2026-10-03 shared route loading: every lazy route now uses `BrandedPageLoader` within the existing shell instead of a small spinner. The stage has a responsive shared height and consistent centered Gadgify mark/status; admin redirects reuse it. Story and component-level assertion added. Offline build passes. Phone/desktop screenshot and reduced-motion browser review remain pending.

2026-10-03 Product Details content pass: summary now mirrors catalog facts (real rating/review count, sale/original price and discount, availability, color options and approved product description) and removes the misleading store-tagline fallback. Replaced excess nested shell padding with intentional responsive gallery/summary gutters, and added a same-category cross-sell grid using shared ProductCard/ProductGrid. Mocked Playwright coverage captures phone and desktop screenshots and checks content/navigation; it is authored only, not browser-run. Offline build passed; render/device acceptance remains pending.

2026-10-03 Product Details gallery interaction: product media now opens in a responsive MUI dialog with product copy, active image/video and accessible thumbnail selection; keyboard arrows continue through media and Escape closes the view. Mocked screenshot/interaction coverage is authored; rendered desktop/mobile acceptance remains pending.

2026-10-03 Product Details review/media/footer polish: rating distribution uses the shared MUI stars instead of a broken star-character label; review labels/status text are encoding-safe. The media viewer reserves space for its close button and sizes portrait video without stretching. Footer retains one accessible Back to top text link and no floating duplicate. Browser visuals remain unverified.

2026-10-03 Product Details media rail follow-up: desktop gallery rail widened for readable media labels; header now keeps close separate from the selected count; mobile thumbnail cards expose their media type and title while remaining horizontally scrollable. Rendered phone/tablet/desktop checks remain pending.
