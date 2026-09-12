# White-label Commerce Platform

Vite, React and TypeScript storefront with Node.js API handlers, Prisma/PostgreSQL, Vercel Blob, Resend and Razorpay integration code. The UI uses the light-only Ink and Citron theme. This is an application in development; remaining security and commerce work gates production readiness.

Reviewed against the current workspace on 2026-09-12, including staged changes. Workspace implementation does not imply deployment.

## Documentation map

| File | Purpose |
| --- | --- |
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

## Local development

Use Node 22 for the supported local development workflow (`.nvmrc`). The dev script checks this version because of previous Windows runtime crashes. Package engines do not pin the deployment runtime.

```bash
npm install
npm run dev
```

Vite binds to `127.0.0.1:3000` with a strict port check. Vite alone serves the UI; it does not execute the Vercel API functions. Use the Vercel development workflow (`npx vercel dev`) with a linked/configured project for local API checks. Do not start two servers on port 3000.

```bash
npm test
npm run lint
npm run build
```

The build generates Prisma Client, type-checks client/server code and builds the frontend into `dist`. The current default suite contains 20 timeout, upload-validation and rate-limit tests. It is not an end-to-end suite.

## Database and deployment

The single Vercel entry point is `api/[...route].ts`; implementation handlers and helpers live under `server/api`. Keep implementation files out of root `api` to preserve consolidation. Current `vercel.json` routes API paths to the dispatcher and other paths to `index.html` for client navigation.

Configure server-only `DATABASE_URL`, then apply migrations before deploying the rate-limit code:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run test:rate-limits:db
```

Seed idempotently upserts ten default categories; it does not seed products or customers. The third migration creates rate-limit counters. Without it, limited writes return safe 503s. The PostgreSQL check uses a temporary table. See [rollout and cleanup](RATE_LIMITING.md).

The user previously reported the first two migrations up to date and login working. The new counter migration and current authenticated deployment checks are not yet verified here.

## Implementation boundaries

Catalog/categories, session login, cart/wishlist mutations, product administration and review create/edit are connected to APIs. The wishlist page is temporarily hidden: its header link is removed and /wishlist redirects to /products; product hearts remain available. React Query handles many page reads; session/header reads remain effect-driven and private cache scoping needs review.

Orders currently renders an empty shell. Order Details and Checkout use placeholder catalog-derived content, and Checkout does not submit payments. Support still opens email/phone links. Profile/reset/verification customer pages, full settings, customer messaging UI, AI, referrals, coupons, cashback and delivery integrations remain incomplete or absent.

Editable business data should move into configuration/database management. Currently much branding/content remains in `src/config.ts`, the storefront adapter and components; full white-label deployment is a requirement, not a finished capability. Never commit secrets or put private values in browser environment variables. Legal policy pages currently request approved business content.
