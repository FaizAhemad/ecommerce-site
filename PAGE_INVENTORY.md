# Page and route inventory

This is the source of truth for the pages currently implemented by the storefront. Route ownership is defined in [`src/router.tsx`](src/router.tsx); update this inventory in the same change whenever a page, route, access rule, or page-level behavior changes.

Status values describe the current implementation, not the overall product roadmap. Roadmap work remains tracked in [`APPLICATION_BACKLOG.md`](APPLICATION_BACKLOG.md).

## Public and customer pages

| Route | Page component | Access | Current status and scope |
| --- | --- | --- | --- |
| `/` | `HomePage` | Public | Storefront landing page with product discovery and promotional sections. |
| `/products` | `ShopPage` | Public | Product listing, search, filters, sorting, and product navigation. |
| `/product/:id` | `ProductDetailPage` | Public | Product media, details, ratings/reviews, review media, wishlist, add-to-cart, and authenticated review editing. The server identifies the customer from the session and permits one create plus subsequent edits per product; the Edit review action appears only for that customer’s existing review. |
| `/support` | `SupportPage` | Public | Support request form; Resend delivery and request tracking remain roadmap work. |
| `/track-order` | `TrackOrderPage` | Public | Order tracking entry/status flow. |
| `/privacy` | `PolicyPage` (`privacy`) | Public | Privacy policy page; final legal copy remains to be reviewed. |
| `/returns` | `PolicyPage` (`returns`) | Public | Returns policy page; final legal copy remains to be reviewed. |
| `/refund-policy` | `PolicyPage` (`refund`) | Public | Refund policy page; final legal copy remains to be reviewed. |
| `/terms` | `PolicyPage` (`terms`) | Public | Terms page; final legal copy remains to be reviewed. |
| `/terms-and-conditions` | `PolicyPage` (`terms`) | Public | Terms and conditions alias. |

## Authentication and account pages

| Route | Page component | Access | Current status and scope |
| --- | --- | --- | --- |
| `/login` | `AuthPage` (`login`) | Public | Sign-in form and authentication flow. |
| `/signup` | `AuthPage` (`signup`) | Public | Registration form and authentication flow. |
| `/cart` | `CartPage` | Authenticated | Cart contents, quantity changes, removal, and checkout navigation. |
| `/wishlist` | `WishlistPage` | Authenticated | Saved products and wishlist actions. |
| `/checkout` | `PaymentPage` | Authenticated | Checkout/payment page shell; payment integration remains pending. |
| `/orders` | `OrdersPage` | Authenticated | Customer order list. |
| `/orders/:id` | `OrderDetailPage` | Authenticated | Customer order details for the requested order. |

## Administration

| Route | Page component | Access | Current status and scope |
| --- | --- | --- | --- |
| `/admin` | `AdminPage` | Authenticated administrator | Product create/edit, category management, and admin product operations. Additional admin workflows remain in the roadmap. |

## Development and fallback behavior

| Route | Page component | Access | Current status and scope |
| --- | --- | --- | --- |
| `/debug-error` | `DebugErrorPage` | Development only | Error-boundary verification route; not a customer-facing page. |
| Any unlisted route | `HomePage` fallback | Depends on app auth state | The current router falls back to the home page. Unknown-route redirect behavior is tracked in the UI backlog. |

## Documentation rule

When adding, removing, renaming, or materially changing a page or route:

1. Update this table in the same change.
2. Update `PROJECT_STATUS.md` when implementation or verification status changes.
3. Update `APPLICATION_BACKLOG.md` only when the related roadmap acceptance criteria are completed and verified; include evidence in `PROJECT_STATUS.md`.
4. Keep `AGENTS.md`, `CODEX_INSTRUCTIONS.md`, and `.github/copilot-instructions.md` aligned with these rules.

## Server-state migration map

React Query is the selected server-state approach. Migrate page data one page at a time with a stable query key, explicit stale/cache policy, and documented invalidation behavior. Public catalog data is the first migrated query (`['storefront']`).

| Page area | Data boundary | Cache rule | Migration status |
| --- | --- | --- | --- |
| Home, shop, product discovery | Public storefront/catalog | Shared public cache is allowed; invalidate after admin catalog changes when safe. | Storefront and filter-driven product-list queries migrated; product detail follow-up pending. |
| Product detail and reviews | Public product data plus user review mutations | Cache product/review reads; update the review key after a successful review. | Migrated. |
| Cart and wishlist | Authenticated customer data | Short-lived user-scoped queries; clear the shared client on logout and synchronize mutation results. | Migrated. |
| Orders, order detail, tracking, checkout | Authenticated customer/payment data | Tracking uses an explicit order query key; order/checkout pages currently have no additional server read. | Migrated for current reads. |
| Login/signup/session | Authentication state | Authentication remains mutation/session state; private query cache is cleared on logout. | Migrated for current session behavior. |
| Admin products, categories, orders, analytics, customers, settings | Authorized administrator data | Admin query keys use zero stale/cache retention; mutation responses update the active admin view. | Migrated for current admin reads. |
