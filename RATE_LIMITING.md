# Request limits and deployment

Reviewed against current implementation on 2026-09-12. [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) owns completion; [PROJECT_STATUS.md](PROJECT_STATUS.md) records evidence. All 20 default automated tests pass, but live PostgreSQL/host verification remains pending. The new migration has not been applied by this agent, and no cleanup schedule was installed. Do not treat this document as a deployment confirmation.

The consolidated API dispatcher applies PostgreSQL-backed limits before write handlers run. Each scope has a fixed window starting with its first request. Attempts beyond the limit do not extend that window. Conflicting counter updates use an atomic PostgreSQL upsert and database time, so separate Vercel instances share the same limit.

| Scope | Window | Per IP | Per verified user |
| --- | --- | --- | --- |
| Login | 60 seconds | 10 | — |
| Signup, reset request, mobile code request (combined) | 10 minutes | 5 | — |
| Reset/verification submissions (combined) | 10 minutes | 20 | — |
| Product/review uploads (combined) | 60 seconds | 120 | 40 |
| Review creation/editing, across products | 60 seconds | 60 | 10 |
| Newsletter, future support/coupon writes (combined) | 10 minutes | 10 | 5 |
| Other admin writes | 60 seconds | 180 | 60 |
| Cart, wishlist, order and payment writes | 60 seconds | 240 | 120 |

Only registered routes execute; these policies do not implement support or coupons. Public/other GET reads, `/api/auth/me`, logout, OPTIONS/HEAD and payment webhooks bypass this limiter. Email-verification GET consumes its verification quota. Authorization remains in each handler. The user quota uses a database-verified session, never a body user ID or unverified cookie. IP limits apply first, including to unauthenticated attempts.

On Vercel, the dispatcher trusts the platform-overwritten `x-forwarded-for` header. Outside Vercel deployments it uses the socket address. Missing/invalid addresses share an `unknown` bucket. Alternate hosting or another upstream proxy requires reviewing this assumption; do not trust arbitrary forwarding headers. Different IPv6 spellings and IPv4-mapped addresses are normalized. This is not a distributed bot/DDoS defense; account-targeted abuse across many IPs and edge controls remain part of the security review.

## Required rollout order

1. Configure `DATABASE_URL` for the database used by the target deployment.
2. Run `npx prisma migrate deploy` from this revision. The additive `20260912000000_rate_limit_buckets` migration creates `RateLimitBucket`; it does not alter customer records.
3. Run `npm run test:rate-limits:db` in that configured environment. It uses a transaction-local temporary table, drops it on completion, and does not modify application records.
4. Deploy the code only after the migration succeeds. Without the table or working counter storage, protected writes return safe `503 RATE_LIMIT_UNAVAILABLE`; they do not silently bypass limits. Public reads, session restoration and logout remain available subject to their own dependencies.
5. Verify normal login, refresh, admin save, review upload, newsletter, cart and wishlist behavior on the target host. In a controlled test environment, exceed a quota, confirm `429` plus `Retry-After`, confirm form preservation and snackbar feedback, then confirm recovery after expiry.
6. Schedule `npm run rate-limits:cleanup` daily in existing infrastructure with `DATABASE_URL`. It removes only buckets expired for more than 24 hours. No cron function or scheduled service is configured by this change.

The cleanup and database test scripts load `.env` only when `DATABASE_URL` is not already supplied. They do not automatically select another deployment's credentials. Rate-limit keys are SHA-256 pseudonymous IP/user/scope identifiers, not raw IPs, emails or tokens. Hashing is not anonymization; database access and cleanup remain necessary. Rows are reused for active identities, and cleanup bounds retention for inactive ones.

## Response and UI contract

Exceeded quotas return `429`, `Cache-Control: private, no-store, max-age=0`, and a positive integer `Retry-After`. The JSON error contains `code: RATE_LIMITED`, a safe message, a generated request ID, and `retryAfterSeconds`. Store failure returns `503`, a generated request ID, and `Retry-After: 30` without database error details.

The shared client throws `ApiRateLimitError` on 429; writes are never automatically retried. React Query also skips automatic retries for this error. Existing action catches preserve inputs/optimistic rollback and pass the error to the shared five-second snackbar, translated in English, Hindi and Marathi. Customers can dismiss it and retry after the indicated interval. Other error contracts remain unchanged.

## Verification

`npm test` includes deterministic policy, expiry, user/IP isolation, forged-cookie, outage, proxy-address, and client retry tests. Shared-store tests use an injected in-memory test double; they do not prove live PostgreSQL concurrency. `npm run test:rate-limits:db` exercises the real SQL on a temporary table. Live multi-instance behavior and browser checks are separate rollout acceptance criteria.

Design references: [Vercel request headers](https://vercel.com/docs/headers/request-headers) and [PostgreSQL atomic INSERT/ON CONFLICT](https://www.postgresql.org/docs/18/sql-insert.html).
