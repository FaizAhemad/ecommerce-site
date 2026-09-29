# Astra change handoff

## Route splitting handoff - 2026-09-30

Preserve module-scope React.lazy page imports and StorefrontRoute Suspense boundary. Do not restore eager page imports or preload private pages for guests. The shared shell and existing route/server authorization remain unchanged. PROJECT_STATUS.md records entry-size evidence and remaining performance acceptance.

## Shared MUI handoff - 2026-09-30

Use the refined shared MUI theme and src/components/DataGrid.tsx composition for subsequent migration. shared-grid.stories.tsx demonstrates the application grid; data-grid.stories.tsx is the separate X Community example. Preserve server queries and retained results. See PROJECT_STATUS.md for evidence and pending catalog/device coverage.

Owner rebrand direction (2026-09-30): follow REBRAND_IMPLEMENTATION_PLAN.md and SCHEMA_EVOLUTION_PLAN.md for the planned application-wide MUI redesign, loading/non-blocking interaction work and schema evolution. MUI is the target UI system, superseding historical Tailwind/Radix migration direction. Existing legacy styling stays only until its consumers migrate. The new palette is proposed, not deployed. APPLICATION_BACKLOG.md remains the sole checklist; all identity, financial, marketplace, live-operation and owner acceptance gates remain. This batch is planning/documentation only.

Updated 2026-09-25 for the UI/UX workstream. Read this with [LUNA_ANALYSIS.md](LUNA_ANALYSIS.md), [UI_UX_REVIEW_GUIDE.md](UI_UX_REVIEW_GUIDE.md), [PAGE_INVENTORY.md](PAGE_INVENTORY.md) and [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md).

## What the analysis establishes

The application needs one shared professional ecommerce system, applied to every page and component. The approved direction is warm neutral surfaces, dark ink text/actions, restrained citron accents, semantic feedback colors, consistent 4/8/12/16/24/32/48px spacing, shared widths and readable typography. Do not invent a new palette for an individual page.

Every page, admin tab, notification, overlay, form, card, button, loader, empty state and error state is in scope. Review source consumers and rendered states; do not stop after improving the home page or checkout.

## Implementation sequence

1. Inventory shared and page-local consumers; consolidate tokens, layout, controls, fields, cards, loading/error states, dialogs and notifications.

Product catalog loading pass (2026-09-25): `loading-and-media.css` now gives `/products` skeleton cards a realistic image silhouette, metadata/rating/action placeholders, stronger warm-neutral contrast, compact card height, and reduced-motion behavior. This is source-level work; rendered browser/device acceptance remains separate.

Loaded catalog card pass (2026-09-25): seller attribution now has an explicit muted label style and phone cards use tighter information spacing so image, seller, price, rating and add action read as one card. Shared `ProductCard` markup remains the source for virtualized and static grids.

Palette pass (2026-09-25): refined the shared paper/surface/line/muted tokens and introduced named skeleton base/highlight/shape tokens. The goal is clearer surface separation while retaining Gadgify's warm neutral direction; all loading colors now consume the shared tokens.

Homepage palette pass (2026-09-25): lifted the paper/surface contrast and gave hero/product art a slightly clearer sage accent so the page does not read as monochrome beige. Typography and dark primary controls remain unchanged for contrast.

Typography/card pass (2026-09-25): added shared body/display font, type-size and line-height tokens; product cards now consume the display/body tokens for title, category, seller and price rather than relying on isolated values. Full route consumer migration remains part of the UI review backlog.

Brand/loading pass (2026-09-25): added a native Gadgify loading lockup using the shared circular G mark and wordmark, a subtle sage radial site background treatment, and a restrained mark border. This keeps the brand crisp and scalable without depending on a generated bitmap.

Single-product catalog pass (2026-09-25): small catalogs (six products or fewer) bypass virtualization, and the one-product state receives a deliberate 300px desktop card width with a full-width phone layout. This prevents virtualization reserve space from making a sparse catalog look broken while retaining virtualization for larger collections.

Catalog density pass (2026-09-25): wide desktop grids now use five columns at 1440px and above; `VirtualizedProductGrid` uses the same breakpoint so row slicing and visual columns stay aligned. Standard desktop remains four columns and phone remains two.

Single-card scale refinement (2026-09-25): reduced the deliberate desktop width for the one-product catalog state from 300px to 260px; multi-product column behavior is unchanged.
2. Apply the foundation to startup/navigation and the customer purchase path.
3. Apply it to account/support/information pages.
4. Apply it to seller and admin pages/tabs.
5. Recheck every affected consumer at phone, tablet and desktop widths, then run the planned UI/accessibility and existing server suites.

## Current source changes

- Startup loader: existing Gadgify artwork now enters in sequence, tracks mouse movement with subtle parallax and pairs a low-key brand pulse with animated waiting dots. Reduced-motion settings disable the animation and pointer response; no timed completion or fabricated progress is shown. Source/build evidence remains separate from rendered/device acceptance.

- `controls.css` owns shared primary and secondary button variants.
- `index.css` owns shared font, spacing and control tokens.
- `PageContainer`/layout styles own central gutters.
- `OrderTotals`, `FormDialog` and `NotificationProvider` are shared primitives.
- The component inventory has started in `PAGE_INVENTORY.md`; it is not complete.
- Homepage screenshot pass tightened mobile header/navigation and hero rhythm; see `PAGE_INVENTORY.md` and `PROJECT_STATUS.md`.

## Rules for the next agent

- Inspect current source and docs before editing; preserve user-authored/staged changes.
- Fix a shared cause and then inspect its consumers. Avoid copied page-specific overrides.
- Preserve auth, customer/shop isolation, CSRF, private cache keys, request budgets, pending guards, failed drafts and five-second snackbars.
- Use sentence-case, customer-facing wording and explain safe next steps.
- Do not enable external-shop purchasing, commissions, payouts, mandatory inspection or other undecided business rules.
- Keep `APPLICATION_BACKLOG.md` as the only completion checklist. Record evidence and limits in `PROJECT_STATUS.md`; update `PAGE_INVENTORY.md` when route/component behavior changes.
- Treat source review, owner screenshots, browser inspection and real-device verification as separate evidence. Never claim one as another.

## Immediate next change

Complete the shared visual inventory and migrate the startup/session loader, fields, cards and notification states to the tokens and primitives above. Then inspect the full home-to-order journey before moving to account, support, seller and admin screens.
