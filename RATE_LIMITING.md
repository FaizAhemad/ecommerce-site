# Request limits and deployment

Reviewed against current implementation on 2026-09-12. [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) owns completion; [PROJECT_STATUS.md](PROJECT_STATUS.md) records evidence. All 38 default automated tests pass. E11 records passing live PostgreSQL temporary-table checks and migrate deploy with three migrations/no pending work: the database already had the counter migration. Production-host/browser acceptance remains pending and no cleanup schedule was installed. Do not treat this document as a deployment confirmation.

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

E11 local SQL evidence: network-enabled test passes increments, saturation, isolated buckets, expiry and recovery without changing application records. Local Vercel startup/health/API routing passes in E12. These checks do not certify a different deployment database or real customer sign-in flow.

Latest environment caveat: after the passing checks, Vercel observed .env edits and DATABASE_URL was absent. The latest SQL retest returns P1012 and health returns 503. The local limiter returned 429 with Retry-After after ten validation-only login attempts before that change; expiry recovery is unverified because subsequent requests correctly fail closed with 503 RATE_LIMIT_UNAVAILABLE. Restore local configuration and rerun SQL/health/recovery; do not interpret the earlier passing result as current availability.

Current workflow: the owner now validates in production and has instructed Codex not to inspect .env or run live checks. Keep the rollout commands above as owner reference; do not run them automatically during backlog implementation. E13 does not change limiter policies or migrations. Database/host evidence from E11/E12 remains historical; further production acceptance awaits owner evidence.

E14 runs CSRF validation before rate-limit counters and handlers for unsafe browser requests. Valid requests retain existing quota policies and typed 429 handling. The private GET /api/auth/csrf bootstrap has no database access or rate-limit counter; it requires a non-simple header and source checks. The exact signed Razorpay webhook exception is unchanged. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for the new request contract.

E15 keeps quota policies, failure-closed 503s and 429/Retry-After behavior intact. The dispatcher supplies a UUID request ID used by limiter errors and X-Request-Id. Invalid caller ID text is replaced; raw headers and customer data are not logged. Unexpected errors escaping policy code are caught by the runtime dispatcher boundary without calling downstream handlers.

E16 uses existing auth-send and auth-verify quotas for forgot/reset and verification; CSRF and safe failure behavior remain. Token claims are now atomic. Existing IP limits do not complete per-recipient flooding protection or timing-enumeration resistance; those remain security acceptance/remediation work. No limiter migration or live check was performed.


E18 adds auth/email-verification-request POST: 5 per IP and 3 per authenticated account per 600 seconds under email-verification-send. Existing verification submission quota is unchanged. Central CSRF, private 429/Retry-After and fail-closed 503 behavior remain. No migration is added; owner validates existing counter storage and new quota on production.


E19 adds profile-write for profile/addresses mutations: 60/IP and 20/authenticated account per 60 seconds. GET reads remain outside this mutation quota. Existing CSRF, fail-closed counter handling and Retry-After behavior apply. No migration is added; owner production quota acceptance remains pending.


E22 /support writes use existing contact-coupon quotas (10/IP, 5/account per 600 seconds); /admin/support uses existing admin-write limits. CSRF applies. Support reads are session-owned/admin-guarded. New support table migration is separate from existing counter migration.


E23: checkout POST uses the existing commerce-write IP/account policy; admin checkout configuration uses admin-write. Read-only quotes are private but follow existing GET exclusions. No new limiter migration is introduced.


E24/E25 message submission and refund verification retain the admin-write IP/account policy and CSRF gate. Provider calls occur only after admin authorization; offline tests do not establish deployed rate-limit behavior.
