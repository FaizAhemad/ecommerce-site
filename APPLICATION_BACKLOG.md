# Application backlog

## WhatsApp vendor intake (2026-09-30)

- [ ] WA-01: Isolated Windows direct-message intake, durable inbox and vendor Excel/media export implemented with offline fixtures; confirm Cloud API access, configure secure connection/credentials, and verify actual Excel/provider/Windows operation. See tools/whatsapp-intake/README.md and PROJECT_STATUS.md.
- [ ] WA-02: Add local correction/assignment UI, reviewed free-form/AI extraction, ZIP intake and retention; approved catalog import must retain current shop authorization/moderation.

## Rebrand and schema roadmap (2026-09-30)

Specifications: [REBRAND_IMPLEMENTATION_PLAN.md](REBRAND_IMPLEMENTATION_PLAN.md) and [SCHEMA_EVOLUTION_PLAN.md](SCHEMA_EVOLUTION_PLAN.md). This roadmap refines UI-01?UI-09 and existing commerce requirements; it does not replace security/business gates or declare new implementation.

- [ ] RB-01: Shared MUI theme/control and application grid foundation implemented with interaction tests and stories (2026-09-30); complete catalog state coverage, contrast and phone-width visual acceptance.
- [ ] RB-02: Route-level lazy loading and persistent-shell Suspense implemented (2026-09-30); migrate shell/navigation/footer, separate public/private startup states and verify production/device performance.
- [ ] RB-03: Improve cart response using existing optimistic state, eliminate redundant product reads, and implement revision-aware quantity coordination/reconciliation.
- [ ] RB-04: Rebrand Home, Products, product cards and Product Details with real content and mobile purchase controls.
- [ ] RB-05: Migrate Cart, Checkout, Orders/Detail/tracking/returns while preserving financial truth.
- [ ] RB-06: Migrate auth/profile/support/policies, dialogs and notifications with complete interaction states.
- [ ] RB-07: Finish shared grid/cell editor design and all 14 admin tabs plus standalone admin routes.
- [ ] RB-08: Migrate shops and seller onboarding/catalog/media/fulfillment with scoped permissions.
- [ ] RB-09: Remove unused legacy styling/dependencies after consumer audit; complete performance/accessibility/regression and owner device acceptance.
- [ ] SE-01: Reconcile Prisma/SQL/reserved-setting contracts and design cart revision/receipt plus historical snapshot integrity.
- [ ] SE-02: Prepare structured catalog content and SKU/option schema with simple-product compatibility.
- [ ] SE-03: Integrate SKU-aware cart/order snapshots, inventory authority and admin/seller authoring transactionally.
- [ ] SE-04: Add payment-attempt history and immutable order address/adjustment snapshots without financial replay.
- [ ] SE-05: Gradually normalize selected operational records; add measured indexes/private-media lifecycle and approved item-level fulfillment/returns.

All schema changes require owner migration rehearsal/application and evidence. Per-product fee offer basis is owner-approved; tax treatment, delivery, payout/settlement, analytics/privacy and medicine decisions remain separately gated. RB-01 shared MUI/grid implementation is underway; later consumer migration remains pending. See PROJECT_STATUS.md for evidence.

The current page and route inventory is maintained in [`PAGE_INVENTORY.md`](PAGE_INVENTORY.md). Any page or route change must update that inventory and the relevant status documentation in the same change.

Completion status reviewed against current source and recorded evidence on 2026-09-21. This is the single completion checklist for product requirements, security gates and UI work. Other documents describe scope and evidence; they must not maintain competing completion lists.

Completion convention: `- [ ]` means pending, partial, blocked or awaiting required verification; `- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦` means the stated scope is implemented and verified, with evidence in [PROJECT_STATUS.md](PROJECT_STATUS.md). A code implementation or build alone does not complete a live integration. Preserve unverified work and business dependencies. Evidence IDs below refer to that status document.

## Current work: continuous functional backlog (E21 onward)

## Customer usage insights (2026-09-29)

- [ ] Define approved analytics notice/consent, retention and access rules before collecting customer behavior. Recommended scope: first-party aggregate product views, category engagement, add-to-cart and checkout-step counts; never capture names, contact details, precise location, raw search text, payment details or individual browsing profiles. Make tracking optional and off until the approved notice and customer control are in place.
- [ ] Build privacy-minimal, rate-limited event collection and aggregate admin reporting; derive popularity and category-based product recommendations from aggregate trends only. Keep order/payment outcomes sourced from authoritative commerce records, not analytics events. Prepare (do not apply) any required migration and retention process; verify authorization, abuse limits and phone UX after owner validation.

## First priority: multi-vendor marketplace (2026-09-22)

Owner prioritizes multiple shops selling through Gadgify. Detailed scope and unresolved decisions: [MARKETPLACE_REQUIREMENTS.md](MARKETPLACE_REQUIREMENTS.md).

Owner-requested tracking update (2026-09-23): checked entries explicitly labelled **Coding done** below acknowledge the implemented source scope only. This is an exception to the general verified-completion convention above, not a claim of passing tests, applied migrations, live email delivery or production readiness. Remaining functionality and acceptance are tracked separately. Evidence and limitations: PROJECT_STATUS.md.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-01a **Coding done:** shop/membership/product ownership and order-item snapshot models, access helpers and prepared migration/backfill. See MARKETPLACE_MIGRATION.md.
- [ ] MP-01b Apply/rehearse migrations, regenerate Prisma and verify historical data preservation and ownership isolation.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-02a **Coding done:** seller application/revision, admin approval/rejection/suspension/restoration, version guards and audit. See SELLER_ONBOARDING.md.
- [ ] MP-02b Verify onboarding, seller isolation and device/production behavior after migration.
MP-02 owner override (2026-10-02): seller application submission/admin approval no longer require verified email; account verification and verified-recipient notification checks remain unchanged. Seller review now requires an explicit action and allows versioned review-note/status corrections with matching membership changes; focused tests 9/9 and offline build pass.
MP-02 GST declaration update (2026-10-02): signed-in applications require GSTIN when registered, or a non-registration reason with optional portal enrolment ID; admins see private details. Seller messaging makes clear that a reason does not confirm eligibility. Approved sellers' ability to update GST details was added 2026-10-03. Live status validation, unregistered-seller eligibility, tax/TCS/invoicing and production acceptance remain pending (PROJECT_STATUS).
MP-02 existing seller GST update (2026-10-03): approved sellers can update GST details from My application with expected-version protection and a private audit entry, without changing shop approval. Focused seller tests 18/18 and offline build pass; GST Portal verification, tax eligibility and production acceptance remain pending (PROJECT_STATUS).
MP-02 GST review (2026-10-03): seller GST declaration is reviewed with shop onboarding, separately from product content. Admin must explicitly review GST eligibility before granting shop approval; GST `NEEDS_INFO`/`REJECTED` blocks external-shop purchases. Updating an approved shop's GST declaration resets its purchase gate to `PENDING`; the prepared commercial-offers migration adds the Shop field and order trigger check. Focused tests pass 24/24; migration, tax/legal review and production/device acceptance remain pending (PROJECT_STATUS).
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-03a **Coding done:** seller product workspace, private uploads, storage inventory/previews and confirmed deletion of unreferenced media; saved/archived draft and catalog references are protected. See SELLER_WORKSPACE.md.
- [ ] MP-03b Larger media support and concurrency/security/device/production verification.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-04a **Coding done:** moderation/publication/withdrawal, shop showcase, seller identity, media checks, suspension/SEO filtering and server purchase eligibility. See MARKETPLACE_PURCHASING.md.
MP-04 seller-media update (2026-10-02): one product accepts up to 10 mixed images/videos; repeated picker selections accumulate and queued files can be removed before upload. Per-file 1 MB and 100 files/shop limits remain. Tests/build and device evidence are in PROJECT_STATUS.md.
- [ ] MP-04b **Offline implementation complete, rollout pending:** admin approves content and proposes a fixed per-unit INR fee or percentage of the discounted item price; only the shop's acceptance of the exact current offer enables server checkout. Private shop phone/address are admin-visible. Order lines snapshot discount allocation and fee terms; fees accrue only after verified capture/delivered COD and are voided/reversed on cancellation/full refund. Seven focused suites pass (68/68) and `npm run build:offline` passes. Full regression suite is 191/205 with 14 failures outside this batch; details in PROJECT_STATUS (2026-10-02). Apply prerequisite marketplace migrations followed by `20261002120000_marketplace_commercial_offers`, regenerate Prisma, and complete owner checkout/payment/browser/device/production acceptance before enabling the flow. Billing, payout/settlement, tax and delivery rules remain separate and pending.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-05a **Coding done:** shop order grouping, scoped shipment updates, customer returns and seller/admin review, with prepared fulfillment migration. See SELLER_FULFILLMENT.md.
- [ ] MP-05b Mixed-shop checkout/allocation, cancellations/refunds and runtime/device acceptance. Platform mixed-order shipment/return handling is coded, unverified (2026-09-24).
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-05c **Coding done:** shop dispatch/delivery and return approval/rejection/receipt email jobs with transactional enqueue and verified recipients; this does not extend legacy Gadgify return emails.
- [ ] MP-05d Verify shipment/return email regressions, worker operation and provider/device delivery acceptance.
- [ ] MP-06 Owner approved fixed INR/unit or percentage of discounted item price, proposed per product and accepted by shop. Versioned offers, deterministic coupon allocation and immutable order-item fee snapshots/statuses are implemented in source; a full auditable ledger, adjustments and seller settlement reconciliation remain.
- [ ] MP-07 Approved payment arrangement, earnings, payouts and settlement reconciliation.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-08a **Coding done:** order support conversations, escalation, admin resolution/audit and dispute email outbox with private staff routing and verified-customer notices.
- [ ] MP-08b Seller policies, worker operation, verified email delivery, direct inbound email forwarding setup and isolation/device/production acceptance.
- [ ] MP-09 Isolation/regression/migration/provider/mobile acceptance and controlled rollout.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ MP-10a **Coding done:** optional admin-requested physical inspection per external-shop order, receipt/pass/fail, dispatch hold, return-to-shop/replacement records, private evidence photos, staff call notes, scoped shop views and seller email jobs. See QUALITY_INSPECTION.md; checked scope is source implementation only, as requested.
- [ ] MP-10b Decide mandatory inspection/central delivery, custody/transport costs, partial-item inspection and evidence retention; verify isolation, concurrency, migration prerequisites, email and phone/browser behavior before production acceptance.

- [ ] Session security: role-based idle expiry (30 minutes customer / 15 minutes admin), 12-hour absolute cap for both roles, legacy-session rejection, activity renewal and warning. Continue joins trusted-activity renewals and gives pending feedback. Policy tests updated for the 12-hour boundary; deferred checks and owner multi-tab/private-session/device/production acceptance remain pending; see SESSION_SECURITY.md.

## UI priority - numbered work (2026-09-22)

UI remains in scope but follows the newly prioritized marketplace work above. Preserve existing API/security behavior. All entries remain unchecked until their stated scope and deferred device/interaction checks are complete.

- [ ] UI-01 Styling organization and component-to-consumer inventory (including page-local controls): owner direction (2026-09-29) is MUI as the only UI system; migrate all shared/page-local components, stories and tests through `src/components/mui`, then remove Tailwind/shadcn dependencies and build integration after a zero-consumer scan. The MUI theme, provider, dedicated `.tsx` wrapper files for every catalog export, component stories/test foundation and MUI Products filter drawer are implemented. HomePage, shared ProductGrid/ProductCard, cart controls, rating stars and newsletter are now migrated to MUI (2026-09-29); most route-local layouts still require migration, full story/state coverage is pending, so keep this item open. Continue from the component-to-consumer mapping in `src/components/mui/README.md`.
- [ ] UI-02 Visual foundation: shared spacing/radius tokens, readable controls, checkbox fixes and record cards implemented; shared button styling, font/control tokens and 16/24/32px page gutters consolidated (2026-09-25). Use the shared 4/8/12/16/24/32/48px spacing scale for consistent rhythm while preserving hierarchy; tour panel title/copy spacing now uses this scale. Fixed the global anchor color overriding foreground colors on primary/secondary CTA links (2026-09-26). Consolidated body, display, hard-coded legacy and Tailwind sans stacks onto one shared system sans family (2026-09-26); application-wide color, typography, card/field spacing and consumer verification remains. Shared header now uses responsive nav spacing, sentence-case 12px Log out, a proper magnifier and keyboard-usable search popover with Search/Close controls; focus outlines are slimmer with a restrained search-field treatment (2026-09-27). Visual and phone acceptance remain pending.
- [ ] UI-03 Shared dialog/drawer: native modal, focus restoration, inert background, scroll locking, pending dismissal guard and top-layer snackbar placement implemented; keyboard/mobile checks remain.
- [ ] UI-04 Admin: the `/admin` workspace and all 14 tab panels now use the shared MUI grid, controls, cards, forms, status feedback and dialogs; standalone support, fulfillment, seller-application and seller-product moderation routes also use MUI for their primary page and editing surfaces (2026-10-02). Preserve server-side filtering/sorting/pagination, role/shop authorization, refund/provider truth, shipment/return guards and failed drafts. `npm run build:offline` passes. Review remaining nested seller-media/detail surfaces, then complete rendered, keyboard and 320–430px phone/tablet/device state acceptance before marking verified.
- [ ] UI-04 seller-product review form fix (2026-10-02): explicitly set `type="submit"` on the shared MUI review/save button so Confirm review invokes the existing versioned moderation handler. Focused regression check and offline build pass; rendered and production review acceptance remains pending.
UI-04 seller review fix (2026-10-02): replaced the portalled decision menu with a native MUI select, removed the accidental preselected approval, added explicit pending choice, and clarified the applicant-visible reason. Focused tests 9/9 and offline build pass; rendered interaction acceptance remains pending.
- [ ] UI-05 Profile: personal/address forms remain in shared native drawers; Profile now uses content width with responsive detail/address cards, compact heading hierarchy, clearer empty/default states and inline drawer errors (2026-09-28). Phone changes still require current password and reset verification. Offline build passed; deletion/keyboard/failed-draft/account-switch and real-device review remain pending.
- [ ] UI-06 Catalog/product/reviews: homepage screenshot pass tightened mobile header/navigation and hero rhythm (2026-09-25); Home now has a generated product-led hero image and a category discovery strip linked to active catalog facets (2026-09-27). Products has three distinct generated campaign images for Home & Kitchen, practical gadgets, and playful accessories/toys, mapped to separate carousel slides (2026-09-27). Local desktop rendering checked; phone/tablet and automated verification remain pending. The Products route is the first Tailwind-first page, including its promo banner, desktop filter aside, mobile Radix Sheet, card/grid/filter/empty/loading states. Category matching now checks each category word case-insensitively to handle punctuation/spacing differences in free-text product categories; color matching is also case-insensitive. The filter title no longer inherits the oversized legacy global `h2` rule, and Clear filters keeps a compact label with a touch-sized target (2026-09-27). Home and Products share `ProductGrid` and `ProductCard`; the catalog uses normal CSS grid flow instead of absolute-position virtualization to keep scroll and end-of-list placement stable. Products now auto-fetches filtered cursor pages via an IntersectionObserver sentinel and retains loaded cards with a retry action after pagination errors (2026-09-27). The grid auto-fits 230px minimum tracks and cards cap at 260px. Cards reserve consistent compact slots for title/wishlist, seller, discount, rating and colors so cards and add actions align within each row; long titles clamp, current price is emphasized, and valid compare-at discounts render. Shared card cursors and title/price/discount typography hierarchy were refined 2026-09-26. Card cart actions now reflect shared cart quantities with remove/minus/plus controls and an animated count; per-product pending feedback distinguishes Adding, Removing and Updating without showing the add icon during pending work (2026-09-27). ProductCard hides missing seller metadata and fallback `Default` swatches, showing optional details only when real data exists; cards show genuine average/count or a `No reviews yet` state, with no fabricated ratings (2026-09-27). Desktop card spacing was checked; phone/tablet and automated verification remain pending. Reusable fractional `RatingStars` is shared by cards, detail summaries and reviews. Pagination feedback appears only during next-page requests and now uses a branded, reduced-motion-friendly status panel; background refreshes remain quiet. Product detail now has mouse-following 2.2ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â image magnification (replacing small competing hover scales), catalog-width Tailwind layout/gutters for gallery, ratings and review form, and a responsive title/price hierarchy and Tailwind review form/rating layouts and loading/error/empty review states (2026-09-27); failed-image fallback and exclusion from zoom/lightbox are implemented. Video thumbnails open in the lightbox without replacing the primary image, the duplicate short rule under Latest reviews was removed to align section dividers, and the summary explicitly shows 0.0 with 0 ratings / 0 reviews when empty; the pre-app product SEO fallback uses the shared storefront visual direction rather than browser-default text; rating-to-review sections have a matching divider and own-review editing now uses a labeled, 44px Tailwind secondary action (2026-09-27); source-only, interaction and mobile acceptance remain pending. The primary cart action now shares its dark Tailwind style across ProductCard and Product Details (2026-09-27). Orders has a Tailwind route layout with paginated cards and explicit loading/error/empty/retry states; render/device checks remain pending. Tailwind migration and rendered/mobile acceptance remain pending across Home/Wishlist and remaining detail/review components. Admin/seller price editing and validation plus the prepared schema migration are coded; apply migration, regenerate Prisma, verify rendered/mobile behavior and finish remaining catalog/review work. See [PRODUCT_PRICING.md](PRODUCT_PRICING.md).
- [ ] UI-06 follow-up (2026-09-29): ProductCard and ProductDetailPage now share the same “N in cart” default quantity label and cart state; CartPage keeps its compact numeric quantity. Product Detail action width is bounded. Tests/build pass; rendered phone/tablet/keyboard acceptance remains pending.
- [ ] UI-07 Cart/checkout/orders: Cart uses a responsive item list and order-summary panel with shared quantity controls (2026-09-28). Checkout now has responsive address cards, direct address creation, an itemized summary, server quote/coupon controls, clear order-then-payment steps and a truthful unavailable state. Product delivery fees are optional per unit (blank means free delivery); tax is optional (omitted means 0%). Order Details and Track Order now share a status timeline using saved order state plus only actually recorded delivery events; Order Details, feedback and return sections use compact responsive Tailwind cards, and purchase feedback follows the order list. Order creation retains its frozen cart/address/quote/UUID and safe explicit retry. Prepared shipping migration is unapplied; checkout still requires owner configuration and server-side Razorpay keys, and production payment is unverified. Offline build/lint passed; order-transaction test execution is blocked by the Node `.js`/`.ts` resolver. Rendered/mobile/keyboard/provider and production checks remain pending.
- [ ] UI-08 Support/account/information pages: merge public Help guidance and the explicit website tour into a redesigned Support center; remove the separate `/help` route and primary navigation entry. Public Support uses the shared wide PageContainer and site gutters, matching Products. Quick links now adapt from one column on narrow phones to two on tablet and four on wide desktop; FAQ rows have larger vertical spacing and touch areas, headings use a restrained scale, and the contact card remains alongside the FAQ only on wide screens (2026-09-28). Offline build passed; rendered/mobile/keyboard acceptance remains pending. The explicit tour covers only launch navigation (Support, Home, Products and Orders for signed-in users), with the arrow/outline on each active header control and destination-labeled Next/Previous controls. Review forms, conversations, recovery and policy readability; keep primary login/checkout flows as pages.
- [ ] UI-09 Navigation/loading/overlays and acceptance: After shared foundation work, address the reported startup loader and every loading/error/notification/overlay state using UI_UX_REVIEW_GUIDE.md. Audit every route/admin tab and component consumer on phone, tablet and desktop. Tests/lint/format and live checks remain deferred under owner instructions.

UI-09 navigation update (2026-10-02): shared header now exposes public Shops and “Sell with us” to guests, then Orders/Profile/Seller workspace after authentication and Admin only for the persisted ADMIN role. Seller products/order destinations remain grouped in seller-page navigation because session state does not identify shop membership. Source changes only; visual/mobile/account-state acceptance is pending.

UI-09 source update: removed header geometry changes at the scroll threshold to address reported Support-page flicker. Stable sticky positioning and shadow-only scroll styling are implemented; rendered acceptance remains pending.

UI-09 loader update (2026-09-28): replaced the startup spinner and moving progress line with a fixed, overflow-contained Gadgify scene and four gently floating catalog-art cards; reduced-motion users see still artwork. Build evidence is separate from rendered/mobile acceptance, which remains pending.

UI-09 loader copy/layout refinement (2026-09-28): broadened the art arrangement, added a short brand line, and replaced technical account-check copy with “Getting your Gadgify ready…”. Reduced-motion and rendered/mobile acceptance remain pending.

UI-09 interactive loader pass (2026-09-29): staggered product-card entrance, pointer-following parallax on mouse, a subtle brand pulse and animated status dots make the wait feel alive without fake progress or added delay. Pointer motion, all animations and transitions stop for reduced-motion preference. Offline build and component suite pass; browser/mobile acceptance is separate.

Owner requests continuous implementation without per-item permission pauses; visual polish review follows functionality. Confirmed business: Gadgify household products, India/INR, primarily Maharashtra. Rewards/policies/AI provider/medicines still need decisions.

## Coded, awaiting verification - E30/E31/E32

- [ ] E33 full-refund initiation/reconciliation: explicit admin approval, durable duplicate guard, provider checks and pending/failure UI are coded. See REFUND_OPERATIONS.md. Deferred checks and owner provider/mobile acceptance remain pending; partial refunds and scheduled reconciliation remain separate.

- [ ] E32 order notification retries: transactional jobs, bounded idempotent retries, admin processing and owner-run worker are coded. See NOTIFICATION_QUEUE.md. Verification, worker operations, other email flows and delivery events remain pending.

These entries are not untouched tasks: their stated implementation is present. The checkbox tracks verified completion, including the remaining scope written on each line. Earlier verified implementation scopes are ticked below; owner acceptance remains separate. This review did not rerun tests or establish production acceptance.

- [ ] E31 product SEO implementation is present: server product HTML metadata/structured data, active-product sitemap index/pages, robots responses, private-route headers and client navigation cleanup. `SEO_OPERATIONS.md` records configuration and checks. Tests and deployed crawler/preview/HMR acceptance remain pending; do not mark complete from source alone.

- [ ] Coupon management and checkout redemption are coded: admin draft/active/archive workflow, explicit tax treatment, server-calculated discounts, dates, minimums, caps, limits and transactional usage records. Checks, business approval, concurrency and production acceptance remain pending.
- [ ] Delivered-order return submission/status, admin shipment updates, tracking history and guarded order/shipment transitions are coded. Eligibility windows, carrier integration, collection, refund linkage and production acceptance remain pending.
- [ ] Recorded/dispatched/delivered email attempts use verified account email, milestone deduplication and admin accepted/unconfirmed history. Durable retry, delivery events, localization and provider acceptance remain pending.
- [ ] Private JPEG/PNG support attachments and paginated customer/admin conversations are coded. Migrations `20260920000000_support_attachments` and `20260920010000_support_replies` are prepared, not applied; scanning, documents, retention, reply emails and production acceptance remain pending.
- [ ] E30 route metadata foundation is coded and extended by E31 product metadata, structured data and sitemap/robots handlers above. Remaining work here is configured-origin, crawler/social-preview, navigation and deployment verification; do not reimplement those handlers as missing features.
- [ ] E30 verification is deferred by owner: no new test, lint, format, build, migration, browser, provider or production evidence is recorded. Keep E30 unchecked until its stated checks pass.

## Earlier verified implementation scopes - E21 to E28

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E21 offline implementation: owned real Order Details, cart/address checkout preview, multi-rating and hex filters, safe route fallback, connectivity notices and footer placeholder removal. Checkpoint: 145 tests/build/types/format pass (PROJECT_STATUS E21/E22).
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E22 offline implementation: support ticket creation/tracking/admin statuses, owned cancellation, idempotent request IDs and conditional Resend notifications, with prepared migration. See PROJECT_STATUS for bounded evidence.
- [ ] Owner applies support migrations/configures SUPPORT_EMAIL and validates support/customer receipt/privacy/device behavior. E30 image attachments and threaded replies are coded but unverified; durable retries and reply/status email notifications remain unimplemented.
- [ ] Complete remaining payment/refund scope and owner acceptance. E23 checkout and E25 reconciliation have bounded evidence below; E33 full-refund initiation is coded but unverified. Partial refunds, scheduled reconciliation and approved business rules remain open.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E23 bounded offline implementation: configured checkout quote/submission, atomic UUID retry protection, admin charge controls, customer Razorpay controls, strict capture matching and original-body webhook handling. 157 synthetic tests pass; see PROJECT_STATUS E23 and CHECKOUT_PAYMENTS.md.
- [ ] E23 owner acceptance: approve charges/policies; validate provider success, declined/failed, authorized/pending, contradictory/late callbacks, Vercel raw webhooks, stock/retry concurrency and mobile behavior. Verified failed attempts now update Payment only while the Order remains awaiting payment; an ambiguous/processing provider status stays unconfirmed. Refunds, reconciliation jobs and remaining commerce rules are still pending.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E24 bounded offline implementation: connected admin message composition/history, verified-recipient validation, saved-before-send records and duplicate-ID protection. 161 synthetic tests pass; see PROJECT_STATUS E24.
- [ ] E24 owner acceptance: admin authorization, provider delivery/rejection, interrupted sends, account switching and phone form/history behavior. History beyond the latest 100 is now coded with cursor pagination (2026-09-24), unverified. Durable retries and delivery events remain incomplete.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E25 bounded offline refund integrity: replace manual refund status mutation with provider-backed full-refund reconciliation and reject manual REFUNDED edits through order/return controls. 164 synthetic tests pass; see PROJECT_STATUS E25.
- [ ] E25 owner acceptance and remaining refunds: verify provider full/partial/failed outcomes, audit legacy manually-refunded records, implement approved refund initiation/eligibility, partial refunds and durable audit/reconciliation. Verification does not issue refunds or establish bank settlement.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E26 bounded offline implementation: admin return history and guarded explicit review decisions, with owner/order consistency checks and no financial/stock effects. Fixed independent admin panel visibility; 169 tests pass (PROJECT_STATUS E26).
- [ ] E26 remaining return scope: E30 customer creation/status and manual shipment integration are coded but unverified. Approved eligibility/policy, full history/audit, collection/refund linkage and owner browser/device acceptance remain pending.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E27 bounded offline implementation: public Help page/navigation and explicit five-step route tour with previous/next/exit controls, without storage or API writes. 171 tests pass (PROJECT_STATUS E27).
- [ ] E27 owner keyboard/focus/phone acceptance and full English/Hindi/Marathi help/tour localization remain pending.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ E28 bounded offline implementation: private first-purchase feedback in Orders/paid Details and admin Feedback, with owner-derived order, one-response constraint, retry reconciliation and quotas. 176 tests pass (PROJECT_STATUS E28).
- [ ] Owner applies purchase-feedback migration and validates eligibility, isolation, real concurrency and phone/provider-history behavior. Retention policy, editing, deeper history and localization remain pending.

## Previous task: customer order history (E20)

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Connect Orders to private paginated customer history with minimal selected fields and loading/empty/error/retry states. 133 offline tests, types/build and formatting pass; evidence in PROJECT_STATUS E20.
- [ ] Owner production/mobile acceptance: own-account history, pagination, account switching, slow/error states and stored totals/status. E21/E23 subsequently implement Order Details and configured Checkout; their acceptance is tracked separately.

## Previous task: Profile page and saved addresses (E19)

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Implement shared signed-in /profile for customers and admins, personal-details/password-confirmed phone updates, verification/recovery links and owned address create/edit/delete/default management. Nine new synthetic regressions pass; 129 total tests, offline build/types and formatting pass. See PROJECT_STATUS E19.
- [ ] Owner production acceptance: customer/admin profile, login phone changes, address mutations/defaults/order-reference conflicts, account isolation, 429/slow/offline failures and mobile keyboard/focus/layout. Email-address replacement, mobile verification and full localization remain separate work.

## Previous task: email verification (E18)

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Implement verification page, account-email status, session-owned resend with IP/account quotas, secure signup links and duplicate/pending/error handling. All 120 offline tests and offline build/types pass; see PROJECT_STATUS E18 for scope.
- [ ] Owner production acceptance: signup and resend delivery, expired/used links, 429s, status refresh, existing login and Android/iOS interaction/accessibility. E19 common profile scope is verified separately; email changes, mobile verification and durable notifications remain pending.

## Previous task: password recovery and token claims (E16)

Owner: Codex for offline implementation; product owner for production/provider/device acceptance. Contract and acceptance scenarios: [PASSWORD_RECOVERY.md](PASSWORD_RECOVERY.md).

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Implement Forgot password and Reset password pages, login entry, neutral email-request acknowledgment, one-time transactional reset/verification claims and reset-session revocation. Shared mobile form layout, failed drafts, duplicate guards and URL-token handling are implemented; all 108 offline tests, formatting and environment-disabled build pass with three existing lint warnings (PROJECT_STATUS E16).
- [ ] Product owner: verify delivery/opening of reset emails, new/old password login, revoked sessions, reused/expired links, simultaneous requests and Android/iOS recovery flows on production. Timing-enumeration resistance, recipient-level abuse controls and post-reset notification delivery remain security/notification work.

## Previous task: safe API errors (E15)

Owner: Codex for offline implementation and evidence; product owner for production acceptance.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Add safe dispatcher exception handling, malformed-path rejection, explicit route lookup and consistent error details; standardize newsletter/auth/method/health errors and preserve newsletter drafts and success responses. All 94 offline tests, formatting and environment-disabled build pass; three existing lint warnings remain (PROJECT_STATUS E15).
- [ ] Product owner: validate E15 on the deployed revision: existing success flows, newsletter error/confirmation feedback, safe unknown-route responses and matching error/request IDs. The Home newsletter now leaves an already-subscribed address editable and re-enables Submit after an edit (2026-09-27). Provider/browser/mobile acceptance remains pending; no deliberate production failures were triggered by Codex.

## Previous task: CSRF protection (E14)

Owner: Codex for offline implementation; product owner for production acceptance. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for the shared API contract and rollout.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Implement central CSRF bootstrap/token validation, session-scoped client handling and exact signed-webhook exception; 75 offline tests pass including existing regressions and E14 security cases. Evidence: PROJECT_STATUS E14.
- [ ] Product owner: validate E14 on production/preview hosts and mobile browsers, including login/logout, existing write flows, expired sessions, cross-tab behavior and provider callbacks. Deploy frontend/server together and refresh old tabs.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Owner reports CSRF working on the deployed application; supplied screenshot confirms X-CSRF-Token is attached to a same-origin request (E14 owner report, 2026-09-13). Broader rejection/device/provider acceptance above remains pending.

## Previous task: order inventory integrity (E13)

Owner: Codex for implementation and offline regression evidence; product owner for production validation. Scope: atomic stock reservation/cart consumption, one-time customer/admin cancellation restock, terminal-order protection and late-payment order-state guards. No new migration or provider refund implementation is included. Broader requirements remain in this backlog; validation tasks must not block unrelated implementation work.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Implement and test E13 order inventory integrity with serializable transactions, conditional updates and rollback; default suite now passes 56 tests. Offline client/API compilation and formatting pass; three pre-existing lint warnings remain.
- [ ] Product owner: validate E13 against production with controlled test orders, competing checkout/cancellation requests and delayed payment events. Real database concurrency and provider behavior are not established by the synthetic transaction tests.

## Release gates: security and resilience

- [ ] UI testing foundation: set up Playwright Test and @axe-core/playwright, preserve Node.js suites, and add route/state/mobile/validation/visual coverage per UI_UX_REVIEW_GUIDE.md. Setup/execution remain deferred; Vitest is optional later. Record browser, provider test-mode and real-device evidence separately.

These must be addressed before calling the application stable or production-ready:

- [ ] Complete the React Query server-state strategy across required page reads, private user-scoped cache keys, invalidation, stale data, optimistic rollback and deduplication. React Query is adopted for many reads; session/wishlist restoration remains guarded effects; E11 scopes private keys and shares header/cart reads, and E20-E23 integrate Orders/Order Details/Checkout reads with private scope. Earlier full-migration completion was overstated (E7).
- [ ] Complete and verify safe caching at API/client layers. Public/private headers and logout cache clearing exist; E11 adds private scoping, delayed-response guards and no-store errors; live account-switch/browser acceptance remains unverified (E7).
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Prior production dependency-audit remediation: earlier recorded `npm audit --omit=dev` reported 0 vulnerabilities after aligning Prisma packages at 6.12.0 (historical evidence E6). A fresh release audit is tracked separately below.
- [ ] Complete user-input/rendered-content XSS review. HTTP(S) URL filtering and upload signature/MIME/base64/size checks exist. Current CSP is absent, including report-only mode; controlled CSP, external media, full content validation and live verification remain (E1, E7).
- [ ] Add authentication-aware rate limits to login, signup, password reset, review, upload, support, coupon, and admin endpoints. PostgreSQL counters and dispatcher policies are implemented for existing writes; E11 verifies migration status and live temporary-table SQL; production-host/browser checks and future support/coupon endpoints remain pending. See `RATE_LIMITING.md`.
- [ ] Handle too many requests with consistent `429` responses, retry guidance, request IDs, and snackbar/UI feedback. Structured 429s, typed client errors, translated snackbars and no automatic 429 retries are implemented and covered by automated tests; live browser acceptance remains pending.
- [ ] Perform a penetration test and document scope, findings, remediation, and retest evidence.
- [ ] Ensure customer data is scoped server-side to the authenticated customer or authorized admin. Do not share customer records through catalog, logs, browser storage, or broad API responses.
- [ ] Review the browser Network panel and production bundles for exposed secrets, private data, internal endpoints, and unnecessary responses.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Implement and test client/outbound-provider timeout wrappers: 30 seconds by default, with a 60-second long-running override and typed timeout errors (E1). This does not establish a database/function execution deadline.

Additional release checks:

- [ ] Re-run dependency/security checks against the release lockfile and record the result; historical audits do not certify a new release.
- [ ] Verify database/function execution budgets, client cancellation, retry/idempotency and ambiguous outcomes end to end.
- [ ] E11 verifies no pending migrations and passing live temporary-table SQL. Finish production-host/browser concurrency/429 recovery acceptance and schedule expired-counter cleanup.
- [ ] Complete API error localization and production recovery acceptance. E15 implements structured errors and safe dispatcher exception handling, including newsletter errors; offline scope is verified above. Full localized messages and live acceptance remain pending.
- [ ] Review CSRF protection, signup/verification/account enumeration, remaining ownership/CSRF and payment/webhook replay/state-transition gaps; E13 adds stock/cancellation concurrency guards with production acceptance still pending.
- [ ] Remediate and verify source-audit findings SEC-01 through SEC-06 in ARCHITECTURE_UI_UX_AUDIT.md against the security gates above; E11 repairs order-address validation, account/session scoping and error caching; retain full browser/customer-isolation and remaining security verification. These are detailed findings within the existing gates, not separate security completion claims.

## Product features

- [ ] Integrate the AI assistant with an approved provider, server-side secrets, moderation, usage limits, and auditability.
- [ ] Add a route tour/onboarding flow that is keyboard accessible and dismissible.
- [ ] Complete profile functionality: profile editing, password reset/change, address creation/update/delete/default selection, and validation.
- [ ] Add a help button and support entry points.
- [ ] Add a post-first-purchase feedback form to evaluate the customer experience.
- [ ] Add refer-a-friend incentives with abuse controls, attribution, eligibility, and reward status.
- [ ] Add cashback rules, ledger entries, balance display, eligibility, expiry, and reconciliation.
- [ ] Add admin coupon create/update/delete with active date range, usage limits, eligibility, and audit records.
- [ ] Add purchase-based discounts with explicit stacking and calculation rules.
- [ ] Implement SKU-level product variants and option selection across seller/admin authoring, catalog/product detail, cart, checkout, immutable order snapshots, inventory reservation/restock and fulfillment; see [PRODUCT_VARIANTS.md](PRODUCT_VARIANTS.md). Preserve existing simple products and keep medicine listing/purchase disabled until the separate approval gate is met.
- [ ] Add medicines only after confirming catalog, regulatory, prescription, fulfillment, privacy, and payment requirements.

## UI, routing, content, and operations

- [ ] P1 mobile-first: apply the shared layout/token/component standard in ARCHITECTURE_UI_UX_AUDIT.md across every route and admin tab. Most customers use phones; verify phone layouts first, then tablet/desktop. Include width variants, gutters/spacing, readable typography, touch targets, accessible mobile navigation/filters, keyboard/safe-area behavior, reduced motion and overlay clearance. Record real Android Chrome/iOS Safari and slow-network evidence or explicit device blockers using the documented matrix.
- [ ] Repair the audited action/read-state gaps (UX-01 through UX-08): shared header/page queries, cart quantity feedback and conflict locks, tracking pending/errors, admin load errors/upload progress, search debounce/cancellation, authentic content and no unused form fields. Preserve inputs and verify slow/error/duplicate-click behavior.

- [ ] Unknown routes such as `/admin/abc` should resolve to the relevant parent route (`/admin`) or a deliberate not-found route, consistently across client and server navigation.
- [ ] Replace the rating filterÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢s radio controls with checkboxes where multiple ratings can be selected.
- [ ] Show color filters as checkboxes with visible color swatches and hexadecimal values.
- [ ] Verify guest/authenticated route affordances across responsive layouts. Guest navigation now hides private Orders, direct protected-route sign-in returns to the requested path, guest tracking offers an explicit sign-in action, and admin-only routes explain whether sign-in or administrator access is needed. Rendered phone/tablet/keyboard and authorization acceptance remain pending.
- [ ] Verify and tighten Admin navigation visibility with a route back to the dashboard. E11 removes the current-route fallback; the link requires verified ADMIN role and content/API access remains separately guarded.
- [ ] Add and verify configured social links in header/footer/rail placements.
- [ ] Support messages must send through Resend to an environment-configured support address; never hard-code or expose the address in the client.
- [ ] When a support request is created, email the customer a confirmation that the ticket was received and will be handled promptly.
- [ ] Add a customer request page showing ticket status, resolution, cancellation, reasons, timestamps, and support responses.
- [ ] Update privacy, returns, refunds, terms, age language, and other policies for the actual ecommerce operation; obtain approved legal copy before publishing.
- [ ] Verify E11 session behavior in browsers: account/generation isolation, 401 expiry, awaited logout, BroadcastChannel invalidation and visibility recheck. Wishlist stays in memory; no customer payloads or credentials are persisted.
- [ ] Complete payment integration, server-side amount verification, webhooks, idempotency, failure states, refunds, and reconciliation.
- [ ] Remove hard-coded brand/product images and use configured or database-backed media with safe fallbacks.
- [ ] Review and replace unclear, placeholder, or inconsistent wording across the application.
- [ ] Remove the customer-care phone number until a real number is configured; do not show a placeholder number.
- [ ] Verify E11 compact product-detail loading indicator and stable layout on phones and assistive technology.
- [ ] Keep support submission in-app through the Resend API; do not open Outlook or another mail client. Support uploads must be validated and attached safely.
- [ ] Show an offline state immediately when connectivity is lost and a clear online notification when connectivity returns. Avoid losing unsaved form data.
- [ ] Add SEO metadata, canonical URLs, sitemap/robots behavior, structured product data, social previews, and crawl-safe route handling.

## Architecture and commerce requirements carried forward

- [ ] Complete structural code cleanup after the formatting baseline: focused page/domain components and hooks, typed API contracts instead of loose any, removal of duplicate/obsolete CSS and state, and resolution of existing React warnings with relevant regression evidence. Follow the security-first audit; do not combine behavior changes with broad mechanical rewrites.

These requirements from REQUIREMENTS.md and the original brief remain in scope alongside the product-owner list above:

- [ ] Complete database/admin-managed business identity, branding, contact, currency, locale, timezone, social/footer content, shipping and feature settings; verify a second-business deployment without source changes.
- [ ] Finish English/Hindi/Marathi localization across UI, validation, errors, emails, statuses and business content.
- [ ] Add API-configured independent home sections and complete catalog cursor loading, full facets and large-catalog performance verification.
- [ ] Fetch real Orders/Order Details data and use actual cart totals in Checkout; remove hardcoded delivered/paid dates and catalog-derived placeholder orders.
- [ ] Wishlist page deferred by user request: navigation is hidden and /wishlist redirects to /products. Reconsider the page later; before restoring it, render saved products outside the initial catalog and verify empty/error/account-switch states. Product heart actions remain available.
- [ ] Complete email/mobile-verification customer routes and profile/address workflows. E16 adds forgot/reset-password pages and atomic token claims; production password-recovery acceptance and mobile-only account recovery remain pending.
- [ ] Define verified-purchase/moderation eligibility. E11 removes generated fallback reviews; verify live customer review/error/empty states.
- [ ] Integrate actual provider refunds and complete configurable cancellation/returns/refund workflows, amounts, idempotency and auditability.
- [ ] Finish shipment/tracking integration and resolve the order-number versus internal-ID mismatch; add a configurable map/GPS provider only after confirmation.
- [ ] Connect admin Messages and Settings forms, complete customer/fulfillment/return operations and add real audit event persistence.
- [ ] Define appropriate admin permissions beyond the current CUSTOMER/ADMIN model.
- [ ] Implement durable localized transactional notification events, retries and admin failure visibility for the required account/order/payment/refund/delivery lifecycle.
- [ ] Add versioned localized policy/CMS storage, publication/approval and consent versions where applicable; provide missing cancellation/shipping/cookie pages as required.
- [ ] Verify shared design-system accessibility, keyboard/focus, light-theme contrast, responsive layout and overlay layering across all pages.
- [ ] Add end-to-end success/failure, authorization, provider, performance and release regression tests; E11 repairs/re-enables the legacy wishlist regressions; full end-to-end coverage remains pending.
- [ ] Establish CI, monitoring, backup/restore, migration, deployment and rollback procedures with evidence.

## Verified bounded milestones

These do not complete the broader release gates:

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Order-address POST ownership validation, private cache generation guards, no-store errors and cart optimistic coordination pass synthetic regression tests; 38 tests in the default suite (E11). Live customer/browser acceptance remains pending.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Configured database migration status verified (three migrations, none pending) and live temporary-table rate-limit SQL checks pass after correcting environment initialization order (E11). This is point-in-time: subsequent .env edits removed DATABASE_URL and recovery verification is blocked until restored; it does not certify another database or production host.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Vercel local route/module/API transport regression repaired and verified on port 3100 (E12); production deployment and rendered browser checks remain pending.


- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Source formatting baseline and repeatable format/format:check workflow established with pinned Prettier and editor settings (E10). Formatting/debug checks, 20 tests and build/types pass; lint retains eight existing warnings. Structural refactoring remains pending.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Consolidated architecture/security/UI source audit and shared design standard recorded in ARCHITECTURE_UI_UX_AUDIT.md; Codex/Copilot workflow aligned (E9). Remediation and rendered/browser acceptance remain pending.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Existing login works on the user's deployment, as explicitly reported by the user (E4); new loader and rate-limit rollout remain separate.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Automated upload-validator regression scope passes for supported signatures, spoofed content, encoding/type mismatches and size boundaries (E1); live upload and broader XSS remain pending.
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Documentation synchronized to the current source, page map and recorded evidence in this pass (E7, E8).

## Acceptance and documentation

Security increment: product and review upload validation now checks base64, declared/data-URL MIME agreement, decoded size, and supported signatures, with generated storage filenames. Automated tests pass; the XSS item stays pending until the remaining rendering, CSP, and live deployment checks are verified. See `PROJECT_STATUS.md` for scope and limitations.

Each item needs an owner/priority, implementation notes, API/data changes, security impact, and verification evidence. Update `PROJECT_STATUS.md`, `API_IMPLEMENTATION_PLAN.md`, and this file when scope changes. Keep the Codex (`AGENTS.md`, `CODEX_INSTRUCTIONS.md`) and Copilot (`.github/copilot-instructions.md`) instructions aligned with this backlog.


## Newsletter partial-success repair - E17

- [ ] Duplicate-subscription fix (2026-09-23): atomic creation/reactivation elects one provider sender; active subscribers receive 409 ALREADY_SUBSCRIBED with inline/snackbar feedback. The Home form keeps the address editable and offers an enabled “Try another email” action after an already-subscribed or saved-but-undelivered response; it does not replay the same subscription or resend the welcome email (2026-09-29). Three focused offline form tests pass; owner production/provider acceptance remains pending.

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Saved-subscription confirmation failures reconcile to Subscribed with informational feedback and no replay; privacy-safe failure diagnostics and 111 offline tests verify the bounded behavior (PROJECT_STATUS E17).
- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Owner reports newsletter working on 2026-09-14 (PROJECT_STATUS E17 owner report). Exact provider configuration fix and independent delivery/device evidence were not supplied; this does not verify every notification flow.


## Policy publication - E29

- [x] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Bounded offline E29: policy drafts/publication, version conflicts, immutable publication history/audit, published-only DTOs and additional policy routes. Prior verification: full 181-test pass plus expanded seven-case policy suite; see PROJECT_STATUS.
- [ ] Owner supplies approved policy/age text and validates publication/privacy/device behavior. Checkout consent, cookie consent, rollback/unpublish and legal/localization acceptance remain pending.

Current owner workflow (2026-09-15): defer format, lint and test commands until remaining implementation is finished. Newly added work stays unverified until the final checks; do not mark it completed just because code exists.

Shared cart action update (2026-09-28): ProductCard, Product Details and Cart now use a citron-accent primary cart action and a softer segmented quantity control, with semantic danger styling for removing the last item. Interaction and device verification remain pending.

Shared cart action follow-up (2026-09-28): changed the over-bright accent to a quiet sage tint, removed native button bevel/borders from the segmented quantity control, and separated the count on a neutral inset surface. Shared controls use 48px height and 44px action targets; responsive visual acceptance remains pending.

Shared quantity-control consistency update (2026-09-29): shared controls keep a 48px height and 44px action targets. Cart uses a compact 136px stepper; catalog-card steppers now honor the full-width variant and expand to the Add to cart width with a flexible centered quantity segment and connected dividers. CTA and quantity-control widths match in catalog cards; visual/device acceptance remains pending.

UI-06 MUI coverage update (2026-09-29): Home and Products route surfaces are now migrated to the customized MUI system, including Products carousel, desktop/mobile filters, loading skeletons and catalog empty/error/pagination states. Existing query behavior is preserved. Component tests pass; final offline build plus rendered/mobile acceptance are pending. UI-01 remains open for remaining routes/components and full state/story coverage.
Shared-layout follow-up (2026-09-29): Home and Products route content is migrated to MUI, but the shared SiteLayout header/footer and SocialLinks still use legacy markup/styles and therefore remain part of UI-01. The migration is partial until those cross-route consumers move.

UI-04 MUI migration update (2026-09-29): /admin shell/section navigation, shared DataGrid (Products/Orders/Customers) and shared right-side FormDialog are migrated to customized MUI wrappers. Server query contracts and dialog pending guards remain. Tab-specific forms/panels and standalone admin routes (Support, Fulfillment, Sellers, Seller Products) are still legacy and remain pending; rendered keyboard/mobile acceptance is also pending.
ReturnRequests in the Returns tab is now also migrated to MUI for its record cards, decision form and query states (2026-09-29). Other tab bodies still remain pending.
