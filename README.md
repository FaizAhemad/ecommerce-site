# White-label Commerce Platform

Vite, React and TypeScript storefront with Node.js API handlers, Prisma/PostgreSQL, Vercel Blob, Resend and Razorpay integration code. The UI uses the light-only Ink and Citron theme. This is an application in development; remaining security and commerce work gates production readiness.

Reviewed against the current workspace on 2026-09-12, including staged changes. Workspace implementation does not imply deployment.

## Documentation map

| File | Purpose |
| --- | --- |
| [ARCHITECTURE_UI_UX_AUDIT.md](ARCHITECTURE_UI_UX_AUDIT.md) | Consolidated security/architecture/UI findings, shared layout standard and page-by-page remediation |
| [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) | Single completion checklist; pending, partial and verified work |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Current implementation, evidence and blockers |
| [PAGE_INVENTORY.md](PAGE_INVENTORY.md) | Every registered route, actual behavior and data boundary |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Desired product and architecture, not a completion report |
| [requirement.md](requirement.md) | Original 49-section brief, retained for context |
| [TARGET.md](TARGET.md) | Delivery sequence and acceptance criteria |
| [API_IMPLEMENTATION_PLAN.md](API_IMPLEMENTATION_PLAN.md) | Current API layout, environment names and integration gaps |
| [NOTIFICATION_GUIDELINES.md](NOTIFICATION_GUIDELINES.md) | Five-second snackbars, validation, loading and failure conventions |
| [RATE_LIMITING.md](RATE_LIMITING.md) | Counter policies, migration order, tests and maintenance |
| [AGENTS.md](AGENTS.md) / [CODEX_INSTRUCTIONS.md](CODEX_INSTRUCTIONS.md) | Contributor/Codex instructions |
| [Copilot instructions](.github/copilot-instructions.md) | Matching Copilot workflow |
| [Historical status](docs/history/PROJECT_STATUS_BEFORE_SYNC.md) | Earlier snapshots; not current completion evidence by themselves |

## Current collaboration workflow

The product owner pushes and validates in production. Codex implements the next backlog task, updates documentation and runs offline regressions/types/compilation; it must not inspect .env or perform live API/database/provider/deployment checks unless the owner changes this direction. Existing local-development instructions below remain optional reference for the owner.

Run `npm run build:offline` to type-check frontend/API code and compile Vite without loading environment files or regenerating Prisma. It requires the generated Prisma types already present from dependency setup. The deployment `npm run build` remains unchanged. E13 adds serializable stock/cart creation and cancellation safeguards; production/provider acceptance stays explicitly open in status/backlog.

## Local development

Use Node 22 for the supported local development workflow (`.nvmrc`). The dev script checks this version because of previous Windows runtime crashes. Package engines do not pin the deployment runtime.

```bash
npm install
npm run dev
```

Vite binds to `127.0.0.1:3000` with a strict port check. Vite alone serves the UI; it does not execute the Vercel API functions. Use the Vercel development workflow (`npx vercel dev`) with a linked/configured project for local API checks. Do not start two servers on port 3000.

```bash
npm run format
npm run format:check
npm test
npm run lint
npm run build
```

Source formatting uses the pinned development-only Prettier version and shared .prettierrc.json/.editorconfig rules: two spaces, single quotes, no optional semicolons, 100-column preferred wrapping and LF line endings. The commands cover frontend/server/dispatcher code, CSS/locales, scripts/tests, the seed and root code/JSON configuration. They skip generated output, the lockfile, secrets, media and migration/history files. Run format after edits and format:check before handing off changes. Oxlint checks code issues separately; formatting does not fix application logic or replace tests. See [Prettier installation guidance](https://prettier.io/docs/install) for the pinned-version approach.

The build generates Prisma Client, type-checks client/server code and builds the frontend into `dist`. The current default suite contains 164 timeout, upload, rate-limit, customer-isolation/cart, wishlist, routing, order-transaction, payment-order-state, CSRF, API-error and password-recovery tests. It is not an end-to-end suite.

## Database and deployment

The single Vercel entry point is `api/[...route].ts`; implementation handlers and helpers live under `server/api`. Keep implementation files out of root `api` to preserve consolidation. Current `vercel.json` uses regex API capture to the dispatcher, a filesystem phase, then an extensionless SPA fallback excluding Vite virtual modules/source/dependencies/assets. Never rewrite module requests to HTML. Local routing is verified in E12; see [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json).

Configure server-only `DATABASE_URL`, then apply migrations before deploying the rate-limit code:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run test:rate-limits:db
```

Seed idempotently upserts ten default categories; it does not seed products or customers. The third migration creates rate-limit counters. Without it, limited writes return safe 503s. The PostgreSQL check uses a temporary table. See [rollout and cleanup](RATE_LIMITING.md).

The user previously reported the first two migrations up to date and login working. E11 verifies the configured database has all three migrations applied and passes temporary-table SQL tests. Authenticated production/browser checks and cleanup scheduling remain open.

## Implementation boundaries

Mobile is the primary customer experience. The [consolidated audit](ARCHITECTURE_UI_UX_AUDIT.md) defines phone-first layouts, touch/keyboard/slow-network acceptance and shared responsive standards. E11 implements shared PageContainer variants, spacing and mobile controls; rendered and real-device verification remains pending.

Catalog/categories, session login, cart/wishlist mutations, product administration and review create/edit are connected to APIs. The wishlist page is temporarily hidden: its header link is removed and /wishlist redirects to /products; product hearts remain available. React Query handles many page reads; header/cart share a query, existing private keys use account/session generation, and session/wishlist synchronization uses guarded effects. Full browser isolation acceptance remains pending.

Orders and Details use private real data. Checkout has configured server totals, atomic submission and Razorpay payment controls (E23); live provider acceptance remains pending. Support tickets and Profile/verification pages are implemented offline. E24 connects admin customer messaging with saved/accepted history; delivery acceptance remains pending. Full settings, AI, incentives, refunds and delivery remain incomplete.

Editable business data should move into configuration/database management. Currently much branding/content remains in `src/config.ts`, the storefront adapter and components; full white-label deployment is a requirement, not a finished capability. Never commit secrets or put private values in browser environment variables. Legal policy pages currently request approved business content.

Local recovery evidence E12: Vercel CLI 58.9.0 starts successfully with Node 22.13.0 on `http://localhost:3100` using `vercel dev --listen 3100`. This test server avoids colliding with an existing port-3000 process. Restart Vercel dev after changing routing configuration; do not add HTML to Vite assetsInclude to hide routing errors. No deployment was performed.

CSRF protection (E14) is centralized in apiFetch and the sole dispatcher. No new environment variable or migration is needed. Deploy frontend/server together and refresh old tabs before testing writes; existing sessions remain subject to normal authentication. Read [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for the API contract and owner production acceptance.

E15 adds safe dispatcher errors and structured newsletter/auth/method/health errors with request correlation. Newsletter preserves saved-versus-confirmation-failed outcomes and failed drafts. No new environment variable or migration is needed; owner production acceptance remains pending. See [API_IMPLEMENTATION_PLAN.md](API_IMPLEMENTATION_PLAN.md#e15-safe-error-contract).

Password recovery (E16): Login now links to /forgot-password, and emailed links open /reset-password. The implementation uses the existing APP_URL, RESEND_API_KEY and RESEND_FROM_EMAIL settings; no migration is needed. See [PASSWORD_RECOVERY.md](PASSWORD_RECOVERY.md) for configuration semantics, token handling, security limits and owner production acceptance.


E17 fixes home newsletter feedback when a subscription is saved but confirmation email fails. The UI shows Subscribed with an informational notice; safe server diagnostics aid owner investigation. This does not establish email delivery. See PROJECT_STATUS E17.


E18 adds Account email and /verify-email with authenticated rate-limited resend, single-use links and verification status. Offline scope passes; owner delivery/mobile acceptance remains pending. See [EMAIL_VERIFICATION.md](EMAIL_VERIFICATION.md).


E19 adds the common Profile page and owned saved addresses, with password-confirmed login-phone updates and protected order-address history. Admin Settings remains separate. See PROFILE_MANAGEMENT.md; offline evidence is in PROJECT_STATUS E19 and production/device acceptance remains pending.


E20 connects Orders to private paginated history with stored totals/status. Order Details and Checkout remain pending. See PROJECT_STATUS E20 for evidence and owner acceptance gaps.


E21/E22 checkpoint adds real order details, cart/address checkout preview, rating/hex controls, routing/connectivity fixes and support requests. Support requires the unapplied migration and server-only SUPPORT_EMAIL; see SUPPORT_REQUESTS.md. E23 adds configured checkout/payment submission; see CHECKOUT_PAYMENTS.md for pending provider and release acceptance.
