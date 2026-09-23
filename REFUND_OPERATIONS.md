# Full-refund operations

E33 implements administrator-initiated full INR Razorpay refunds. Source and synthetic regression cases are present; tests, types/build, provider and mobile acceptance remain deferred. No new migration or environment variable is required.

Admin Payments requires an explicit full-amount approval and reason. The server checks admin authorization, central CSRF/rate limits, matching local totals and a provider-fetched captured payment with zero amount refunded. COD and partial refunds are excluded. Eligibility remains the administrator's business decision.

A unique private `refund-attempt.ORDER_ID` record captures actor, reason and financial binding before the external POST. Concurrent and later requests cannot issue another refund. The server sends the full amount, normal speed and a stable receipt. Network errors/rejections remain UNCONFIRMED conservatively. Never delete an attempt to retry; Generic Settings cannot expose or overwrite these records.

Creation is PENDING/FAILED, never completed financial status. Verify refund status independently checks the payment. Only matching full-refund proof updates payment/order atomically to REFUNDED. Known refund IDs also support pending/failed verification with identity, currency and amount checks. Unknown outcomes require provider investigation; matching full payment proof can still reconcile them. Bank settlement is not promised. No stock restoration or return approval is implied.

Reconciliation is admin-triggered; automatic scheduling/webhook refund processing and partial refunds remain separate. Confirmed failures require provider investigation instead of an unsafe reset/resubmit button. Payments lists the latest 100 records; older pagination remains follow-up scope.

Contracts: [Create refund](https://razorpay.com/docs/api/refunds/create-normal/) and [Fetch refund](https://razorpay.com/docs/api/refunds/fetch-with-id/).

Deferred checkpoint: `npm run test:refund-initiation`, existing regressions, types/build and owner provider/mobile acceptance. Cover duplicate tabs, timeout after acceptance, interrupted storage, failed/pending/processed states, wrong financial binding, prior partial refunds, CSRF/authorization and account changes. No real refund was issued during implementation.
