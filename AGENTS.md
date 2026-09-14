# Agent instructions

Use [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) as the single completion checklist and [PROJECT_STATUS.md](PROJECT_STATUS.md) for current implementation/evidence. Read both before product changes. Requirements describe intended behavior; a handler or page existing does not establish completion.

Read [PAGE_INVENTORY.md](PAGE_INVENTORY.md) before page/route work. Update it, status and affected API/notification/operational docs in the same change. Keep README, TARGET, REQUIREMENTS, Codex and Copilot instructions consistent when architecture or workflow changes.

Completion format is `- [ ]` for pending/partial/blocked/unverified work and `- [x] ✅` only for the stated verified scope, with evidence in PROJECT_STATUS.md. Do not keep competing checklists elsewhere. Never infer deployment, database migrations, provider success or production readiness from code/build output alone.

Security gates production readiness: authorization/customer isolation, cache/query scoping, XSS/CSP, upload safety, rate limiting/429, dependency/network review, session/storage/CSRF, penetration testing and request budgets. The implemented client/provider timeout is 30 seconds by default and 60 seconds for long-running operations. Do not restore the superseded two-minute timeout.

Preserve the single Vercel dispatcher at `api/[...route].ts`; implementation belongs under `server/api`. Apply the RateLimitBucket migration before deploying the limiter, and follow [RATE_LIMITING.md](RATE_LIMITING.md). Counter failure intentionally returns safe 503s. No active CSP is configured; any rollout must be verified without breaking Vite or required provider/media behavior.

Use existing server-side validation/auth, React Query and snackbar conventions. Snackbars auto-dismiss after five seconds; preserve failed inputs and optimistic rollback. Keep secrets server-only, avoid exposing private media/customer records, and verify relevant lint/types/build/tests plus authenticated API/browser behavior. Document unavailable environments and blocked live tests.

All roadmap requirements remain in scope: configurable commerce, profiles, policies/localization, payments/orders/refunds/returns, delivery, notifications/support, AI/tours/help/feedback, referrals/cashback/coupons/discounts, medicines subject to approval, SEO/offline and listed UI fixes. Do not invent legal, financial, eligibility or provider decisions.

The original `requirement.md` and `docs/history/` are historical context. Follow current user instructions, current requirements and verified status; do not apply superseded historical implementation claims.

## Security-first architecture and UI workflow

Code readability: use the pinned Prettier configuration and .editorconfig. Run npm run format after code edits and npm run format:check before handoff, alongside relevant lint/types/tests/build. Keep components, handlers and types readable; use focused modules and explicit API contracts instead of growing monolithic pages or adding loose any types. Do not suppress warnings/checks to get a pass. Keep mechanical formatting separate from functional refactors and record remaining structural work honestly.

Most customers use mobile: design and verify phones first, then adapt the same components for tablet/desktop. Follow the audit's 320–430px phone matrix, touch target, mobile navigation/filter, keyboard, safe-area, overlay and slow/offline-network requirements. Test every affected page/state and admin tab; record real Android Chrome/iOS Safari evidence or explicit device/tool blockers. Desktop-only checks do not complete responsiveness. Security remains the first gate.

Read [ARCHITECTURE_UI_UX_AUDIT.md](ARCHITECTURE_UI_UX_AUDIT.md) before cache/session, API interaction or layout work. It defines the shared design standard and source-backed remediation order; it is not another completion checklist.

Security comes first: establish verified identity, server-side record ownership, minimal response data, private cache scoping and safe failure handling before optimizing visible success. Never make payment/order/refund outcomes optimistic. Do not weaken authentication, validation, rate limits or CSP safeguards to hide UI failures. Preserve the single dispatcher and known Vite/Vercel compatibility constraints.

Use one SiteLayout and shared PageContainer width variants, spacing/color/type/layer tokens and reusable buttons, fields, skeletons, empty/error states and dialogs. Follow the audit's responsive spacing and contrast standard. Inspect final CSS specificity; replace conflicting rules instead of appending global overrides. Every affected route and admin tab needs loading, empty, error, success, keyboard and mobile verification.

For button/API work, define immediate pending feedback, synchronous duplicate guards, resource-level locking, cancellation, success reconciliation, failure rollback and preserved drafts. Share query keys/hooks between headers and pages. Do not swallow API errors into empty results or keep customer data in unscoped browser storage. Keep 30/60-second request budgets and five-second snackbars; timeouts can leave an unknown server outcome.

Skills: inspect the skills actually available in the current environment, read the relevant SKILL.md before using it, and announce its use. Use the browser skill for rendered UI, focus, responsive and interaction verification when available; use official primary documentation for security/library standards. Image generation is for requested/appropriate bitmap assets, not CSS layout fixes. Do not invent installed skills, install plugins by default, or claim browser verification when a tool is blocked. Document the limitation and continue source/tests within scope.

Before completing a change, verify relevant tests/lint/types/build and live checks proportional to risk. Use synthetic customer fixtures and redact credentials, cookies and personal records from evidence. Update the audit when a finding changes, PAGE_INVENTORY for page behavior, PROJECT_STATUS for evidence, APPLICATION_BACKLOG for verified completion, and affected API/notification docs. Keep Codex and Copilot instructions aligned; preserve historical documents.

Current foundation (E11/E12): reuse src/api/sessionScope.ts private keys and generation/abort guards, src/api/cart.ts shared cart coordination and PageContainer route width variants. Keep wishlist state in memory; never restore unscoped localStorage customer state. Include user ID and role in safe auth DTOs. Await logout success, discard older private results and preserve failed drafts. Vercel routes must preserve filesystem/Vite modules before extensionless SPA fallback and continue using the sole dispatcher. Run the 164-test suite, formatting, lint and build; record authenticated browser/device/production gaps separately. Load local environment before importing Prisma in standalone operational scripts. Playwright setup remains deferred by the user.

Current user workflow supersedes earlier live/local-check guidance: the owner pushes and validates on production. Do not inspect .env, run local/live API/database/provider checks, apply migrations or deploy as part of ongoing backlog work. Continue offline implementation and synchronize documentation; use npm test, formatting, lint and npm run build:offline (environment loading disabled; existing generated Prisma types required). Keep production acceptance pending until the owner supplies evidence. E13 order mutations use shared serializable transaction helpers, conditional stock/status writes and no automatic replay; keep customer isolation and late-payment terminal-state guards intact.

E14 CSRF: use apiFetch for all browser API calls; preserve central token bootstrap/validation and source checks. Keep tokens in generation-scoped memory and never automatically replay rejected writes. Only exact POST /api/webhooks/razorpay bypasses browser CSRF and still requires signature verification. Do not add credentialed cross-origin bootstrap access or state-changing GET handlers. Read [CSRF_PROTECTION.md](CSRF_PROTECTION.md) for rollout and owner acceptance. No new environment variable or migration is needed.

E15 errors: preserve the dispatcher runtime boundary, own-property route lookup and safe malformed-path handling. Use sendError and sanitized requestId for known failures, private/no-store errors and matching correlation. Do not expose or log raw exceptions/customer/provider payloads. Preserve success DTOs, 429 metadata, neutral reset responses, failed drafts and no automatic write replay. Newsletter clients accept structured errors and legacy strings during rollout; keep its duplicate guard and confirmed-success state. Platform initialization/transport failures and full localization remain separate work.

E16 recovery: use consumeVerification for atomic one-time token claims and account changes; keep reset/session revocation in the same transaction. Preserve neutral forgot-password responses, configured-origin links, fragment/legacy-query support, in-memory token handling, failed drafts and regular login after reset. Do not expose tokens or claim email delivery from accepted:true. Read PASSWORD_RECOVERY.md for remaining timing/abuse/provider/device limitations. No new migration or environment variable is required.


E17 newsletter: preserve exact 502 CONFIRMATION_EMAIL_FAILED reconciliation to saved/Subscribed with informational email-failure feedback. Other failures preserve drafts; never replay the write automatically. Diagnostic logs must contain only event, phase, optional status and sanitized requestId, never recipients or provider bodies. Production email delivery remains owner-verified.


E18 email verification: preserve authenticated recipient ownership, IP/account resend quotas, atomic token replacement/consumption, configured-origin fragment links and explicit confirmation clicks. Keep /me emailVerified and private email-status queries; existing login eligibility is unchanged. Future email changes must reset verification and invalidate outstanding tokens atomically. See EMAIL_VERIFICATION.md; owner production/device acceptance remains pending.


E19 Profile: /profile is common to signed-in customers/admins; store Settings stays separate. Preserve selected private DTOs, session-owned addresses, transactional default changes and order-linked address protection. Login phone changes require current password, clear phone verification and invalidate owner mobile tokens. Email stays read-only until verified replacement is implemented. Keep shared mutation locks, private profile query/abort guards and failed drafts. See PROFILE_MANAGEMENT.md; owner production/device acceptance remains pending.


E20 Orders: preserve private paginated customer history, minimal list DTOs and recorded payment/status semantics. Do not restore full provider/address records to the list. E21/E23 integrate Detail and configured Checkout; live acceptance remains pending. Keep owner production/device acceptance separate.


Current scope E21/E22: continue remaining functional backlog without per-item approval; synchronize docs/tests and retain pending business/provider/device gates. India/INR household Gadgify is current business; medicines and incentives/legal rules need approval. Support requires prepared SupportTicket migration and server-only SUPPORT_EMAIL, applied/configured by owner. Preserve UUID idempotency, parameterized owner queries, verified-recipient receipts and saved-versus-email semantics. Checkout now has configured E23 submission/payment controls; provider acceptance remains pending; visual polish follows functionality per owner.

E23 payments: follow CHECKOUT_PAYMENTS.md. Preserve explicit disabled-by-default charge configuration, server totals, owned India addresses, UUID checkout recovery and pending financial outcomes. Require provider-fetched capture matching, conditional payment writes, original webhook bytes and terminal-state guards. No automatic payment replay or invented charge/tax rules. Refunds and owner provider/device acceptance remain pending.

E24 messaging: preserve admin-only selected history, verified registered recipient, bounded escaped content, UUID sender/draft binding and save-before-send idempotency. ACCEPTED is provider acceptance, not delivery; UNCONFIRMED is not a durable queue. Owner delivery/device acceptance remains pending.

E25 refunds: manual REFUNDED order/return edits and legacy refund action are rejected. Only provider-backed full-refund reconciliation can update financial status. Verification does not issue a refund or prove bank settlement; preserve amount/identity checks and atomic writes. Legacy refunded records and real refund initiation remain owner acceptance/backlog work.
