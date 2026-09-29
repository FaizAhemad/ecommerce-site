# Checkout and payment operations

2026-09-28 UI scope: checkout uses responsive saved-address cards and a combined itemized order summary/quote panel. The customer sees that order recording happens first and Razorpay payment continues from the owned Order Details page. Unconfigured checkout is shown as unavailable without implying submission or payment; it displays the cart item subtotal only and clearly states that delivery/tax/discount and the final payable total are not yet available. Customers can add an India delivery address from checkout through the existing owner-scoped address API; the saved address is selected immediately. Cart/address/quote are frozen in memory after submission begins; address/coupon edits are disabled and explicit retry retains the original UUID and total. Background reads cannot replace that snapshot. Uncertain results show persistent guidance to check Orders; reload/navigation still loses the in-memory attempt, so do not start another checkout before checking Orders. Existing server recalculation, ownership, stock, coupon and capture checks remain authoritative. Payment action and result feedback remain tied to Razorpay and server confirmation. Offline implementation/build evidence only; charge approval, provider, mobile and production acceptance remain pending.

Marketplace gate, 2026-09-23: quote and order creation recheck approved ownership; only Gadgify products are financially enabled. External-shop carts cannot bypass this via legacy COD. Seller charge/commission/provider/refund decisions remain pending; no mixed-shop charges introduced. See MARKETPLACE_PURCHASING.md.


E33 supersedes older statements that refund initiation is unavailable: full-INR admin refunds and provider reconciliation are coded. See REFUND_OPERATIONS.md for duplicate protection and deferred verification. Partial refunds and scheduled reconciliation remain pending.

## E30 coupon integration

Checkout can accept one explicitly active coupon. The server revalidates dates, minimum subtotal, fixed/percentage amount, cap, global/customer usage limits and approved before/after-tax treatment inside order creation. The quoted total must match submission, and usage is recorded in the same serializable transaction as the order. A recorded order consumes a use even if payment remains unpaid, is cancelled or refunded; this rule and tax treatment require owner approval. Concurrency, payment-provider totals and production behavior are unverified.

Current offline scope is E23 in [PROJECT_STATUS.md](PROJECT_STATUS.md). Completion stays in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md); this document is the contract and owner acceptance guide.

## Configuration and calculation

Admin Settings edits the existing StoreSetting key `checkout`, containing `enabled` and optional `taxBps`; an omitted tax rate means 0%. Customer delivery is free at launch: checkout ignores legacy per-product shipping values and legacy flat order-level shipping settings. New/updated admin products store a zero legacy fee. Future regional delivery must be quoted server-side once per shipment from approved dispatch coverage and carrier rates; do not expose stale catalog shipping values as customer charges.

### Vercel and Razorpay setup

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as server-side Vercel environment variables for the same Razorpay mode. Do not put either secret in `VITE_*` variables, source control, browser storage or chat. The server returns only the public Key ID to the signed-in payment flow. `SESSION_SECRET` is not used by this application: sessions use random opaque tokens stored as hashes in the database, so that variable is not required for checkout.

Set `RAZORPAY_WEBHOOK_SECRET` to the separate secret configured for the Razorpay webhook. Configure the webhook URL as `https://<production-domain>/api/webhooks/razorpay` and subscribe to `payment.captured` and `payment.failed`. The app's handler verifies the signature over the original raw request body; confirm Vercel delivers that body unchanged before relying on webhook reconciliation. The browser return path also verifies payment with Razorpay server-side, but a webhook provides an independent payment status signal.

Start with Test Mode API keys. Run a successful and a failed test payment and verify the stored order/payment state before switching to Live Mode. Enable automatic capture in Razorpay because the application treats a payment as paid only after a provider-fetched `captured` status; it does not manually capture authorized payments. Razorpay recommends test transactions before go-live and fulfilling only after capture ([Razorpay integration and go-live guidance](https://razorpay.com/docs/server-integration/python/test-app/)).

After server variables are configured and required prepared migrations are applied, an administrator must explicitly enable checkout in Admin → Settings → Checkout. Tax remains optional and defaults to 0%; delivery is free at launch. No migration was applied and no Vercel variables, provider settings, financial values or production state were changed during offline implementation.

The current customer-facing model is India/INR with free delivery at launch and optional tax rounded to the nearest paise on the item subtotal. It does not implement regional delivery, product-specific GST, inclusive tax, discounts or legal/tax compliance. Regional delivery rates remain gated on approved dispatch location/coverage and carrier pricing; never infer a rate from stale per-product values.

GET /api/checkout returns availability and server-calculated subtotal, delivery, tax and total. POST accepts addressId, expectedTotalMinor and a UUID requestId, never prices or user identity. The transaction verifies the session owner's India address, reads configured charges and product prices, conditionally reserves stock, creates a pending Razorpay order record and consumes the cart atomically. A changed total rolls back. Repeating the UUID returns the same owned order; changed ownership/address is rejected. The client preserves the original request after uncertain results, blocks simultaneous clicks, and never automatically replays writes. Reloading starts a new attempt, so check Orders first after uncertainty. Legacy POST /api/orders retains its existing COD contract.

## Payment confirmation

Order Details offers Razorpay only for pending Razorpay orders with pending/failed payment. The checkout SDK loads on explicit payment action from its fixed official URL, with a 30-second loading budget. Provider-order initiation uses the existing 60-second long-operation budget. SDK opening is not payment success. Only a successful server capture verification triggers confirmed feedback.

Initiation reuses a stored provider order. Conditional persistence makes concurrent callers converge on the stored provider ID; a losing race can leave an unused upstream order, requiring real provider acceptance. Verification checks signature, session ownership and provider order binding, fetches the payment server-side, and requires matching payment ID, order ID, amount, currency and captured status. Database capture is transactional, cannot overwrite a refund or another bound payment, and only changes a pending order to confirmed. A late capture must not reopen a cancelled/refunded order; any money requiring refund still needs reconciliation.

The sole dispatcher obtains the original webhook body before signature verification, limits it to 256 KiB and rejects parsed-object-only payloads rather than signing a JSON reserialization. Vercel raw-stream delivery is unverified. Capture events check amount/currency/status and use the same conditional transaction; failed events cannot overwrite captured/refunded payments. Processing failures return retryable 503s. This is not a durable webhook event ledger or a complete refund system.

Provider contract reference: [Razorpay Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/) and [fetch a payment](https://razorpay.com/docs/api/payments/fetch-with-id/).

## Owner acceptance still required

Verify approved charges, stock contention, changed cart/address, lost responses, same-UUID retries, SDK loading/closing, authorization versus capture, failed payment, duplicate and out-of-order signed webhooks, raw-body delivery through Vercel, cancelled-order late capture, account switching and Android/iOS checkout. Use controlled provider test transactions before enabling live payments. No provider call, deployment, live database check or device test is established by synthetic tests.

Remaining functional work includes refund initiation, durable event/reconciliation jobs, abandoned-order inventory release, approved cancellation/return eligibility, product/regional taxes and delivery rules, receipts and full localization.

## E25 refund verification

Admin Payments uses PATCH /api/admin/payments with action `reconcile-refund` and orderId. It only verifies a previously processed provider refund; it does not initiate one. The former action `refund` is rejected. A server payment fetch must match the stored provider/order/payment IDs, full amount and currency, `status: refunded`, `refund_status: full` and the entire amount_refunded. Conditional transactional payment/order updates follow that evidence without restocking. Partial/unconfirmed/mismatched proof leaves records unchanged. Manual REFUNDED edits through Orders/Returns are rejected.

The owner must review legacy REFUNDED records created by the former database-only action. They are not certified by this change, and records without provider IDs require separate investigation. Full provider status is distinct from bank settlement. Refund initiation, approved eligibility, partial refunds, return linkage and durable audit/reconciliation remain pending. Contract: [Razorpay payment and refund status fields](https://razorpay.com/docs/api/payments/fetch-with-id/).
