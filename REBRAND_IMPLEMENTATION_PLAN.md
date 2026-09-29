# Gadgify rebrand and MUI implementation blueprint

Prepared 2026-09-30 from current source, owner screenshots and public reference pages. This is a proposed implementation specification, not a claim that the redesign is shipped or mobile-verified. APPLICATION_BACKLOG.md is the sole completion checklist. Existing marketplace, security, provider and migration gates remain in force.

## Outcome and scope

Create a brighter, legible, responsive shopping experience with one customized MUI system across storefront, account, admin and seller pages. Keep Gadgify's name and useful-everyday-products positioning. Rework the visual identity, content hierarchy, interaction feedback and initial loading together. Start with shared foundations; migrate complete journeys in bounded batches. The owner requested this plan for subsequent implementation, so this batch changes documentation only.

## Source findings and evidence limits

| Finding | Source evidence | Implementation consequence |
| --- | --- | --- |
| Competing visual systems | `src/index.css`, `src/App.css`, `src/styles/*`, MUI theme and page `sx` values duplicate colors, spacing and typography | One semantic token source, then remove obsolete consumer rules as each route migrates |
| Beige-on-beige surfaces and dark actions dominate | CSS paper `#f7f4ed`, surface `#fffefa`; MUI duplicates them and has its own fixed primary | Brighter canvas, white content surfaces, a distinct action color; bridge legacy variables during migration |
| MUI coverage is partial | Home/Products/shared cards are MUI; SiteLayout, PageContainer, notifications and many operational forms remain legacy | Reusing wrapper files alone does not complete migration; audit composed behavior too |
| Startup hides all navigation/content until two requests finish | `App.tsx` gates on storefront and session loading | Separate public rendering from private identity verification; retain protected boundaries |
| Some add actions perform an extra product fetch | `App.tsx` searches the initial storefront slice, otherwise calls `getProduct` before `updateCart` | Pass already-rendered product metadata into the cart command; server still validates product/stock/price |
| Cart is already optimistic, but same-product taps are locked | `src/api/cart.ts` updates the private cache with row-level rollback; AddToCartButton waits on its promise | Preserve row isolation and build a latest-desired-quantity coordinator if rapid taps are enabled; do not simply remove locks |
| Cards are cramped in some phone layouts yet sparse elsewhere | ProductGrid always uses two `xs` columns; ProductCard uses 10px category/badge text and reserves repeated rows | Content-driven phone column threshold, readable labels, optional metadata without blank slots |
| Two grid layers exist | Shared `components/DataGrid.tsx` composes MUI Table; `components/mui/DataGrid.tsx` wraps MUI X | Define one application grid contract. Keep working server filters/pagination; evaluate X migration separately against free-tier requirements |
| Initial bundle includes statically imported routes | Router imports admin/seller/customer pages; last build reported a roughly 1 MB minified client chunk | Route-level lazy loading, measured bundles, deferred operational editors and media |
| Notification integration needs migration review | NotificationProvider still looks for a native `dialog.form-dialog` host while FormDialog is MUI | Verify portal layering, focus and screen-reader announcements inside MUI dialogs |

These are source findings, not measured production latency or rendered-device failures. Prior screenshots illustrate visual concerns. No local/live API, provider, database, environment file or authenticated production browsing was used for this audit.

## Proposed visual direction: bright, useful, confident

Replace the large beige wash with a cool near-white canvas and crisp white panels. Use a rich teal for primary actions, ink for text, and restrained citron for editorial accents. Product photography supplies most color. Do not use color alone to communicate status. This proposal supersedes the earlier dark-action/warm-beige visual direction when implemented; validate contrast and representative screens before rolling it across every route.

| Semantic token | Proposed value | Role |
| --- | --- | --- |
| Canvas | `#F5F7FA` | Page background |
| Surface | `#FFFFFF` | Cards, fields, menus, dialogs |
| Subtle surface | `#EEF5F4` | Grouping, selected context |
| Primary / hover | `#006D77` / `#00545D` | Main action with white text |
| Primary soft | `#E5F3F2` | Selected navigation/filter background |
| Ink / secondary text | `#172B3A` / `#536474` | Heading/body and supporting text |
| Border | `#CBD5E1` | Field/table/panel separation |
| Editorial accent | `#D7E86B` | Small brand accents with ink text |
| Success / warning / error / info | `#19734A` / `#8A5700` / `#B42318` / `#245DA8` | Labeled semantic feedback; use soft companion surfaces |

One token module should supply `gadgifyTheme`, styled wrappers and the temporary CSS-variable bridge. Resolve how existing server-configured brand colors map to these roles; do not silently ignore configuration or let arbitrary colors create unreadable buttons. Validate custom brand input/contrast before supporting unrestricted theming. No dark mode is required for this pass.

Typography: system sans initially, 16px body/input, 14px secondary/control text, 12px minimum nonessential metadata. Use 24–30px phone page headings and 32–40px desktop headings; 18–22px section headings. Product title 14–16px, price 18–22px, sentence case where appropriate without corrupting product names/acronyms. Table body 14px; numeric columns use tabular figures. Avoid uppercase product descriptions, giant order identifiers and technical placeholder copy.

Spacing: 4/8/12/16/24/32/48/64px scale. Phone gutters 16px, tablet 24px, desktop 32px. Control height 44px, major purchase actions 48px; inputs retain 16px text. Card radius 12–16px, field/button radius 10px. Form max width 480–560px, reading 720–800px, purchase content around 1120px, catalog/admin up to 1440px. Avoid stacked outer and inner page gutters.

Whitespace should separate decisions. Add relevant content when data exists; do not fill blank space with invented reviews, delivery promises, discounts, certifications or sales counters. Reserve image/control dimensions to prevent layout jumps.

## Shared component implementation contract

| Family | Components / changes | Required states |
| --- | --- | --- |
| Layout | MUI SiteLayout, PageContainer, PageHeader, Section, customer navigation, admin navigation, footer, breadcrumb | Guest/customer/admin/seller, current route, long labels, mobile menu, unknown/forbidden route |
| Actions | Existing Button/IconButton, CartAction, SubmitAction, confirmation actions | Idle, hover, pressed, keyboard focus, disabled with reason, pending, success, failure |
| Forms | TextField, Select/Autocomplete, checkbox/radio/switch, form section/error summary, currency/quantity fields | Label/help/error linkage, required/optional, read-only vs disabled, preserved draft, mobile keyboard |
| Records | ProductCard, OrderCard, AccountRoleBadge, totals, timeline, specification list | Missing image/content, long title, zero/low stock, discount, genuine/no reviews, unavailable variant |
| Tables | Shared generic DataGrid plus cell editors and toolbar/footer | Server search/filter/sort/page, stable rows during refresh, initial empty loading frame, row-save pending/error |
| Feedback | Existing NotificationProvider backed by MUI Snackbar/Alert; EmptyState/ErrorState/LoadingState | One polite/error announcement, deduplication, 5-second snackbar, persistent important failure, retry |
| Overlays | Existing FormDialog, Drawer, media viewer, menu, confirmation dialog | Focus trap/return, Escape, pending dismissal guard, internal scrolling, keyboard and safe-area clearance |
| Media | ProductImage, gallery, PromoCarousel | Fixed aspect ratio, lazy loading, image error, keyboard controls, pause/reduced motion |

All application-owned wrappers and their stories stay under `src/components/mui`; composed domain components stay in focused feature/shared modules. Avoid duplicating MUI built-in props or adding a wrapper without a useful contract. Extend the existing components before creating another parallel system.

## Loading and responsiveness are first-class behavior

1. **Cold start:** a lightweight branded shell appears immediately, with reserved header/search/content geometry and one accessible status. Do not download four decorative images as a prerequisite for useful content. No minimum splash duration, fake percent, or repeated full-screen loading between routes.
2. **Public versus private:** public catalog rendering may proceed when its own data is ready. Account/cart controls remain neutral while identity is unknown; protected routes wait for verified identity. A session-service failure must not masquerade as guest status or expose old private caches.
3. **First section load:** use appropriately shaped catalog/content placeholders where helpful. For the data grid preserve the owner's explicit no-skeleton requirement: stable body height and centered spinner below filters.
4. **Background refresh:** retain results and layout, expose a restrained progress indicator, keep unaffected controls usable, and ignore stale response revisions.
5. **Mutation:** local pending state only. Preserve drafts and previous content. Explain failures next to the affected control and use the snackbar as supplementary feedback.
6. **Slow/offline:** keep already safe content, display factual reconnect/retry guidance, and respect existing 30/60-second budgets. No automatic replay of uncertain writes.

Target immediate visual acknowledgement within 100ms of a tap, measured separately from network completion. Target production p75 LCP <=2.5s, INP <=200ms and CLS <=0.1 as engineering objectives, not current results. Obtain a baseline and reproducible device/network conditions before claiming gains; analytics collection still needs its own approved privacy rules.

Phone acceptance: 320/360/390/430px, tablet 768px, desktop 1280/1440px, 200% zoom and real Android Chrome/iOS Safari. Use a single column where two cards cannot fit readable titles and 44px actions; move to two columns only when content fits. Search and filter controls remain reachable. Dialogs become full-height/full-width as needed, with scrollable content and reachable actions above the keyboard. Sticky purchase bars must not cover content, snackbars, social links or system safe areas. Tables scroll within their own labeled region, not the whole page.

Motion: 120–200ms focus/press/hover transitions and a small cart-count acknowledgement. No continuous decorative motion on every card. All information remains available without hover and animations respect reduced motion. Replace obstructive floating social rails on phones with footer links or a deliberately placed contact action.

## Non-blocking cart and mutation architecture

Do not remove requests: the server owns cart persistence and stock validation. Improve perceived speed by updating reversible UI immediately and reconciling in the background. Existing optimistic updates are the foundation, not missing functionality.

Proposed cart sequence:

1. ProductCard/ProductDetail pass a typed product summary already in memory into the shared cart command; eliminate a redundant product fetch before optimistic feedback.
2. Maintain confirmed and desired quantity per account-generation/product key. Render the desired quantity/count immediately and mark that item as syncing. Navigation, search, scrolling and other products remain available.
3. Serialize writes for the same product and allow independent products concurrently. Coalesce repeated taps into the latest desired quantity with a bounded flush interval; after a confirmed response, send any newer desired state. Prefer absolute-quantity writes and define create-on-first-add semantics explicitly with the server contract.
4. Add a server revision/idempotency contract before enabling rapid-tap queuing across tabs. Handle out-of-order responses, simultaneous tabs, stock caps, deleted products and conflicting edits. Do not confuse a generated row ID with a confirmed cart-item ID.
5. On definite rejection, reconcile that row to confirmed state and show the reason without discarding other products' updates. On timeout/connection loss, outcome is unknown: perform an owner-scoped read before offering an explicit retry. Never blindly replay an increment.
6. Cancel unsent work and suppress old responses on logout/account-generation changes. Keep pending private state in memory. Reconcile on tab visibility and after successful writes without broadcast customer payloads.
7. Checkout waits for cart synchronization and fetches authoritative totals/availability. It clearly identifies unsynced items instead of pretending a pending cart is confirmed.

| Interaction | Optimistic? | Failure behavior |
| --- | --- | --- |
| Cart quantity / wishlist | Yes, reversible and resource-scoped | Row rollback/reconciliation; explicit retry after uncertain outcome |
| Search/filter/sort/page | Keep current view while loading | Cancel superseded reads; local retry; retain query and scroll context |
| Profile/address/support submission | Preserve draft; local pending | Only show saved after confirmation; unknown outcome reconciled where supported |
| Admin inline price/stock/visibility | Editable draft with local save state | Server validation/version conflict; preserve draft; no catalog-wide optimistic success |
| Checkout/payment/refund/order transitions | Never financially optimistic | Server/provider truth, existing idempotency and terminal-state guards |

Before coding, add behavioral cases for rapid +/−/remove, two independent products, insufficient stock, 401/429/timeout, unknown commit, navigation during sync, logout/account switch and multi-tab conflict. No global blocking backdrop for cart updates.

## Page-by-page migration and content plan

| Route / area | Proposed experience and useful content | Dependencies |
| --- | --- | --- |
| Startup + shared shell | Compact brand, useful public shell, prominent search, clear role navigation, compact footer and accessible mobile menu | Token foundation; separate public/private loading |
| `/` Home | Short hero and one clear CTA, browsable categories, curated useful-product collections, new arrivals, real price-based discovery, policy-backed service links and newsletter | Real merchandising data; no invented popularity claims |
| `/products` | Search summary, result count, active filter chips, mobile filter/sort sheet, product-focused first viewport, stable media, clear end/retry state | Server facets/query contracts; preserve cursor behavior |
| `/product/:id` | Gallery, readable title/price, availability, genuine reviews, short benefits/specifications, what is included, care/compatibility, policy links, related items by real category | Optional structured product fields; variant and serviceability work separate |
| `/cart` | Readable item rows, selected options, inline quantity feedback, total breakdown, missing/changed-stock notice and clear checkout action | Shared optimistic coordinator; authoritative quote |
| `/checkout` | Address add/edit in context, final charge breakdown, coupon feedback, clear order/payment progression and recovery | Preserve server totals, launch free-delivery policy and Razorpay gates |
| `/orders`, `/orders/:id`, `/orders/shipments`, `/track-order` | Compact order history, payment/status clarity, actual timeline, shipment links, address/total summaries and relevant support/return actions | Owned DTOs and recorded events only |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | Consistent forms, password visibility, useful error summary, clear resend/pending state and safe return destination | Existing identity, CSRF and recovery contracts |
| `/profile` | Separate account security, personal details and saved addresses; role label; compact mobile editors | Existing ownership/password-confirmation rules |
| `/support`, `/support-requests` | Help topics, contact form, attachment guidance, ticket conversation/status, preserved drafts | Public help vs authenticated records; configured support service |
| Policy routes | Readable headings, published version/date, section navigation for long documents | Owner-approved policy content only |
| `/shops`, `/shops/:slug` | Seller identity, category/product discovery and clear availability | Publication/purchasing eligibility gates |
| `/seller`, `/seller/products`, `/seller/orders` | Consistent workspace navigation, application state, draft editor/media, scoped order workflows | Version/approval gates and prepared migrations |
| `/admin` Overview / Analytics | Clear operational summary and actionable exceptions; distinguish empty/failed data and account roles | Existing real aggregates; proposed metrics need server contracts |
| Admin Products / categories | Shared grid with inline editing, media preview, publishing and inventory context, full editor drawer | Server validation, conflict handling, future SKU contract |
| Admin Orders / Payments / Returns / Shipments | Dense but readable records, status filters, selected-record details and explicit confirmed outcomes | Preserve all financial/fulfillment guards |
| Admin Customers / Messages / Feedback | Account-role clarity, scoped history, composing/validation/pending/saved states | Accurate persisted roles, privacy/minimal DTOs |
| Admin Settings / Policies / Coupons / Notifications | Grouped forms, clear save state, draft vs publication, retry eligibility and audit context | Approval/version/idempotency rules |
| `/admin/sellers`, `/admin/seller-products`, `/admin/fulfillment`, `/admin/support` | Reuse workspace shell, grids, details and dialogs with role-aware access states | Scoped moderation/inspection/support contracts |
| Wishlist redirect, unknown routes, access denied, offline/error boundary | Deliberate recovery and navigation; do not quietly re-enable retired routes | Existing `/wishlist` redirect remains until separately changed; verify help/tour route registration |

Content gaps to prepare in authoring: product short benefit, structured specifications, dimensions/material/care, package contents, compatibility and category-specific option definitions. Fields are optional until real data exists. Sports equipment needs material/type/size; clothing and shoes require SKU inventory and size guides; medicine commerce remains gated. Additional related products, recently viewed, stock alerts, comparisons, guest cart and saved-for-later are separately scoped enhancements, not assumed to exist. Recently viewed/analytics persistence needs approved storage/privacy behavior; guest checkout requires its own identity/abuse design.

## Grid specification

Keep the generic shared name `DataGrid`. Global search right; per-column filters directly below headings; no redundant count chip or filter-disable button. Server search/filter/sort/pagination and bounded page sizes; page reset on changed criteria; stable tie-break sorting. One range label, rows-per-page selector and direct page jump for 1,000+ pages. Preserve data and body dimensions during fetch; centered body spinner never covers header/filters. Accessible sort state, long-name truncation with access to full text, tabular money and labelled row actions. Price/original-price/stock/visibility editors share field sizing, validation, save/retry and conflict feedback. On phones allow intentional table scrolling or a task-appropriate record view, with consistent functionality.

## Scalability and implementation structure

Separate route shell, feature reads/mutations and domain components. Split AdminPage into section modules and lazy-load routes/editors. Keep one React Query client and generation-scoped private keys. Deduplicate reads, cancel stale searches, scope invalidations and avoid refetching every dataset after one row edit. Keep sensitive replies/errors private/no-store; public caching applies only to safe catalog DTOs with an explicit invalidation policy.

All large lists need bounded server queries; review stable cursors/sort keys and indexes with query plans before adding indexes. Keep product media dimensioned/responsive with lazy loading below the fold; prioritize only the actual lead image. Profile the DOM before choosing virtualization. Keep the single Vercel dispatcher and existing prepared migration workflow. Do not introduce queues, services or paid MUI features without a concrete requirement. Record bundle/request/render baselines; scalability is not established by changing component libraries.

## Delivery sequence and completion gates

| Batch | Deliverable | Exit condition |
| --- | --- | --- |
| RB-01 | Token/theme proposal implemented in shared wrappers; representative Home, card, form, grid, dialog and feedback stories | Contrast/keyboard/reduced-motion and phone width review; coherent legacy bridge |
| RB-02 | MUI shell/navigation/footer and startup/loading architecture | Public/private loading isolation; guest/admin states; no splash on ordinary actions; route error recovery |
| RB-03 | Cart interaction coordinator and read/cache behavior | Rapid-tap/concurrency/rollback/unknown-outcome tests; other controls stay usable; checkout synchronization |
| RB-04 | Home, Products, ProductCard and Product Details content/layout | Real content, stable media, search/filter state and mobile purchase controls |
| RB-05 | Cart, Checkout, Orders, Detail, tracking and returns | Complete purchase/recovery journey; no optimistic financial outcomes |
| RB-06 | Authentication/Profile/Support/policies and notification/dialog migration | Form drafts, focus/keyboard, expiry, inline errors, role boundaries |
| RB-07 | Generic grid and all 14 admin sections + standalone admin routes | Server query semantics, inline editors, mobile/empty/error/pending coverage per tab |
| RB-08 | Shops/seller application/catalog/media/fulfillment | Shop isolation, moderation gates and workspace consistency |
| RB-09 | Remove unused Tailwind/Radix/legacy feature styles after import/consumer audit; final performance/accessibility regression | Every active route inventoried; safe dependency removal; measured results and owner acceptance |

RB-01 and RB-02 should be the first implementation batch, followed by cart responsiveness and a Home-to-Product vertical slice. Do not start with unrelated page recoloring. Each batch updates PAGE_INVENTORY and PROJECT_STATUS once, with implementation and verification recorded separately in APPLICATION_BACKLOG. Rollback should be possible per batch; deploy shared frontend/server contract changes together when needed. No calendar estimate until the first batch establishes actual scope and review effort.

Required acceptance: loading/empty/error/pending/success states; long/missing content; phone/tablet/desktop; keyboard and focus return; reduced motion; dialog/snackbar layering; slow/offline/429/session expiry; private account/shop isolation; server query and financial regressions. Run relevant offline tests/types/build at the agreed checkpoint. Owner production/device tests and deferred Playwright setup remain separate; do not claim responsiveness from a build alone.

## References and how to use them

- [IKEA India](https://www.ikea.com/in/en/): observed public category navigation, use-case collections and product bundles. Adapt clear discovery and purposeful content; do not copy its scale, loyalty program or delivery promises.
- [Decathlon India](https://www.decathlon.in/): public sports-commerce reference for the planned category expansion; detailed mobile purchasing behavior was not verified from the text crawl.
- [Baymard product listing overview](https://baymard.com/blog/product-listing-page-plp-ux) and [mobile product-list examples](https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/product-list): inform comparison-friendly cards and reachable mobile filtering. These are research references, not proof that Gadgify has passed usability tests.
- [MUI theming](https://mui.com/material-ui/customization/theming/) and [breakpoints](https://mui.com/material-ui/customization/breakpoints/): implementation references for shared design tokens and responsive components; respect installed package versions.
- [TanStack optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates): cache update, rollback and reconciliation foundation. The proposed multi-tab mutation protocol still needs application-specific design and tests.

Public reference pages were read on 2026-09-30. No authenticated competitor checkout or full rendered competitor usability test was performed.

Schema companion: [SCHEMA_EVOLUTION_PLAN.md](SCHEMA_EVOLUTION_PLAN.md) contains the Prisma/migration audit, proposed records and SE-01?SE-05 dependency sequence.
