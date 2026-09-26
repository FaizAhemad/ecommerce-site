# Project status

## Home primary CTA text contrast - 2026-09-26

Fixed the Home “Explore the collection” link whose dark label was inheriting the body color over the dark primary-button background. The unlayered global anchor color now excludes shared primary/secondary button links, allowing the shared controls variant to own foreground and background colors consistently. `npm run build:offline` passed; rendered/browser contrast acceptance remains pending.

## Products grid overlap and scroll regression - 2026-09-26

The first row-height correction did not resolve scroll jumps. Removed the unnecessary absolute-position virtualizer and replaced it with `ProductGrid`, which renders cursor-loaded products in normal CSS grid flow. The grid shares ProductCard across Home and Products; the API returns bounded cursor pages. The native grid determines row heights and keeps the collection divider/footer after content. `npm run build:offline` passed; rendered/device acceptance remains pending.

## Production ESM import resolution - 2026-09-26

The reported production crash came from a runtime value import in `order-transactions.ts` that explicitly referenced `marketplace-purchases.ts`; Vercel emits/loads the server module as JavaScript, so Node could not resolve that TypeScript extension. Replaced all server-side `.ts` relative import specifiers with `.js` specifiers (NodeNext resolves these to TypeScript sources for type checking and the emitted JavaScript files at runtime). `npm run build:offline` passed and no server imports ending in `.ts` remain; production deployment/runtime acceptance remains pending.

## Default product seed entries - 2026-09-26

Extended `prisma/seed.mjs` with the 18 requested platform product names and starter categories. Missing products are created at ₹100 (`priceMinor: 10000`), zero stock, active catalog visibility, and a neutral “Default” swatch; idempotent upserts do not overwrite later edits. The seed was not executed against any database. Production ownership depends on the owner-applied marketplace migration/trigger; no database or migration checks were performed.

## Products pagination loading feedback - 2026-09-26

The “Loading more products” label had one render site in `ShopPage`, where it followed the broad `isFetching` state and therefore appeared on initial/background catalog refreshes. Changed it to `isFetchingNextPage`, removed the unused visible sentinel line, and announce the message accessibly while an explicit next-page request is in progress. `npm run build:offline` passed (existing large-chunk warning); tests and rendered acceptance remain deferred under owner instructions.

## Products route Tailwind migration - 2026-09-26

Configured Tailwind CSS v4 through its Vite plugin and added Radix Dialog plus Lucide/utility-class helpers. Migrated the Products page header, promo banner, desktop filter aside, mobile filter Sheet, shared ProductCard/grid, product skeleton, empty/error/end states and fractional stars to Tailwind utilities. The Sheet uses Radix focus containment/restoration and Escape handling; desktop retains the sticky sidebar, while mobile uses a dedicated drawer. Existing theme variables remain shared with the legacy stylesheet; unrelated routes are not migrated. `npm run build:offline` passed; Vite reports a 606.19 kB main JavaScript chunk warning. Rendered phone/tablet/desktop acceptance remains pending.

## Product card title and surface refinement - 2026-09-26

Restored a subtle border, warm raised surface and restrained shadow. Changed the shared card information area to stack category/title/seller above a full-width price/wishlist row, giving titles the card's full text width and preventing short names from breaking beside large prices. Matched the CTA inset to the framed card. Source-only; browser/mobile rendering and regression checks remain pending.

## Product catalog card density - 2026-09-26

The product grid now auto-fits 230px minimum columns up to a 260px shared card width. Virtualized rendering measures the actual catalog container and derives its column count from the same minimum width and gap as CSS, so it no longer renders only two products into a wide desktop grid. Reduced excess metadata minimum height so price and rating sit closer to the title. Source-only; no browser/device checks or automated checks were run under current owner deferrals.

## Product card wishlist placement - 2026-09-26

Moved the shared product-card wishlist button beside the title with a quieter outline treatment after the image overlay looked too prominent. Reserved compact consistent slots for seller attribution, optional discounts and swatches, and aligned cards and add actions within each grid row. Accessible label and pressed/pending states are preserved. Rendered and phone tap-target verification remain pending.

## Product card and skeleton size consistency - 2026-09-26

Reserved matching title/wishlist, seller, price, rating and swatch areas so optional product data does not change card height within a row. Updated the Products loading skeleton to use those same slots and the title-row wishlist position; its add-action spacing now follows the loaded card. Source-only; rendered parity and device acceptance are pending.

## Blob upload failure diagnostics - 2026-09-25

Admin product-media and customer review uploads now log an allowlisted Blob exception category with fixed phase/endpoint values and the sanitized request ID. Credentials, file data, URLs and raw exception messages stay out of logs and the generic 503 response is unchanged. This supports diagnosis on the next local/production request; it cannot recover the cause of earlier failures. Source-only; no local API/provider call, tests, lint or build were run.

## Shared product and loading card sizing - 2026-09-25

Standardized the ProductCard maximum width and square media across Home, Products and Wishlist. The Products skeleton reserves the same information, rating, swatch and CTA rows as a loaded card. The former virtualized catalog row offset was later removed on 2026-09-26 after screenshot evidence showed scroll jumps; the catalog now uses natural CSS grid flow. Source-only: rendered comparison and mobile acceptance remain pending.

## Product card title, price and color pass - 2026-09-25

Updated the shared `ProductCard` used by catalog and wishlist views: long names wrap safely and clamp to two lines, the current selling price has stronger hierarchy and can wrap in narrow cards, saved product colors render as larger circular swatches using catalog hex values, and valid optional compare-at data renders with a struck-through original price and computed discount. Added the optional compare-at schema field, prepared additive migration, public DTO mapping, validation and admin/seller input. Checkout continues to use `priceMinor`. Migration and Prisma Client regeneration remain pending; no tests, lint, build or rendered/mobile checks were run under the current owner deferral. See [PRODUCT_PRICING.md](PRODUCT_PRICING.md).

Prisma Client regeneration was attempted to resolve the stale generated-type diagnostic shown in the owner screenshot. Windows denied replacing the loaded `query_engine-windows.dll.node`; the generation stopped and its temporary engine artifact was removed. No migration or application process was stopped.

## Fractional shared rating stars - 2026-09-25

Added `RatingStars`, which draws five independently clipped SVG stars from a clamped 0–5 numeric rating. Product cards, the product detail rating summary and customer review rows now share it; fractional values render partial stars while whole rating values render exactly that many filled stars. Visual/browser and accessibility checks remain unverified; no tests or builds were run under the current instruction.

## Product card image edge and frame refinement - 2026-09-25

Removed the card's outer border and inset padding so the square product image fills the card width. Kept text and actions inset below the image, retained a visible non-black keyboard focus ring, and matched the loading skeleton image ratio to loaded cards. Source-only; no browser/mobile verification or tests were run.

## Homepage screenshot UI pass - 2026-09-25

Applied a focused mobile storefront pass from the owner's homepage screenshot. The mobile header now uses tighter spacing and a single horizontally scrollable navigation row instead of wrapping links into a tall block. Hero spacing and artwork height were reduced, heading/body sizing was constrained for narrow screens, and homepage section gutters now match the 16px mobile token. Existing palette, navigation behavior, product actions and responsive semantics remain intact. Browser recheck is blocked by the current automatic review usage limit; source changes are recorded as unverified until the page is rendered again.

## Luna analysis and Astra handoff - 2026-09-25

Added [LUNA_ANALYSIS.md](LUNA_ANALYSIS.md) with the application-wide color, spacing, typography, layout, wording, component and page review direction. Added [ASTRA_CHANGES.md](ASTRA_CHANGES.md) as the implementation handoff for the next agent, including current shared-foundation changes, safeguards and sequence. These documents do not claim UI completion or production readiness.

## Shared visual foundations started - 2026-09-25

Aligned README/TARGET/REQUIREMENTS with the component-wide UI guide and started the source consumer inventory in PAGE_INVENTORY.md. Consolidated three base button definitions into controls.css, standardized button typography/padding/wrapping, added shared font/spacing/control tokens, set central page gutters to 16/24/32px, and increased snackbar dismissal targets to 44px. Existing focus/disabled rules, notification timing/queue and application behavior retained. No tests/lint/build, rendered/device checks, environment reads or live operations performed. UI-01/02/09 remain pending; page-local typography/cards/forms and startup redesign remain.

Catalog loading skeleton pass - 2026-09-25
The `/products` initial loading state now has a compact, card-shaped skeleton: image silhouette, badge/heart affordance, category/title/price, rating and add-action placeholders. Contrast was raised within the warm neutral palette and animation is disabled for reduced-motion users. This is source evidence only; no browser/device verification or tests were run under the current owner deferral.

Follow-up screenshot pass: strengthened the central product silhouette and price placeholder contrast after reviewing the supplied loading screenshot. The screenshot remains an owner-provided observation; browser recheck is still separate.

Skeleton header alignment pass: explicitly scoped the badge and circle positions so the shared product-art span rule cannot overlap them.

Palette refinement: adjusted shared paper, muted text and border tokens for stronger hierarchy and added named skeleton contrast tokens. Loading styles now use the tokens instead of page-local neutrals. Source-only; visual browser/device acceptance remains deferred.

Homepage palette refinement: brightened the shared paper/surface neutrals and increased the sage contrast of hero and product-art surfaces. This addresses the supplied home-page screenshots where the hierarchy appeared washed out while retaining readable dark text and controls. Source-only; browser/device acceptance remains deferred.

Footer social icon fix: the footer link color reset used `!important`, which overrode the white icon color inherited by the colored social buttons. Added a scoped footer social override so footer SVG icons match the white icons in the fixed social rail.

Shared typography/card pass: added display/body font, size and line-height tokens and applied them to the catalog product-card title, category, seller and price. This is a focused consumer migration; the full route/component audit remains pending.

Brand/loading implementation: the app bootstrap screen now uses a shared Gadgify G lockup and wordmark, and the site shell has a subtle sage radial background accent. These are native CSS/markup assets and remain source-level until browser/device review.

Loader first-paint refinement: added a document-level warm background so the page does not flash blank before React mounts, enlarged and aligned the G/wordmark lockup, and improved status text sizing and loader contrast.

Loader visual scale refinement: enlarged the startup lockup and status hierarchy, strengthened the centered sage glow, and added a restrained progress accent with reduced-motion handling so the full-screen state does not read as an empty page.

Loader copy pass: changed technical status labels to “Checking your account…” and “Getting things ready…”, and moved the status text to the display typeface with a lighter centered progress accent.

Header search refinement: expanded the search field into a 360px responsive panel below the header with a 50px touch target, readable 15px input text, focus-visible treatment, and reduced-motion-safe entrance animation.

Filtered-empty catalog pass: replaced the thin no-results strip with a centered empty-results panel, branded mark, clear heading, explanatory copy and clear-filters action. The panel uses the shared surface, typography and accent tokens and has a shorter phone layout.

Filter control refinement: the “Show/Hide filters” control is now a compact mobile-only disclosure button; the filter fields correctly collapse when `data-mobile-expanded="false"`, while desktop keeps the sidebar open without showing a contradictory oversized button.

Filter toggle behavior fix: the disclosure now owns an explicit expanded/collapsed class, starts open, and collapses the filter fields without translating the sidebar off-screen. Desktop and phone layouts retain a visible reversible control.

Collapsed-filter visual fix: neutralized the legacy vertical rail rule for the new collapsed class so the “FILTER” label stays horizontal and the compact toolbar remains readable when fields are hidden.

Product card polish: the shared catalog card now has a light surface shell, consistent radius and internal padding, rounded media, clearer action spacing, and a restrained hover elevation while preserving the existing focus state and skeleton variant.

Product card hover/layout refinement: cards now keep a raised surface and border in the resting state, use a restrained hover tint instead of appearing suddenly white, and catalog cards no longer stretch their add action to the bottom of an unnecessary full-height flex row.

Catalog density refinement: wide desktop layouts now render five product cards per row at 1440px+, standard desktop remains four and phones two. Prior virtualization column calculations were removed on 2026-09-26 after scroll-jump reports; responsive rendering still needs browser acceptance.

Loading-grid spacing fix: retained the reserved skeleton viewport height but set the skeleton grid’s row alignment to start with an explicit 32px row gap, preventing the reserved height from stretching the space between rows. Loading and loaded states continue to use the same product-card structure and shared card styles.

Single-card scale refinement: reduced the desktop single-product grid width to 260px after the supplied screenshots showed the one loaded card still dominating the catalog. Multi-product five-column density remains unchanged.

Single-card compactness refinement: reduced the one-product width to 220px and removed catalog-only minimum heights from product info, rating and swatch rows so the loaded card does not retain the large blank band reserved for multi-product alignment.

Product-card internal rhythm pass: tightened card padding and metadata spacing, aligned the price/wishlist row, reduced the mobile action gap, and standardized the add-to-cart control to a 42px minimum touch height with consistent horizontal padding.

Product-card title and wishlist pass: product titles now wrap safely at any length without pushing the price/action column out of the card; the price and heart action are aligned in a dedicated grid column. Existing wishlist behavior is already account-backed: authenticated toggles POST/DELETE `/api/wishlist`, guests receive a sign-in message, optimistic state rolls back on failure, and the Wishlist page reconciles server state. No navbar entry was reintroduced because it was intentionally removed earlier.

Product-card visual hierarchy pass: changed the shared card media to a balanced square tile, strengthened title and price hierarchy, reduced the wishlist control to a secondary circular action, grouped the rating in a compact pill, and standardized the CTA to a rounded 44px touch target.

Platform seller-label refinement: platform-owned Gadgify products no longer show redundant “Sold by Gadgify” copy on cards or product details; external approved marketplace products continue to show their shop attribution and link.

Auth snackbar refinement: sign-in-required errors now include a direct “Sign in” action that preserves the current path/query as `returnTo`, while the snackbar sits above card actions to avoid covering the add-to-cart control. Dismiss remains available and the existing five-second timeout is preserved.

Shared page-height fix: `site-shell` is now a full-viewport flex column and `PageContainer` grows to fill remaining space. Short routes keep the footer at the bottom of the viewport, while content-heavy routes continue naturally without a forced fixed height.

Catalog loading layout fix: restored a responsive reserved height for the initial skeleton grid (980px desktop, 1180px phone) so the footer does not jump directly beneath loading cards before catalog data resolves.

Sparse catalog layout fix: catalogs with six or fewer products render in natural grid flow; the former larger-catalog virtualizer was removed on 2026-09-26 after further scroll-jump reports.

Loaded catalog card pass - 2026-09-25
Product cards now use a dedicated muted seller-attribution style and tighter mobile information spacing, keeping image, seller, price, rating and add action visually grouped. The shared `ProductCard` is used by both catalog render paths. Source-only; rendered acceptance remains deferred.

## Complete UI component scope - 2026-09-25

Expanded UI_UX_REVIEW_GUIDE.md to cover every component, page-local control, notification, overlay and applicable interaction state. Added component-to-consumer inventory requirements alongside route coverage; shared tokens/layout/primitives precede isolated loader changes. Aligned agent instructions and UI backlog scope. Documentation only; inventory execution, redesign and rendered/device verification remain pending.

## Architecture and AI working standard - 2026-09-25

Added the owner-requested senior architecture standard and token-efficient execution workflow to AGENTS.md, with matching references in Codex/Copilot instructions. Covers cross-disciplinary judgment, targeted context reads, shared-component reuse, concise batch reporting/documentation and evidence-based AI work. No application code, dependencies or verification settings changed.

## UI testing strategy documented - 2026-09-25

Documented Playwright Test plus axe accessibility checks, retained Node.js validation/security suites and optional future Vitest in UI_UX_REVIEW_GUIDE.md. Added full-route/state/viewport coverage, reviewed screenshot baselines, isolated synthetic fixtures, separate provider acceptance and CI/release evidence expectations. Added a pending backlog entry. Documentation only: no dependency installation, tests, live operations or change to verification deferrals.

## Application-wide UI review instructions - 2026-09-25

Added UI_UX_REVIEW_GUIDE.md with shared-first review order, route/tab/state/viewport coverage and evidence requirements. Owner targets publishing in 10-15 days; guide now includes consistent color/spacing/typography/wording rules and a proposed sequence reserving final days for verification. This is planning, not a readiness claim. Owner screenshot shows bare full-screen session loading; App.tsx source confirms standalone app-loading before SiteLayout. Loader redesign is pending under UI-09. No rendered/browser review, tests or live operations performed. Instruction files now require whole-application coverage and distinguish source changes from observed acceptance.

## UI-07 Gadgify checkout - 2026-09-25

Implemented phone-first checkout styling in PaymentPage.css using shared PageContainer, button and summary patterns, plus reusable OrderTotals with component-owned CSS. Fixed the legacy mobile rule hiding saved address text by replacing the conflicting payment-option classes. Full address/phone and India eligibility are visible; server quote shows subtotal, discount, delivery, tax and payable amount. Submission freezes the cart/address/quote snapshot and coupon controls, preserves the original UUID for explicit retry even after quote failures, and prevents background cart/profile errors from discarding that attempt. Added persistent inline checkout/payment feedback and session-generation guards. Razorpay capture verification and server financial rules are unchanged. No environment access, live/provider calls, migrations, deployment or tests/lint/build/browser commands run. Source implementation is not production completion; final keyboard/mobile, concurrency, rejected/uncertain submission and provider test acceptance remain pending.

## UI-04 shared message composer - 2026-09-25

Moved Admin Messages composition into existing FormDialog, reusing its mobile drawer, pending dismissal protection, native modal/focus behavior and notification portal. The mounted form retains drafts across close/reopen and history paging; a resume control distinguishes draft/saved states. Persistent inline send errors/outcomes supplement the five-second snackbar. Existing UUID, authorization and session guards are retained. No new modal or CSS system introduced. Source inspection only; tests/lint/build/browser/mobile checks remain deferred. Whole-application shared-component adoption is ongoing, not complete.

Admin message history ? 2026-09-24

Replaced the latest-100 cutoff with bounded 25-message keyset pagination ordered by creation time/id, validated cursors and private no-store responses. Admin panel adds older/newer/refresh controls without clearing the composer, returns to latest after a saved message, and guards asynchronous mutation feedback with session generation/signal. Existing admin authorization, UUID send binding and provider acceptance semantics remain. Source reviewed only; tests/lint/build and authenticated/device acceptance deferred.

Mixed-order platform handling ? 2026-09-24

Gadgify child shipments/returns within an order containing external-shop groups now use scoped fulfillment. The server derives routing from stored shop groups inside the transaction; only admins manage platform shipments and customer return requests remain owner-scoped. Gadgify-only orders retain legacy shipment/return workflows. Shared UI follows the selected routing flag. No parent financial status, stock or sibling group is changed. Regression cases authored, not run; migrations, generated Prisma, runtime/concurrency/device acceptance remain pending. External-shop purchasing is still disabled. No environment inspection, live calls, migration, deployment or verification commands run.

## Optional shop quality inspection — 2026-09-24

Implemented admin-requested inspection on external-shop orders before customer dispatch: receipt, pass/fail, return-to-shop and replacement stages, server dispatch hold, three private 1 MB evidence photos, admin-only call notes, scoped list/detail views and audit. Generic seller email jobs recheck active membership/shop approval and verified address before sending. Up to two jobs are attempted post-commit; the worker handles remaining jobs. Customer DTOs exclude findings/photos/call notes; generic Settings cannot access reserved inspection records. Owner was unsure about universal inspection, so mandatory inspection/central dispatch is not enabled. QUALITY_INSPECTION.md records workflow and limits. Marked MP-05c and MP-10a coding scopes done under the owner's source-only tracking request; verification and business decisions remain pending. Regression cases authored, not run. No environment read, migration, provider/live call, test/lint/build/format or deployment performed.


## MP-05 shop shipment and return notifications — 2026-09-24

Added shop-scoped dispatch/delivery and return approved/rejected/received jobs to the existing private notification queue. Fulfillment mutations enqueue after conditional status/event writes in the same transaction, then reuse post-commit processing. Version-bound keys isolate shops and suppress duplicates; recipients derive from the order owner and verification is rechecked by the processor. Copy escapes shop/order text, omits delivery addresses and decision bodies, and explicitly avoids payment/refund/settlement claims. Existing Gadgify shipment notifications remain unchanged; legacy return email coverage is not added. Admin Notifications recognizes the new kinds. Regression cases authored and included in test:marketplace, not executed. No environment reads, migration, live/provider calls or deployment. Worker scheduling, delivery, browser/device and deferred checks remain pending.


## Owner-requested coding completion marks — 2026-09-23

Split marketplace entries in APPLICATION_BACKLOG.md into checked coding scopes MP-01a/02a/03a/04a/05a/08a and separate unchecked remaining work/acceptance entries. The owner explicitly requested marking the implemented work done. These marks acknowledge source implementation described in the dated entries below; they do not establish verified feature completion. No additional code, tests, migration, provider call or deployment occurred in this tracking update. MP-06, MP-07, MP-09 and the remaining b-scopes stay pending.

## Newsletter duplicate prevention — 2026-09-23

Replaced unconditional upsert with unique create/conditional UNSUBSCRIBED reactivation before provider calls. Only the winning activation sends audience/welcome requests; active duplicates return 409 ALREADY_SUBSCRIBED. Home shows “This email is already subscribed.” inline and as an error snackbar, retains the entered address and disables submission. Email normalization and unique constraint cover case/whitespace and concurrent requests. Local subscription is authoritative: provider failures after activation retain the saved subscription and use existing partial-success reconciliation; repeat subscribe does not retry provider synchronization. Corrected welcome branding to Gadgify. Regression cases authored/updated, not executed; no env inspection, provider/database calls or deployment.


## Seller media storage management — 2026-09-23

Added metadata-only usage inventory and a seller workspace drawer with on-demand previews and confirmed deletion. Server rechecks approved shop membership and saved/archived draft plus catalog-image/video references in a serializable transaction; timestamp-conditional deletion protects stale records. Delete actions are rate-limited and session-scoped; successful removal clears preview/upload caches. Existing 100-file/1 MB limits remain. Regression cases authored, not executed. No env reads, migration, database/provider, browser/device, test/lint/build or deployment checks performed. No new migration; existing marketplace schema prerequisites remain. Full documentation deferred.


## Dispute notification outbox — 2026-09-23

Dispute writes now enqueue version-bound notification jobs in their transaction, then attempt sending after commit. Non-admin actions notify private SUPPORT_EMAIL; seller/admin actions notify the verified order customer. Customer ownership/email is rechecked on each attempt. Staff destination is frozen on first attempt and configuration changes block replay. Existing bounded queue/idempotency/lease behavior is reused; Admin Notifications and worker support the new kinds without exposing recipients or bodies. Generic emails omit conversation/customer address content. Tests authored but not executed; no env inspection, provider calls, migrations or deployment performed. Worker scheduling and delivery/device acceptance remain pending; full documentation remains deferred.


## Shop support and private email routing — 2026-09-23

Added order-scoped support conversations to existing fulfillment APIs/drawers: UUID author/content binding, version guards, bounded messages, escalation, admin-only resolution, selected public roles, list filtering and private/no-store responses. Reserved dispute records cannot be accessed through generic Settings; added sanitized audit events and normalization for older seller audit shapes. Public support address now appears on Support/footer; existing support form uses server-only SUPPORT_EMAIL. Direct incoming mail requires provider forwarding and is not intercepted by the website. Dispute conversations are in-app, not emailed automatically. Regression cases authored, not run; no env reads, migrations, live calls or deployment. Full documentation deferred by owner; all verification remains pending.


## Seller product publication and purchase safeguards — 2026-09-23

Added transactional publication/withdrawal, shop-namespaced Product ownership, reapproval stock deltas, public seller/availability DTOs, catalog links, approval-checked binary media, sitemap/SEO filtering and server cart/quote/order eligibility. Legacy admin editing cannot bypass moderation. External-shop purchasing remains disabled pending commercial decisions; this is not completed mixed-shop checkout. Requires both marketplace migrations and regenerated Prisma types before rollout. Authored policy/rollback regression cases and test:marketplace; no tests/lint/build/format, migrations, provider or browser checks run. See MARKETPLACE_PURCHASING.md.


## Shop fulfillment implementation — 2026-09-23

Added SellerOrder grouping/events/returns, prepared backfill and compatibility triggers, scoped seller/admin/customer APIs and shared shipment/return drawers. Gadgify-only legacy flows remain separate; financial writes and mixed-shop sales are not enabled. Transition tests authored, not run. No migration, Prisma generation, tests/lint/build, live or device checks executed. See SELLER_FULFILLMENT.md for rollout, gaps and owner acceptance; MP-05 remains pending.


Reviewed: 2026-09-13. This describes the current workspace, including staged implementation. It does not certify the deployed revision or production readiness.

[APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) is the only completion checklist. A checked item needs implementation and relevant verification evidence. A build alone does not establish live behavior. Earlier snapshots are preserved in [historical status](docs/history/PROJECT_STATUS_BEFORE_SYNC.md); contradictions there are superseded by this document.

## Verification evidence

## Connected marketplace pages - 2026-09-23

Added seller product workspace, private media, admin product moderation, snapshot-scoped order reads and approved public shop directory/showcases, with shared navigation and drawer forms. Drafts are isolated reserved records and never enter Product/checkout. Public media checks approved shop/content/reference; edits reset moderation and remove showcase visibility. Added quota/storage bounds, audit and synthetic validation/invariant cases. No tests/lint/build, migration, browser/device, live provider/database or deployment checks were run. SELLER_WORKSPACE.md records remaining financial, fulfillment, media operations and rollout gates; marketplace is not complete.

## MP-02 seller onboarding - 2026-09-22

Added /seller and /admin/sellers, private application APIs in the sole dispatcher, verified-email submission, selected account-owned status and paginated admin review. Approval creates shop/membership transactionally, suspension revokes access, decisions require versions/reasons and write audit records. Reserved application storage is hidden from Settings; seller API requests use private session guards and submission quotas. Regression cases authored but not run. No migration, live check, provider call or deployment performed. Seller catalog/publication/payout capabilities remain disabled; SELLER_ONBOARDING.md records acceptance gaps.

## MP-01 ownership foundation - 2026-09-22

Prepared Shop, ShopMembership, ShopProduct and ShopOrderItem relations and transactional migration/backfill to Gadgify's platform shop. Compatibility triggers assign future platform product ownership and snapshot new order-item shops. Existing scalar commerce fields and User.role are unchanged. Added fail-closed parameterized approved-membership/product-scope helpers and synthetic access cases. No seller endpoint/UI is exposed; existing public/checkout queries are not marketplace-ready. No migration, Prisma generation, test/lint/build or live checks were executed. MARKETPLACE_MIGRATION.md records rollout, preservation and recovery requirements. MP-01 remains unverified, not completed.

## Marketplace priority decision - 2026-09-22

Owner approved multi-vendor marketplace requirements as first priority, superseding UI-first and separate-store-only planning. Added MARKETPLACE_REQUIREMENTS.md and MP-01–MP-09 to the sole backlog. Shop ownership/onboarding precedes financial features; fee rules, provider arrangements and seller responsibilities remain undecided. Documentation only: no marketplace routes, roles, schema, charges or payouts implemented and no checks/deployments executed.

## Session expiry - 2026-09-22

Replaced 30-day sessions with customer 30-minute idle/24-hour absolute and admin 15-minute idle/8-hour absolute budgets. Current-user validation rejects expired and legacy overlong sessions. Existing expiresAt supports idle expiry without migration. CSRF-protected rate-limited activity POST renews live sessions; trusted browser interaction drives renewal, not background reads. Added warning/continuation and private-UI clearing via existing expiry handling. Synthetic policy cases authored but not run. No environment inspection, migration, live call or deployment occurred; SESSION_SECURITY.md records acceptance gaps.

## Header scroll stability - 2026-09-22

Removed the scroll-triggered position/min-height/padding change from SiteLayout's header. The header stays sticky and retains its responsive dimensions; scrolling now changes only a shadow. This removes the geometry-changing 180px threshold that could cause scroll anchoring feedback/flicker. Source review only; owner Support-page/mobile scrolling acceptance and deferred checks remain pending.

## Local API failure diagnosis - 2026-09-22

Owner reports products/categories 503 and generic session boundary errors under vercel dev. Added allowlisted Prisma error code/category logging to the existing boundary and product/category catch blocks; raw messages, stacks, metadata and connection details remain excluded. These diagnostics do not fix or establish the underlying cause. No environment file, live database or server was accessed; waiting for classified owner logs. Verification commands remain deferred.

## UI priority implementation - 2026-09-22

UI-01 through UI-05 started. App.css now imports extracted CSS groups in original order; the extraction script compared concatenated output to the original before applying visual edits. Dedicated FormDialog and record-card styles accompany shared tokens and more readable form controls. Product/category, coupon, profile/address and refund forms now use native modal drawers, with scroll locking/focus restoration and pending guards. NotificationProvider portals feedback into the active dialog so errors remain above its backdrop. Admin small-screen navigation scrolls horizontally. No test/lint/format/build, browser/device or production check was run. Source changes are not verified UI completion; numbered remaining scope lives only in APPLICATION_BACKLOG.md.

## Full-refund initiation - E33 - 2026-09-21

Added full-INR refund initiation with provider-fetched capture/amount checks, reserved durable claims and no financial replay. Payments uses an independent private query and confirmation form with preserved failure drafts. Separate provider verification reconciles full refunds and known refund pending/failed states. Synthetic duplicate/timeout/mismatch cases were added but not run. No environment inspection, migration, real refund or deployment occurred. Tests/types/build and owner provider/mobile acceptance remain pending; see REFUND_OPERATIONS.md.

## Order notification retries - E32 - 2026-09-21

New order/shipment transactions persist versioned private jobs. Compare-and-set leases, stable provider keys/payloads, recipient checks, bounded retries and legacy exclusion are implemented. Admin Notifications shows selected queue status and guarded processing; an owner-run worker is provided. No migration, provider call, deployment or deferred test/lint/build command was run. See NOTIFICATION_QUEUE.md for remaining scope. This is not a verified completion checkpoint.

## Backlog completion audit - 2026-09-21

Reviewed the first backlog section through email verification against current source and the existing E18-E29 verification records. Previously verified implementation scopes were already checked. E30/E31 source entry points are present, but no newer test/build, applied-migration or production evidence was supplied; their completion boxes remain pending. Corrected stale claims about missing customer return creation, support attachments/conversations, payment initiation and product SEO. This was a source/documentation review, not execution of deferred checks. The latest historical offline checkpoint is E29; earlier counts do not validate the current working tree.

## Product SEO implementation - E31 - 2026-09-21

Added `server/api/seo.ts` and pure metadata helpers, single-dispatcher routes for product HTML/sitemap/robots, product description/stock/minor-price DTO fields, client metadata updates and SEO regression cases. Production HTML uses the bundled built shell; active product data is read at request time. Published English policies/public routes and active products populate paginated sitemaps. VITE_SITE_URL is required for production canonical/indexing configuration. No migration or additional function is added. See SEO_OPERATIONS.md for exact behavior and limitations.

No E31 test, lint, formatting, build, local/live API, deployment or crawler validation has been run under the owner's deferral. Source is implemented, verification/production readiness is pending.

## Continuous backlog implementation - E30 - 2026-09-21

The current working tree adds coupon administration/redemption, customer return creation, shipment management/tracking, order milestone email attempts, private support attachments/conversations, admin notification history and basic client-managed SEO metadata. These are source changes without a new verification checkpoint.

Coupon usage is recorded with order creation in the serializable checkout transaction. Shipment events and matching order status changes are transactional. Return submission is owner-scoped and limited to delivered orders. Notification attempts use verified account email and milestone keys; ACCEPTED means provider acceptance and UNCONFIRMED is not replayed automatically. Support attachments/replies use owner/admin authorization and prepared migrations. Client metadata marks unknown/account/admin routes noindex and emits canonical URLs only from a valid configured `VITE_SITE_URL`.

No E30 tests, lint, formatting, offline build, migration execution, browser/device checks, provider calls or production checks have run under the owner's deferral. Support attachment/reply migrations are unapplied. Coupon rules, carrier integration, return eligibility, durable notification retries, malware scanning/retention and complete product SEO remain pending. E30 is not a completed backlog checkpoint.

Latest checkpoint: E28 (2026-09-14) adds first-purchase feedback. E27 adds Help/tour, E26 connects return review, E25 replaces the manual refund shortcut, E24 supersedes disconnected-message claims, and E23 supersedes placeholder/payment claims. Historical evidence counts describe their own revisions.

## First-purchase feedback - E28 - 2026-09-14

Added GET/POST /api/feedback and GET /api/admin/feedback through the sole dispatcher. Eligibility uses the owner's earliest recorded CAPTURED/REFUNDED payment order, with private selected responses. POST accepts rating/comment only; user/order IDs are ignored in favor of server identity. Unique per-user storage and transactional insertion reconcile identical retries and reject changed duplicates. Inputs are bounded, queries parameterized, reads private, and writes have CSRF plus 20/IP and 5/account per ten-minute quotas.

Orders and paid/refunded Order Details include independent feedback state; admin has a private latest-100 Feedback tab. No modal blocks orders, no customer payload is stored in the browser, and form failures preserve inputs. Feedback is distinct from reviews. Migration 20260914010000_purchase_feedback is prepared but NOT applied; missing table causes a safe independent 503. The earlier support migration is also still pending owner rollout. See PURCHASE_FEEDBACK.md.

Evidence: 176 tests pass, including five new eligibility/ownership, retry/draft, unpaid-account, validation and quota cases; admin visibility regression includes Feedback. Offline client/API build passes, lint has three previous warnings, formatting remains owner-deferred. Existing generated Prisma types are used; new table access is parameterized SQL. Schema/migration execution, real database contention, provider history accuracy, rendered mobile/keyboard and retention/legal/localization acceptance are not established. No .env inspection or live service action.

## Help and website tour - E27 - 2026-09-14

Added public /help in the shared reading-width layout and primary Help navigation. Accessible disclosure sections link to actual product, account/recovery, order, policy and support routes. Help avoids invented delivery/refund promises and explains separately confirmed payments and missing-policy escalation.

The explicit tour starts on Help and visits Products, Cart, Profile, Orders and Support. SiteLayout retains the in-memory step across route changes; existing login/role boundaries still govern destination pages. Previous/next/finish/exit and Escape controls are supplied, with focused step heading. It is an inline panel, not an overlay or focus trap; there is no automatic start, customer storage, analytics or API write. Page reads happen normally on visited routes.

Evidence: 171 tests pass, including help-link/truthful-content checks and synthetic tour navigation/exit without writes. Offline frontend/API build passes. A new export-related lint warning was removed by keeping tour configuration internal; three prior warnings remain. Browser focus, device layout and full localization still need owner acceptance. Formatting was not run after the owner's deferral instruction. No .env, database/provider/live checks or deployment.

## Return review and admin visibility - E26 - 2026-09-14

Admin Returns now reads the latest 100 real requests through a private query instead of always showing empty. Selected DTOs contain the request, order number and customer name/email needed for review, not complete order/customer/provider objects. The review form requires an explicit approval/rejection and bounded reason; failed drafts survive, clicks share a lock, unmount aborts requests and saved feedback does not promise money or stock changes.

PATCH requires expectedStatus REQUESTED. A Serializable transaction verifies request/order customer consistency and conditionally records only APPROVED or REJECTED. Stale/concurrent decisions and manual REFUNDED/reopening edits fail safely. Approval is a human policy decision, not automated eligibility or a refund. Customer-facing return creation, full history/audit and logistics remain pending.

Fixed a parent visibility gate that could hide independently loaded Settings: Messages, Settings and Returns now use their own loading/error states rather than requiring the legacy parent load flag. Regression invokes AdminPage for all three tabs and verifies visible content containers. Total 169 tests pass, offline frontend/API build passes, lint retains three prior warnings. Formatting checks completed before the owner requested formatting be deferred; future formatting is owner-managed. Browser/device/provider checks remain unperformed under the production-only workflow.

## Refund status integrity - E25 - 2026-09-14

The former admin refund action only updated database statuses. PATCH /api/admin/payments now rejects that action and accepts reconcile-refund instead. It fetches the stored Razorpay payment server-side and requires matching payment/order IDs, amount and currency, refunded status, full refund_status and amount_refunded equal to the entire order amount. A successful check conditionally updates payment/order together in a Serializable transaction. It never restocks, sends a refund request or assumes partial refunds are full. Provider full-refund status does not prove bank settlement.

Admin Payments now offers Verify refund with explicit instructions that an approved provider refund must precede verification. Manual REFUNDED order status edits are blocked in the shared helper and disabled in the selector; return edits reject REFUNDED as well. Existing records created by the old shortcut are not automatically corrected: owner audit/reconciliation is required, including records without provider IDs. No database or provider action was performed by Codex.

Evidence: 164 tests pass (three new cases for full versus partial/mismatched proof, conditional identity binding and manual order refund rejection), offline frontend/API build and formatting pass. Lint retains three previous warnings. Real provider behavior, database concurrency, admin rendered/device acceptance, audit records, eligibility rules, refund initiation, partial refund handling and durable reconciliation remain open. See CHECKOUT_PAYMENTS.md for provider contract and owner acceptance.

## Admin customer messaging - E24 - 2026-09-14

The admin Messages tab now composes transactional customer emails and reads the latest 100 stored messages using a private query. It has required bounded fields, synchronous duplicate protection, unmount abort, preserved failed drafts and explicit accepted-versus-unconfirmed feedback. The existing protected API now requires a UUID id and an existing verified customer recipient; arbitrary external recipients are no longer accepted. Subjects reject line breaks, HTML output is escaped, and sender/customer binding is server-derived. GET selects only operational history fields; POST returns record ID/status, not full customer records.

The unique message record is written before the provider call. Concurrent or retried IDs send once; changes to sender, recipient or draft for an already-saved ID return 409. An exception/rejection retains UNCONFIRMED, and accepted transport becomes ACCEPTED. Neither means delivered to an inbox. A crash after save or provider acceptance before database status update remains unconfirmed; there is no automatic resend or durable queue. Legacy SENT is displayed as provider acceptance and QUEUED as unconfirmed. Existing CustomerMessage schema is reused, with no migration/configuration change.

Evidence: 161 tests pass, including four new helper regressions for save-before-send/concurrency, failed-email retention/no resend, verified-recipient/field validation and sender/draft replay protection. Offline frontend/API build passes. Lint has the three prior warnings; formatting passes after reformatting the handler. Component browser behavior, real delivery, database contention and owner/device acceptance remain unverified. No .env inspection or live service action. The full backlog remains open.

## Checkout and payment integrity - E23 - 2026-09-14

Added server-calculated GET/POST /api/checkout through the sole dispatcher, guarded by session ownership, CSRF, existing commerce quotas and private transport. Checkout remains disabled until valid explicit StoreSetting charges/availability and Razorpay configuration exist. India addresses and authoritative product prices/charges are checked within the stock/order transaction. UUID-based order numbers allow same-attempt recovery without a second stock reservation/cart consumption; foreign owner/address and changed total fail safely. Legacy COD creation remains compatible.

CheckoutSubmit loads a private quote, records only confirmed server outcomes, retains original request fields for explicit retries and navigates to the recorded order. Admin Settings now has a focused validated checkout editor, with blank unconfigured fees/tax and disabled availability. Order Details loads the fixed Razorpay SDK on explicit action, guards initiation/callback duplicates and confirms payment only after server verification. Closed/dismissed/failed/uncertain results keep payment status authoritative and require order refresh. No legal or tax rate was invented; the narrow uniform charge model and unsupported rules are documented in CHECKOUT_PAYMENTS.md.

Razorpay verification now requires server-fetched captured status and exact amount/currency/order/payment IDs in addition to HMAC/owner binding. Capture persistence is transactional and conditional, preserving refunded payments and terminal order states. Initiation reuses a stored provider order and uses conditional persistence for races. Dispatcher webhook handling preserves original payload bytes with a 256 KiB cap; parsed-only bodies are rejected. Failure events do not bind a failed attempt's payment ID or downgrade captured/refunded state. Actual Vercel raw-body behavior and provider retries remain owner acceptance. Support notification requests now run concurrently and settle before recording email acceptance, retaining saved-ticket success on mail failure.

Evidence: 157 synthetic tests pass. Frontend/API types and offline Vite build pass; formatting and lint checked, retaining three prior warnings only. New cases cover capture matching/raw bodies, checkout amounts/configuration, atomic changed-total rollback, same-ID recovery, foreign ownership/address, duplicate customer clicks and rejected capture feedback. Fixtures deny or inject network transports; none of this certifies real provider delivery/capture, PostgreSQL concurrency or rendered mobile/browser behavior. No .env inspection, migration application or deployment. Support migration remains unapplied. Full backlog completion, refunds, abandoned inventory release, event ledger/reconciliation, legal approval and live/device acceptance remain pending.

| Evidence | Result and scope |
| --- | --- |
| E1 — automated tests | `npm test` rerun during documentation synchronization: all 20 tests passed (3 timeout, 5 media validation, 12 rate-limit/client tests). Rate-limit policy/concurrency tests use an injected shared-store double. |
| E2 — build/types | Latest implementation build passed: Prisma generation, frontend and API type checks, Vite build. No application code changed in this documentation pass. |
| E3 — lint | Latest implementation lint completed with existing React warnings. This is not a warning-free result. |
| E4 — deployment reports | User confirmed Vercel deployment succeeded after earlier API consolidation/routing work and later confirmed login works. This is user-reported login evidence, not a test of every endpoint or the new session loader/rate limiter. |
| E5 — database | User previously supplied “schema is up to date” for the first two migrations. The agent verified all three migrations already applied in E11. The earlier temporary-table test failed P1012; E11 fixes initialization order and records a passing network-enabled SQL test and no pending migrations. |
| E6 — historical security/testing | Earlier status recorded production dependency audit 0 vulnerabilities after Prisma remediation and two wishlist optimistic tests passing. Neither result was refreshed in this documentation pass. The legacy wishlist test is outside the current default suite and needs its imports/transport fixture revisited. |
| E7 — source audit | Router, page components, API handlers, schema/migrations, scripts, query keys, config, Vite/Vercel configuration and all project Markdown inspected. Documentation claims corrected against those files. |
| E8 — documentation validation | Relative Markdown links, registered route inventory, script/handler references, completion formatting and stale active-document claims checked during this pass. Historical documents are explicitly labelled. |

## Password recovery and token claims - E16 - 2026-09-13

Added /forgot-password and /reset-password through PasswordRecoveryPage and the existing router/SiteLayout/form-width PageContainer. Login links to Forgot password. Both forms use apiFetch/CSRF, existing request budgets and five-second snackbars, synchronous duplicate guards, unmount cancellation and preserved failed inputs. Forgot password retains neutral confirmation/inbox guidance; reset requires matching 8-128-character password fields. Missing/malformed links expose a request-new-link action. Successful reset clears password drafts and the session cookie, broadcasts only session invalidation and navigates to regular login, discarding the current tab's private in-memory state; there is no automatic login.

New emails use the existing configured APP_URL origin and /reset-password#token=...; caller Host is never used. Production links require HTTPS and reject embedded credentials. Tokens are random 32-byte values, stored only as SHA-256 hashes with a one-hour expiry. Reissuing replaces the owner's reset links in one transaction. Legacy query links remain readable; the page strips query/fragment token material from the address bar after capturing it in component memory. Reloading then requires reopening the email link. index.html adds no-referrer for outgoing requests, including legacy query links; no CSP or Vercel function change was introduced.

consumeVerification claims an unused, unexpired token with conditional updateMany inside a Serializable transaction and applies the associated account change atomically. Password reset invalidates outstanding reset links and existing sessions for the token owner. Failure rolls back the claim/password/session changes; serialization conflicts fail safely without automatic replay. Existing email/mobile verification handlers use the same helper with purpose/user binding. Their customer verification pages and mobile-only password recovery remain separate work. No migration or dependency was added.

Evidence: 108 tests pass (94 previous cases and 14 recovery cases), frontend/API types and offline Vite compilation pass, formatting passes, and lint retains the same three existing warnings. Tests use actual handlers/helper/client code with synthetic providers, a serialized transaction double and a synthetic password-hash adapter; component hook fixtures cover duplicate/failure/success transitions. They are not real PostgreSQL concurrency, delivered email, normal-login integration or rendered/device evidence. .env was not inspected; no live API/database/provider/browser checks, migration or deployment were performed. Owner production acceptance remains pending as documented in PASSWORD_RECOVERY.md.

Security limits remain explicit: neutral response bodies do not establish equal timing for known/unknown email accounts; provider calls are still synchronous. Existing IP quotas do not finish recipient-based abuse protection. Durable mail retries, post-reset notification email, login-versus-reset race review, mobile-code issuance limits and full localization remain open. A reset acknowledgment does not prove delivery. These limitations do not mark the broader account/security/notification release gates complete.

## Safe API errors - E15 - 2026-09-13

The sole dispatcher now wraps runtime routing, CSRF, limiter and handler execution in a safe exception boundary. Malformed percent encodings, decoded separators/control characters and dot segments return private/no-store 400 INVALID_PATH; unknown/prototype names return 404 NOT_FOUND using explicit own-property route lookup. Successful route matching, decoded IDs, query filters, cookie forwarding, CSRF and rate-limit behavior are preserved. The dispatcher Handler type no longer uses loose any.

Unexpected runtime exceptions return 500 INTERNAL_ERROR with safe guidance to check current state before retrying. They do not expose thrown messages, stacks, database URLs or provider details. Logging records only a fixed event and a sanitized request ID, with matching X-Request-Id/error correlation. Already-sent responses are not written again. This boundary cannot repair module initialization errors, platform body-parser failures, terminated functions or broken network transport; protected operational diagnostics remain a separate requirement.

Newsletter, shared auth authorization, method errors and CSRF-bootstrap failures now provide code/message/requestId. Health failures retain ok:false and database:unavailable while adding error details. Password-reset requests keep their existing neutral accepted:true response and gain private caching. Newsletter 202 success remains subscribed/emailSent; confirmation-provider rejection or exceptions after persistence report CONFIRMATION_EMAIL_FAILED with the saved outcome. Provider values and configuration names are not exposed in those errors. Quota policies/statuses/Retry-After remain intact and use dispatcher correlation IDs.

SubscribeSection uses a focused newsletter client helper that accepts structured and legacy error contracts during rollout. Malformed/unconfirmed responses do not claim success. It retains failed email input, blocks synchronous duplicate submissions and keeps the successful Subscribed action disabled. Customer success copy no longer asks customers to configure an email sender. Existing five-second snackbars, request budgets and no automatic write replay remain. This does not implement confirmation retries, change email branding or complete localization.

Verification: all 94 tests pass (75 prior regressions plus 19 E15 cases). New tests execute actual dispatcher/helper/handlers with injected synthetic stores/providers and a component hook fixture; coverage includes failure isolation, sanitized logs/IDs, route validation and forwarding, quota metadata, unauthorized/admin rejection, health compatibility, newsletter partial success and duplicate/failed-draft behavior. Frontend/API types and Vite compilation pass via npm run build:offline; formatting passes; lint retains exactly the same three existing React warnings. No .env inspection, live API/database/provider/browser check, migration or deployment was performed. Real rendered/mobile/provider acceptance belongs to the owner and remains open. Full API/localized recovery and broader security release gates are not marked complete.

## CSRF protection - E14 - 2026-09-13

Owner follow-up, 2026-09-13: reports CSRF working on the deployed application. The supplied Network screenshot shows X-CSRF-Token on a same-origin request. This is owner-reported positive-path evidence; the screenshot does not establish response status, forged-token rejection, complete mobile/cross-tab behavior or provider acceptance. No cookie/token values were copied into documentation. Broader acceptance remains pending. This follow-up selected consistent safe API errors as the next task; subsequent implementation and evidence are recorded in E15 above.

Central protection now covers current browser writes through the existing single dispatcher and apiFetch. The new /api/auth/csrf bootstrap uses a custom header and private/no-store response. Tokens are derived from a random HttpOnly session/guest seed, retained only in generation-scoped memory, and checked with timing-safe comparison. Login/signup and other guest writes are included. Origin/Referer and Fetch Metadata provide additional checks. No database/session schema, environment variable, dependency, CSP or Vercel route configuration change was required.

The helper preserves bodies/headers and supports relative/absolute same-origin URLs and Request objects, shares concurrent bootstrap, honors cancellation/session changes and includes preparation inside the existing timeout budget. Failed writes are not replayed. Successful auth writes and 403 responses invalidate cached tokens; reads retain existing behavior. Source search confirms all current browser API call sites use the shared helper. The exact Razorpay POST webhook remains signature-validated separately; browser payment endpoints require CSRF proof.

Offline evidence: 75 tests pass (56 previous cases, 17 CSRF cases and two invalid-payment-signature cases). Tests cover guest/session binding, rotated/missing/forged tokens, cross-origin/sibling-site/null-origin rejection, source-header fallback, local HTTP bootstrap, shared client preparation, account changes, timeout/cancellation, no replay, and dispatcher rejection before limiter/handler work across existing write routes. Existing order, upload, rate-limit, cart, wishlist, timeout and routing regressions pass. Payment tests execute real handlers with injected stores; bad signatures cause zero writes. Dispatcher tests stub business handlers/DB, so these are not authenticated production tests.

Formatting and frontend/API type checks plus environment-disabled Vite compilation pass; lint retains the same three existing React warnings. No .env inspection or local/live API/database/provider/browser check, migration or deployment was performed. Owner production/device acceptance remains pending. Deploy both sides together and refresh old tabs; stale bundles are intentionally rejected on writes. Direct cookie-auth API consumers now need bootstrap and token headers. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for the full contract, deployment assumptions and acceptance scenarios. SEC-04 is partially remediated; dispatcher exception handling, broader session review and security release gates remain open.

## Order inventory integrity - E13 - 2026-09-12

User direction: the owner pushes and validates in production. Do not inspect .env, run live API/database checks or treat local configuration as the next task. Continue implementation and offline checks; keep production acceptance assigned to the owner. Earlier local/environment evidence remains historical, not a request to investigate it again.

Added server/api/_lib/order-transactions.ts. Order creation reads the owned address, cart and prices inside one Serializable transaction, reserves only active products with sufficient stock through conditional updateMany, creates the order/payment, and clears the cart atomically. A failed row or persistence failure rolls the whole transaction back. UUID-based order numbers avoid same-millisecond collisions. Serializable cart reads/deletes protect against concurrent submissions of the same cart; P2034 conflicts return a safe 409 and are not automatically replayed. Transaction acquisition/execution limits are 5/10 seconds, inside the existing client budgets.

Customer/admin cancellation shares one transaction. It checks ownership for customers, conditionally changes an eligible PENDING/CONFIRMED order to CANCELLED and restores stock in deterministic product order. An already-cancelled order is a successful no-op. A failed restock rolls back the status change. Admin status editing cannot reopen CANCELLED/REFUNDED orders; cancellation beyond the existing customer eligibility window remains unavailable rather than assuming returned goods are restockable. Other fulfillment transition rules still require approved business policy.

Payment verification and capture webhooks only advance PENDING orders to CONFIRMED, preventing late captures from reopening cancelled orders or regressing shipped/refunded states. This does not implement provider refunds, money reconciliation, payment-event ordering/idempotency or raw-webhook validation. Those remain release gates, including captures received after cancellation.

Admin order status selection now uses confirmed server state, preserves it on failure, displays safe API conflict messages and updates the row after success. Closed orders are not editable through that selector. API paths and single-function deployment layout are unchanged; no schema migration was introduced.

Evidence: all 56 default tests pass (18 added transaction/payment-order-state cases), format:check passes, frontend/API types and Vite compilation pass via npm run build:offline. The offline build uses existing generated Prisma types and envDir:false; it does not read .env, regenerate Prisma or contact a database/provider. Lint completes with the same three existing warnings. New tests execute real services/handlers with synthetic signed messages and a serialized transaction double with rollback; they are not a real PostgreSQL concurrency test. No live/API/browser/production test, migration or deployment was performed for E13. Production acceptance belongs to the user.

## Security, interaction and mobile foundation - 2026-09-12

Evidence E11: order POST now requires an address owned by the authenticated customer and rejects absent, invalid, unknown and foreign IDs with the same safe response before reading the cart or writing an order. Order GET hides historical foreign-address relations. API errors overwrite public caching with private/no-store. Signup now selects role and returns a limited identity DTO; the previous selection was already limited and did not include password hashes.

Session identity includes user ID and role. Private query keys include account and session generation. Identity changes cancel private transport/queries, remove private cache, reset optimistic state and remount route-local state. Delayed private JSON bodies are rejected. Logout awaits server success and retains the session with retry feedback on failure. BroadcastChannel sends only an invalidation message; visibility restoration rechecks /me. Wishlist IDs stay in memory and the old localStorage key is removed safely. Session probe network failure shows retry instead of pretending logout succeeded. Full browser/cross-tab acceptance is still pending.

The cart/header share useCart and one mutation coordinator: per-product duplicate/conflict locks, optimistic quantity/count/estimated totals, affected-row rollback, response merging and final reconciliation. Tracking has pending/error/retry handling and supports owned order number or internal ID. Public startup reads run concurrently; search debounces 300 ms, consumes cancellation, distinguishes errors and loads cursor pages. Admin reads expose loading/error/retry and uploads run sequentially with file progress and successful-upload reuse. Auth has a synchronous submit guard and no unused address field. Generated fallback reviews were removed and product loading uses a compact indicator.

PageContainer applies wide/content/reading/form variants to all routes. Shared gutters/section spacing, 44px quantity/header controls, phone-sized inputs, mobile filter disclosure, wrapping navigation, footer social links, hidden phone social rail, focus contrast and reduced-motion rules are implemented. All pages receive the shared foundation; individual page/admin state and real-device visual acceptance remain open.

Validation: 38 automated tests pass, including 14 new customer-isolation/cart/cache checks, two Vercel routing checks and two repaired wishlist regressions. Production build/types pass after fixing signup's missing selected role. Lint completes with three remaining existing warnings (grid effect, AuthPage effect and notification exports). npm run format:check passes with the final change. These tests use synthetic fixtures, not real customer transactions.

Live environment: the browser skill still fails before navigation with missing sandboxPolicy metadata; no rendered/mobile/authenticated browser acceptance is claimed. The rate-limit SQL test initially failed P1012 because Prisma initialized before .env loading; dynamically importing Prisma afterward and allowing database network access resolved it. The PostgreSQL temporary-table test passes. prisma migrate deploy reports three migrations and no pending migrations; the agent did not apply a new migration because this database already had them. No cleanup schedule or production deployment was created. Later in this session Vercel detected two .env changes; DATABASE_URL was then absent, health returned 503 and the SQL test returned P1012 again. Restore the intended local DATABASE_URL before API recovery verification; earlier passing evidence is point-in-time.

Evidence E12: fixed Vercel routing after the user's PATH TO REGEXP and HTML-as-JavaScript errors. Regex API capture routes to the same dispatcher, filesystem routing precedes SPA fallback, and fallback excludes Vite virtual modules/source/dependency/assets and file paths. Vercel CLI 58.9.0 with local Node 22.13.0 starts on port 3100. HTTP checks: /, /admin and /product/test-product return 200 HTML; /@vite/client, /@react-refresh, /src/main.tsx and /src/App.tsx return 200 JavaScript; /api/health returns 200 JSON and guest /api/auth/me returns expected 401 JSON. Live limiter check initially returned ten 400 VALIDATION_ERROR responses for empty login bodies and then 429 RATE_LIMITED with Retry-After: 36 and private/no-store. These validation-only requests did not create accounts or send email. Recovery after expiry could not be established: the subsequent environment change removed DATABASE_URL and produced safe 503 RATE_LIMIT_UNAVAILABLE with Retry-After: 30. This verifies local transport/routing and a live quota response, not rendered UI or production deployment.

## Source formatting cleanup — 2026-09-12

Evidence E10: formatted existing frontend TS/TSX/CSS/locales, server handlers/helpers, the single dispatcher, scripts/tests and root configuration with pinned Prettier 3.9.6. Added .prettierrc.json, .prettierignore, .editorconfig and npm run format / format:check. The dependency/lockfile diff adds only the development formatter; no runtime dependency was upgraded. Shared formatter settings preserve the existing two-space/single-quote/no-semicolon style and expand compressed code into readable blocks.

Verification: npm run format:check passes; Prettier --debug-check passes after a second pass resolved chained-call formatting instability in 13 server files. npm test passes all 20 tests; npm run lint exits successfully with the same eight existing React warnings; npm run build passes Prisma generation, frontend/API type checks and Vite compilation. A fresh full npm audit reports zero known vulnerabilities for this lockfile, including development dependencies. This is point-in-time advisory evidence, not a security certification. git diff --check passes.

This is mechanical formatting and tooling, with no intentional application behavior, route, API contract, CSS design or database changes. Browser verification remains unavailable as recorded in E9. Large components, loose any types, React warnings, state ownership and CSS duplication remain structural cleanup tasks; formatting does not complete cache/session, security or mobile-layout remediation.

## Architecture and UI/UX source audit — 2026-09-12

Evidence E9: read all 14 pre-existing repository-owned Markdown documents (including Copilot and history), all 13 page components and the routing/shared UI/state/HTTP/CSS plus selected server auth/commerce code. Created [ARCHITECTURE_UI_UX_AUDIT.md](ARCHITECTURE_UI_UX_AUDIT.md) with security findings, API/button feedback gaps, token contrast calculations, one shared layout standard and a complete page/admin-tab acceptance matrix. Codex, AGENTS and Copilot instructions now require this security-first workflow and relevant available skills.

Current baseline verification: npm test passed 20/20; npm run lint exited successfully with eight existing React warnings. Token contrast was calculated from solid CSS colors; it is not rendered accessibility certification. Browser skill connection failed before navigation due to missing sandbox metadata (sandboxPolicy), so no visual/live API acceptance or performance timings are claimed. No application source, API behavior, CSS, dependency, database or deployment changes were made in this audit. Build was not rerun for documentation-only changes; prior wishlist build evidence remains separate. Fresh dependency audit and penetration testing remain pending.

The audit confirms source-level gaps including unchecked order-address ownership, user-unscoped caches/localStorage, unawaited logout, stock/cancellation race risks and database-only refund status. It records proposed remediation; none of those security fixes, cache/session work or page-layout migrations is complete. Only the bounded audit/documentation milestone is checked in the backlog.

## Mobile-first requirement — 2026-09-12

The owner confirms most customers use mobile. Expanded the consolidated audit with phone-first navigation, filters, touch sizes, forms/software keyboard, safe areas, media/network budgets, overlay clearance, accessibility and responsive admin requirements. Requirements, target, inventory, backlog, README and Codex/Copilot instructions share this priority. Responsiveness is P1 after security foundations, with real Android Chrome/iOS Safari and phone-width/state evidence required or explicitly blocked. This is a documentation update; no responsive UI implementation or new device/browser verification is claimed.

## Wishlist page deferral — 2026-09-12

Per user request, the shared header no longer displays the wishlist link. Opening /wishlist (including its trailing-slash variant) replaces the history entry with /products for guests and signed-in users. WishlistPage is retained but not routed; product hearts and saved-item APIs remain available. Restoring and completing the page remains deferred in the backlog.

Verification: npm run build passed (Prisma generation, frontend/API types and production bundle); npm run lint passed with the same eight existing warnings. Source review confirms the shared header entry is removed and the redirect uses replaceState to avoid a Back-button loop. Live browser/deployment verification was not performed. Cache/session implementation remains pending.

## Current implementation

| Area | Implemented | Remaining or verification limit |
| --- | --- | --- |
| Runtime/deployment | React/Vite/TypeScript; Prisma/PostgreSQL; one Vercel API dispatcher; SPA rewrites; Node 22 local dev guidance | Current host/region/environment and latest deployment need live verification. |
| Authentication | Scrypt password hashes, 30-day HttpOnly sessions, Secure in production, SameSite=Lax, configured-admin bootstrap, server guards, credentialed client fetch | User reports login works (E4). Session expiry, cross-tab behavior, revoked sessions, CSRF and customer isolation need complete review. |
| Refresh | Initial session loading gate, stale-response guard, URL preserved until session settles | Build/lint evidence only for the new loader; live refresh verification pending. |
| Catalog/categories | Database-backed products and categories, search/sort/filter APIs, 24-item API cursor pages, default-category seed | Shop now consumes nextCursor through Load more; facets and some pages depend on initial catalog data. Home sections remain mostly local content. |
| Cart/wishlist | Persistent server endpoints, optimistic counts/hearts, serialization/rollback, API-backed page reads | Account/generation scoping and shared cart optimistic coordination implemented; browser multi-tab/live concurrency and deferred wishlist page completeness remain. |
| Reviews | One review per customer/product enforced by schema; create plus own-review edit, compact pencil action, public media, upload lock | Live ownership/edit/media verification remains. Generated fallback reviews were removed in E11; only server reviews are displayed. |
| Product admin | Create/edit, strict category select/add-category, price/stock/colors/media, archive, immediate local list update, reset after success | Authenticated save/edit/upload verification pending; category edits/deletion are not supplied. |
| Other admin | Reads for analytics/products/orders/payments/returns/customers/settings; some update handlers | Messages UI has no submission handler; settings UI is informational; audit endpoint returns an empty list. Admin refund action changes database status without issuing a provider refund. |
| Orders/checkout | Server order create/list/detail/cancel and Razorpay create/verify/webhook handlers exist | Customer Orders is an empty shell; Order Details uses catalog products and hardcoded delivered/paid information; Checkout uses placeholder totals and submits nothing. E11 validates address ownership; E13 adds stock/cancellation transaction guards; live concurrency acceptance, money/idempotency and raw-webhook handling remain. |
| Tracking/support | Authenticated shipment lookup, support tickets, E30 manual tracking, private attachments and conversations | E30 source supersedes this older baseline; migrations, carrier/provider behavior, customer receipt and production acceptance remain pending. |
| Newsletter/email | Newsletter persistence and optional Resend audience/contact/confirmation requests; auth email/SMS helpers | Provider delivery/retry verification missing. Newsletter still has Field & Form branding and a relative email link. Errors are structured; E17 reconciles saved subscriptions with failed confirmation. No durable notification worker. |
| Policies/config/localization | Policy placeholder pages; local business config; English/Hindi/Marathi resources; rate-limit messages translated | Full CMS, versioned policy models/consent, business-approved copy and full UI/email localization pending. |
| UX/navigation | Orders link for authenticated users; Admin link for admin state or current /admin route; light-only theme; five-second snackbars | Admin link now requires verified ADMIN role; responsive/browser verification pending. Rating radios, CSS-only filter swatches, placeholder phone, missing routes and other backlog UI work remain. |

## Security and resilience

Timeout wrappers use 30 seconds by default and a 60-second long-running override for configured operations. They throw typed timeout errors; they do not impose a universal database/function execution deadline. E1 verifies wrapper behavior. No two-minute contract is active.

React Query adoption and public/private cache headers are implemented in part. Private queries now use private/account ID/session generation/resource keys. Header and cart share their query; session restoration and wishlist synchronization use guarded effects. Logout cancels/removes private data only after server confirmation. Complete browser account-switch/isolation verification remains open (E11). Earlier “all pages migrated” claims were too broad.

Product and review uploads validate supported MIME/data-URL agreement, canonical base64, decoded size and media signatures, and generate stored names. E1 covers these checks. Signature checks do not provide full decoding, malware scanning, moderation or safety of externally supplied media URLs. Uploaded Blob media remains public.

Rate limiting now uses atomic PostgreSQL IP and verified-user counters. Structured private 429s include request IDs and Retry-After; client errors use translated snackbars and skip automatic retries. The configured database reports this migration applied/no pending migrations in E11; verify any other deployment database separately. Unavailable/missing counter storage stops limited writes with safe 503s. E11 records passing live temporary-table SQL checks; production host/browser acceptance remains separate. No cleanup job is scheduled. See [RATE_LIMITING.md](RATE_LIMITING.md) for policies and deployment steps. Support/coupon policies do not create those future endpoints.

No active enforced or report-only CSP is configured in current Vite/Vercel files; earlier CSP experiments were removed after development breakage. XSS review, customer isolation/network exposure, penetration testing, fresh dependency review and provider verification remain release gates.

## Priority follow-up

1. Product owner validates deployment/API/session/rate-limit behavior in production. Codex continues offline implementation without inspecting .env or running live checks.
2. Complete customer-data, session/storage, error-contract and cache-isolation reviews; verify upload safety and CSP through a controlled deployment.
3. Repair customer Orders/Order Details/Checkout/tracking truthfulness and complete catalog pagination; implement and verify provider payment/refund workflows before enabling purchases.
4. Continue support tickets/email, profile, business configuration/localization and the remaining roadmap from the backlog.

## Documentation audit corrections

This pass updated every maintained project Markdown file, centralized completion in the backlog, corrected runtime/API paths and timeout/snackbar values, replaced outdated prototype-only summaries, and recorded actual page gaps. Broad React Query/caching/security claims remain pending where acceptance criteria are not verified. The original requirements and old status history are retained as context; they are not completion checklists. No application code, credentials, deployment or database state was changed by this documentation task.


## Newsletter partial-success repair - E17 - 2026-09-13

The owner reported POST /api/newsletter/subscribe returning 502 CONFIRMATION_EMAIL_FAILED. Source confirms this specific code occurs after database persistence. The client now reconciles that exact 502/code pair to Subscribed and clears the completed draft, with a five-second informational notice explaining that email sending was not confirmed and signup need not be repeated. Other errors retain failed inputs. The server contract is unchanged; provider failures remain visible rather than being hidden as delivered mail.

Safe operational logs contain only event, phase, optional provider HTTP status and sanitized requestId. No email address, credential, provider response body or raw exception is logged. newsletter_provider_rejected identifies a non-success provider response; newsletter_operation_failed identifies a caught exception without asserting a provider rejection.

Verification: all 111 offline tests pass, including exact-code reconciliation, no write replay, unrelated failures, component saved-state feedback and diagnostic privacy. Formatting passes; lint passes with three existing warnings. npm run build:offline passes frontend/API types and the Vite production bundle without environment loading. No .env, live API/database/provider, browser/device, migration or deployment checks were performed. Actual email delivery and the Resend failure reason remain pending owner production evidence. Email-verification page/resend work remains the next authorized backlog task after this interruption.


## Email verification - E18 - 2026-09-14

Added public /verify-email with explicit confirmation, account-email status and authenticated resend. Header Account email links to this page. Shared PageContainer/auth components provide form width and existing spacing; no CSS overrides or new dependencies. Fragment and legacy query tokens are captured in component memory and removed from the visible URL; reopening the email is needed after a reload. No GET or mount-triggered mutation is used. Pending controls, synchronous duplicate guards, cancellation, persistent errors, five-second snackbars and private account-generation query keys are preserved.

POST /api/auth/email-verification-request requires a session and central CSRF; caller email/userId are ignored. Limits are 5/IP and 3/account per 10 minutes, using existing fail-closed counters. Issuance reads the stored recipient and replaces email-verification tokens in one Serializable transaction, with random 32-byte tokens hashed at rest and 24-hour expiry. It uses the existing configured APP_URL origin and Resend transport. Existing atomic verification consumption remains. No automatic replay or login-policy change; no new database migration, environment variable or serverless function.

GET /api/auth/me adds emailVerified, exposing no token or verification timestamp. Account-email reads are private React Query entries. Signup reuses secure issuance; an email error after account creation no longer prevents session creation solely because mail failed. Resend reports unconfirmed sending as a safe 503; provider acceptance is not delivery. Full profile/email-change and mobile-verification workflows remain separate; future email changes must invalidate all outstanding email tokens and reset verified status atomically.

Evidence: all 120 offline tests pass, frontend/API type checks and npm run build:offline pass; lint retains three existing warnings. Nine new cases cover configured origins, random hashed owner-token issuance, already-verified/missing email, conflict/provider failure, resend policy, request contracts, status DTO validation, handler ownership and explicit/duplicate clicks. E16 consumption concurrency tests remain passing. These synthetic fixtures do not prove actual PostgreSQL concurrency, rendered accessibility or delivery. No .env inspection, live API/database/provider/browser checks, migration or deployment occurred. Owner acceptance remains pending for new signup, resend/429, expired/used links, account switching, old login flows and 320-430px Android/iOS keyboard/focus/layout states. Email copy/localization and durable delivery remain backlog work.

E17 owner report (2026-09-14): owner states newsletter is now working. Record this as user-reported recovery; no specific Resend configuration change or independent delivery test was supplied.


## Profile and saved addresses - E19 - 2026-09-14

Source inspection confirms admin Settings is store configuration, not a personal profile. Added common /profile for signed-in customers and admins; guests see the existing login form at that path. The Profile header link replaces Account email; the profile includes email-verification and email-based password-recovery links. Admin store Settings is unchanged.

GET/PATCH /api/profile and POST/PATCH/DELETE /api/addresses are dispatched through the sole existing Vercel function. requireUser supplies ownership; body userId/email/role are not accepted as changes. Responses expose selected personal/address fields only and are private/no-store. Central CSRF and a 60/IP, 20/account per-minute profile-write quota apply. Existing private transport generation/abort guards now include profile and addresses; React Query uses privateKey('profile'). No customer data is added to browser storage.

Name and login phone can be updated. A phone change requires the existing password; the write checks the current account version/password hash, clears phoneVerifiedAt and invalidates only the owner's mobile verification tokens in a Serializable transaction. Removing the only login contact is rejected. Email is read-only: verified email replacement is future work. Mobile-code entry and passwordless-account phone replacement are not supplied here.

Address mutations validate bounded fields and scoped IDs. Default selection/first-address initialization/deletion promotion run transactionally. Missing and foreign IDs produce the same 404. Addresses referenced by orders cannot be edited/deleted, preserving the current relational order-history model; making them default is allowed. Concurrent transaction conflicts return safe errors without replay. These guarantees apply to these handlers; no database unique-default constraint or new migration was added.

ProfileForms preserves failed drafts; ProfilePage owns a synchronous shared mutation lock, pending controls, cancellation, safe error feedback and confirmed response reconciliation. No optimistic persistence. Delete has an inline confirmation. Shared form-width layout, existing input/spacing tokens, wrapping action groups and checkbox-specific sizing support phone layouts without global overrides.

Evidence: all 129 npm tests pass (nine new profile cases), npm run format:check and frontend/API types + npm run build:offline pass. Lint has only the three prior React warnings. Tests cover allowlisted validation, missing/foreign IDs, per-owner defaults/deletion, order-reference protection, synthetic rollback/concurrency, password reauthentication/token invalidation, quota policy, session abort/no replay and component mutation locking/error preservation. Synthetic transactions serialize in memory; real PostgreSQL concurrency is not established. No .env inspection, live API/database/provider/browser/device checks, migration or deployment performed. Owner validates production and 320-430px Android/iOS keyboard, focus, empty/error/success and slow/offline states. Full email changes, mobile verification, locale-aware address policy and checkout integration remain pending.


## Customer order history - E20 - 2026-09-14

/orders now reads GET /api/orders?page=N through privateKey('orders'), React Query infinite pages and the session-aborted apiFetch transport. Loading, genuine empty history, pagination error, explicit retry and loaded-count states replace the static empty shell. Cards show stored order number, placement date, product-name/quantity snapshots, total/currency and recorded order/payment status. Missing payment is not shown as paid. Existing shared order styles are reused. No links to the still-placeholder Order Details page were introduced.

GET returns up to 20 orders with nextPage, uses the session userId even for admins, and selects only list fields/item snapshots/payment status. Provider identifiers/payloads, shipping addresses and other customer fields are excluded. Sort is createdAt/id descending. Page input is bounded numeric text; offset pages are not a snapshot across concurrent inserts/deletes, and the client deduplicates IDs. GET remains private/no-store. Order creation and existing payment/inventory mutations are unchanged.

Verification: all 133 tests pass including four new history tests (owner filter/minimal selection, bounded pagination, transport failures/malformed response and status labels), formatting and offline build/types pass. Lint retains three existing warnings. Existing isolation/transaction regressions pass. No .env, live API/database/provider/browser/device checks, migration or deployment. Owner acceptance remains pending for real history, multi-page changes, phone layout/focus, account switching and slow/error cases. Order Details and Checkout still contain placeholders and remain next; the combined commerce backlog item is not complete.


## Continuous backlog implementation - E21/E22 - 2026-09-14

Owner scope: complete remaining functional backlog continuously, with tests and synchronized docs; visual polish/responsiveness review follows functional work. Security and basic accessible states still apply. Business clarification: Gadgify sells the owner's mother's household gadgets in India, primarily Maharashtra with other Indian states supported. INR remains configured. Reuse for relatives' separate sports-equipment/furniture and other stores is a future configurability goal, not an approved multi-vendor marketplace. No reward/discount rates or legal policy were approved. Medicines/regulatory products remain out of active scope pending requirements.

E21: Order Details uses a private owned query and real item quantities/prices/totals, payment/shipment status and owned address. Provider IDs/payloads and address owner ID are excluded from its DTO. Orders cards link to it. Checkout now reads the shared cart and profile addresses, computes real item subtotal and preserves selected address. It does not submit orders/payments: existing order creation defaults to COD while prior UI advertised Razorpay, and provider reconciliation/charges still require completion. Fictional paid/delivered dates, fake checkout products, free-returns promises and unused identity fields were removed.

Rating filters now support multiple checkbox bands with server validation, retaining legacy minRating callers. Color checkboxes show database hex/swatches when available, never an invented hex; broader facet completeness remains pending. Unknown admin children resolve to /admin; other unknown routes get an explicit not-found page. Invalid encoded IDs no longer crash decoding. Global browser offline status and online notices cover ready/loading/error shells, with no automatic write replay; this is connectivity feedback, not a service-worker offline cache. Footer placeholder phone/mailto destination removed in favor of support navigation.

E22: /support creates authenticated tickets, /support-requests lists the owner's tickets, /admin/support lets admins record in-progress/resolved/cancelled status and reasons. Customer cancellation is limited to open owned requests. Server role guards cannot be changed by query flags. Ticket creation uses a stable client UUID, parameterized SQL, unique insert and owner check to avoid duplicate records/emails on explicit retries; changed duplicate drafts are rejected. Saved tickets survive mail failure. SUPPORT_EMAIL is server-only; confirmation sends only to a verified stored account email. No provider/user payloads are logged. E30 later adds unverified attachment/thread source; durable mail retries and automatic reply/status-change emails remain unimplemented.

Migration 20260914000000_support_tickets is prepared but NOT applied. Support uses parameterized SQL so offline builds do not need regenerated local Prisma types. Missing table returns safe 503. Owner must apply migration and set SUPPORT_EMAIL with existing Resend settings before production support acceptance. No .env inspection, provider call, live DB/API/browser test, migration application or deployment was performed.

Checkpoint: 145 tests pass, formatting/check and offline build/types pass; only three prior lint warnings. Twelve new synthetic E21/E22 tests cover rating/routes, truthful detail/checkout displays, offline events, support input escaping, saved-mail failure, duplicate ownership, customer/admin read/cancel guards. Actual database concurrency/delivery, mobile device behavior, attachments and payments remain open. Existing tests remain enabled. This checkpoint does not mean the full backlog is complete.


## Versioned policies - E29 - 2026-09-15

Implemented private drafts and explicit approved publication for seven policy types and en/hi/mr. Serializable version checks preserve published text during draft changes. Publication/history/actor audit writes are atomic. Generic settings excludes and rejects reserved keys. Public DTOs select only published title/text/version/date; pages render plain text and retain missing-content states. Added shipping/cancellation/cookie routes and footer links. The admin audit API now reads policy-publication events, not all admin actions. No legal content was generated or published.

Verification completed before the owner deferred checks: 181-test full suite passed, then the expanded seven-case policy suite passed (two additional privacy/reserved-key cases; default suite now contains 183). Offline client/API build passed and lint retained three prior warnings. No live provider/database/device checks, migrations or deployment. Further format/lint/test commands are deferred by the owner until the remaining implementation is finished. See POLICY_PUBLISHING.md; consent/legal/device/general-audit requirements remain pending.
