# Codex project instructions

Use [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) as the single completion checklist and [PROJECT_STATUS.md](PROJECT_STATUS.md) for current implementation/evidence. Read both before product changes. Requirements describe intended behavior; a handler or page existing does not establish completion.

Read [PAGE_INVENTORY.md](PAGE_INVENTORY.md) before page/route work. Update it, status and affected API/notification/operational docs in the same change. Keep README, TARGET, REQUIREMENTS, Codex and Copilot instructions consistent when architecture or workflow changes.

Completion format is `- [ ]` for pending/partial/blocked/unverified work and `- [x] ✅` only for the stated verified scope, with evidence in PROJECT_STATUS.md. Do not keep competing checklists elsewhere. Never infer deployment, database migrations, provider success or production readiness from code/build output alone.

Security gates production readiness: authorization/customer isolation, cache/query scoping, XSS/CSP, upload safety, rate limiting/429, dependency/network review, session/storage/CSRF, penetration testing and request budgets. The implemented client/provider timeout is 30 seconds by default and 60 seconds for long-running operations. Do not restore the superseded two-minute timeout.

Preserve the single Vercel dispatcher at `api/[...route].ts`; implementation belongs under `server/api`. Apply the RateLimitBucket migration before deploying the limiter, and follow [RATE_LIMITING.md](RATE_LIMITING.md). Counter failure intentionally returns safe 503s. No active CSP is configured; any rollout must be verified without breaking Vite or required provider/media behavior.

Use existing server-side validation/auth, React Query and snackbar conventions. Snackbars auto-dismiss after five seconds; preserve failed inputs and optimistic rollback. Keep secrets server-only, avoid exposing private media/customer records, and verify relevant lint/types/build/tests plus authenticated API/browser behavior. Document unavailable environments and blocked live tests.

All roadmap requirements remain in scope: configurable commerce, profiles, policies/localization, payments/orders/refunds/returns, delivery, notifications/support, AI/tours/help/feedback, referrals/cashback/coupons/discounts, medicines subject to approval, SEO/offline and listed UI fixes. Do not invent legal, financial, eligibility or provider decisions.

The original `requirement.md` and `docs/history/` are historical context. Follow current user instructions, current requirements and verified status; do not apply superseded historical implementation claims.
