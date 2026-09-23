# Support requests

Dispute email update (2026-09-23) supersedes the earlier in-app-only note: order disputes now queue private-support and verified-customer notices with the conversation commit. Provider failures leave saved conversations intact; retry processing uses the existing queue. Direct inbound email forwarding remains external setup. Delivery is unverified.


2026-09-23 routing clarification: storefront.contact.supportEmail is the public label. Website forms notify server-only SUPPORT_EMAIL; the private recipient is not returned to the browser. RESEND_FROM_EMAIL remains the separately configured sender. Sending mail directly to the displayed address requires a real mailbox/alias with provider forwarding to the private inbox; the backend cannot receive arbitrary email without inbound integration. No forwarding or delivery was configured/verified here. Order disputes now live inside scoped fulfillment conversations with escalation/admin resolution; these do not send email automatically or change financial status.


## E30 attachment and conversation expansion

Private attachment and conversation source is present. Customers can add up to three JPEG/PNG images of at most 250 KB to their own open/in-progress ticket; ticket owners and admins can read them. Replies are owner/admin scoped, paginated, bounded and UUID protected. Apply migrations `20260920000000_support_attachments` and `20260920010000_support_replies` after the base support migration. Files are stored privately in PostgreSQL data URLs. Document types, malware scanning, retention/deletion rules, reply email notifications and production validation remain pending. There is no durable mail worker or automatic resend.

Apply prepared migration 20260914000000_support_tickets before validating support. Codex has not applied it. Configure SUPPORT_EMAIL only on the server with existing RESEND_API_KEY and RESEND_FROM_EMAIL. No support destination is published in frontend responses. Production build can regenerate Prisma normally; offline implementation uses parameterized queries against the new table without loading local environment.

Authenticated customers create requests at /support and track them at /support-requests. Admins use /admin/support. Reads are paginated and owner-scoped or admin-guarded. UUID creation keys suppress duplicate inserts and email sends; retrying an existing ID with different content is rejected. Keep the draft/ID after unknown outcomes and check history before starting another request.

SupportTicket stores subject/body/status/resolution and email acceptance state. OPEN requests may be cancelled by their owner with a reason. Admins may move open/in-progress requests to in-progress/resolved/cancelled with reasons required for terminal states. Conditional prior-status writes prevent simple stale updates; terminal tickets cannot be reopened here. UI routes are separate from the existing admin direct-message tab.

Owner notification goes only to SUPPORT_EMAIL. Customer receipt goes only to their stored verified email, without recipient values from the browser. Mail errors do not undo a saved ticket; UNCONFIRMED does not establish whether a timed-out send was delivered. Acceptance is not delivery. There is no durable mail worker, automatic resend, reply email or status-change email yet. E30 attachment and conversation limits are described above.

145 checkpoint tests pass across the suite. Owner must validate migration, real DB isolation/concurrency, provider delivery, status/cancel behavior, account switching and mobile keyboard/focus/error states. No live checks or deployment performed. APPLICATION_BACKLOG is the sole completion checklist.


E23 follow-up: destination and verified-customer notification requests are awaited concurrently. Both must be accepted for emailStatus ACCEPTED; failure remains UNCONFIRMED without undoing the saved ticket. This is not a durable delivery/retry queue.
