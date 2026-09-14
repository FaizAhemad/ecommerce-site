# First-purchase feedback

E28 implements private experience feedback, separate from public product reviews. Completion and evidence remain in APPLICATION_BACKLOG.md and PROJECT_STATUS.md.

The first eligible order is the session owner's earliest order whose stored payment is CAPTURED or REFUNDED. This uses recorded payment history, not a new provider check; older manually changed financial records still require the E25 owner audit. There is no incentive, purchase minimum or invented reward rule. Feedback remains available until submitted, including after later purchases.

GET /api/feedback returns eligibility, first order number and the owner's existing response. POST accepts integer rating 1-5 and optional comment up to 2000 characters. User/order IDs are server-derived. A Serializable transaction and unique user key prevent multiple responses. Identical retries return the saved response; changed already-saved content returns 409. There is no automatic replay or customer edit/delete workflow yet.

Orders and paid Order Details show the form without a blocking modal. Missing-table or API failure has an independent retry state and cannot stop order reads/payment controls. Failed inputs are preserved; pending controls share a synchronous lock and unmount abort. Admin Feedback selects the latest 100 rating/comment/date/order-number responses without customer email/name/provider payloads. Public endpoints never return these responses. CSRF and feedback IP/account quotas apply to writes.

Migration `20260914010000_purchase_feedback` is prepared but NOT applied. It adds PurchaseFeedback with user/order constraints, rating/comment bounds and deletion cascades. Existing generated Prisma types are retained for offline work; parameterized SQL accesses the new table. Owner rollout must apply the migration before acceptance and verify real concurrency, isolation, eligibility, interrupted submission, account switching and mobile/keyboard states. No new environment variable is required. Retention/consent policy, editing, deeper admin history and complete localization remain pending.
