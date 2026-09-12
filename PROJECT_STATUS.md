# Project status

Reviewed: 2026-09-12. This describes the current workspace, including staged implementation. It does not certify the deployed revision or production readiness.

[APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) is the only completion checklist. A checked item needs implementation and relevant verification evidence. A build alone does not establish live behavior. Earlier snapshots are preserved in [historical status](docs/history/PROJECT_STATUS_BEFORE_SYNC.md); contradictions there are superseded by this document.

## Verification evidence

| Evidence | Result and scope |
| --- | --- |
| E1 — automated tests | `npm test` rerun during documentation synchronization: all 20 tests passed (3 timeout, 5 media validation, 12 rate-limit/client tests). Rate-limit policy/concurrency tests use an injected shared-store double. |
| E2 — build/types | Latest implementation build passed: Prisma generation, frontend and API type checks, Vite build. No application code changed in this documentation pass. |
| E3 — lint | Latest implementation lint completed with existing React warnings. This is not a warning-free result. |
| E4 — deployment reports | User confirmed Vercel deployment succeeded after earlier API consolidation/routing work and later confirmed login works. This is user-reported login evidence, not a test of every endpoint or the new session loader/rate limiter. |
| E5 — database | User previously supplied “schema is up to date” for the first two migrations. The new third migration has not been applied by this agent. The current temporary-table PostgreSQL test failed with P1012 because local environment files did not supply a usable DATABASE_URL. |
| E6 — historical security/testing | Earlier status recorded production dependency audit 0 vulnerabilities after Prisma remediation and two wishlist optimistic tests passing. Neither result was refreshed in this documentation pass. The legacy wishlist test is outside the current default suite and needs its imports/transport fixture revisited. |
| E7 — source audit | Router, page components, API handlers, schema/migrations, scripts, query keys, config, Vite/Vercel configuration and all project Markdown inspected. Documentation claims corrected against those files. |
| E8 — documentation validation | Relative Markdown links, registered route inventory, script/handler references, completion formatting and stale active-document claims checked during this pass. Historical documents are explicitly labelled. |

## Current implementation

| Area | Implemented | Remaining or verification limit |
| --- | --- | --- |
| Runtime/deployment | React/Vite/TypeScript; Prisma/PostgreSQL; one Vercel API dispatcher; SPA rewrites; Node 22 local dev guidance | Current host/region/environment and latest deployment need live verification. |
| Authentication | Scrypt password hashes, 30-day HttpOnly sessions, Secure in production, SameSite=Lax, configured-admin bootstrap, server guards, credentialed client fetch | User reports login works (E4). Session expiry, cross-tab behavior, revoked sessions, CSRF and customer isolation need complete review. |
| Refresh | Initial session loading gate, stale-response guard, URL preserved until session settles | Build/lint evidence only for the new loader; live refresh verification pending. |
| Catalog/categories | Database-backed products and categories, search/sort/filter APIs, 24-item API cursor pages, default-category seed | Shop never consumes nextCursor to load more; facets and some pages depend on initial catalog data. Home sections remain mostly local content. |
| Cart/wishlist | Persistent server endpoints, optimistic counts/hearts, serialization/rollback, API-backed page reads | Private cache scoping, cross-tab storage, missing wishlist products outside initial catalog, load errors and live concurrency need work. |
| Reviews | One review per customer/product enforced by schema; create plus own-review edit, compact pencil action, public media, upload lock | Live ownership/edit/media verification remains. Generated fallback reviews still exist in ProductDetailPage and must not imply genuine customer feedback. |
| Product admin | Create/edit, strict category select/add-category, price/stock/colors/media, archive, immediate local list update, reset after success | Authenticated save/edit/upload verification pending; category edits/deletion are not supplied. |
| Other admin | Reads for analytics/products/orders/payments/returns/customers/settings; some update handlers | Messages UI has no submission handler; settings UI is informational; audit endpoint returns an empty list. Admin refund action changes database status without issuing a provider refund. |
| Orders/checkout | Server order create/list/detail/cancel and Razorpay create/verify/webhook handlers exist | Customer Orders is an empty shell; Order Details uses catalog products and hardcoded delivered/paid information; Checkout uses placeholder totals and submits nothing. Address ownership, stock concurrency, money/idempotency and raw-webhook handling require review. |
| Tracking/support | Authenticated shipment lookup API and tracking query; Resend helper and admin messaging endpoint | Tracking UI says order number but API uses internal order ID. Support uses mailto/tel, with no ticket form/API/tracking. Customer receipt emails and attachments are pending. |
| Newsletter/email | Newsletter persistence and optional Resend audience/contact/confirmation requests; auth email/SMS helpers | Provider delivery/retry verification missing. Newsletter still has Field & Form branding, a relative email link, and legacy string errors. No durable notification worker. |
| Policies/config/localization | Policy placeholder pages; local business config; English/Hindi/Marathi resources; rate-limit messages translated | Full CMS, versioned policy models/consent, business-approved copy and full UI/email localization pending. |
| UX/navigation | Orders link for authenticated users; Admin link for admin state or current /admin route; light-only theme; five-second snackbars | Role visibility edge cases/responsive verification pending. Rating radios, CSS-only filter swatches, placeholder phone, missing routes and other backlog UI work remain. |

## Security and resilience

Timeout wrappers use 30 seconds by default and a 60-second long-running override for configured operations. They throw typed timeout errors; they do not impose a universal database/function execution deadline. E1 verifies wrapper behavior. No two-minute contract is active.

React Query adoption and public/private cache headers are implemented in part. Current private keys such as `['cart']`, `['wishlist']` and `['my-review', productId]` do not include a user ID. App session/header synchronization still uses direct effects. Logout clears the query client, but complete account-switch/isolation verification remains open. Earlier “all pages migrated” claims were too broad.

Product and review uploads validate supported MIME/data-URL agreement, canonical base64, decoded size and media signatures, and generate stored names. E1 covers these checks. Signature checks do not provide full decoding, malware scanning, moderation or safety of externally supplied media URLs. Uploaded Blob media remains public.

Rate limiting now uses atomic PostgreSQL IP and verified-user counters. Structured private 429s include request IDs and Retry-After; client errors use translated snackbars and skip automatic retries. Apply `20260912000000_rate_limit_buckets` before deploying. Unavailable/missing counter storage stops limited writes with safe 503s. E1 passes; E5 blocks live SQL verification. No cleanup job is scheduled. See [RATE_LIMITING.md](RATE_LIMITING.md) for policies and deployment steps. Support/coupon policies do not create those future endpoints.

No active enforced or report-only CSP is configured in current Vite/Vercel files; earlier CSP experiments were removed after development breakage. XSS review, customer isolation/network exposure, penetration testing, fresh dependency review and provider verification remain release gates.

## Priority follow-up

1. Configure database access, apply the new counter migration before deployment, run its temporary-table test, and verify normal writes/429/recovery plus login/refresh on the target host.
2. Complete customer-data, session/storage, error-contract and cache-isolation reviews; verify upload safety and CSP through a controlled deployment.
3. Repair customer Orders/Order Details/Checkout/tracking truthfulness and complete catalog pagination; implement and verify provider payment/refund workflows before enabling purchases.
4. Continue support tickets/email, profile, business configuration/localization and the remaining roadmap from the backlog.

## Documentation audit corrections

This pass updated every maintained project Markdown file, centralized completion in the backlog, corrected runtime/API paths and timeout/snackbar values, replaced outdated prototype-only summaries, and recorded actual page gaps. Broad React Query/caching/security claims remain pending where acceptance criteria are not verified. The original requirements and old status history are retained as context; they are not completion checklists. No application code, credentials, deployment or database state was changed by this documentation task.
