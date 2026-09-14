# Checkout and payment operations

Current offline scope is E23 in [PROJECT_STATUS.md](PROJECT_STATUS.md). Completion stays in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md); this document is the contract and owner acceptance guide.

## Configuration and calculation

Admin Settings edits the existing StoreSetting key `checkout`, containing `enabled`, `shippingMinor` and `taxBps`. No default delivery fee or tax rate is assumed. Missing/invalid/disabled rules or missing server Razorpay credentials leave customer checkout unavailable. No new payment environment variable or migration is introduced.

The owner must approve charges and policies before enabling checkout. The current model is India/INR only: one shipping charge per order, with tax rounded to the nearest paise on the item subtotal, excluding shipping. It does not implement product-specific GST, inclusive tax, regional shipping, discounts or legal/tax compliance. Do not enable it where those rules are required.

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
