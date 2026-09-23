# Order notification queue

Dispute extension (2026-09-23): DISPUTE_SUPPORT and DISPUTE_CUSTOMER jobs use an order/shop/version identity and commit with the conversation. Non-admin actions notify the server-only SUPPORT_EMAIL; seller/admin actions notify the verified order customer, excluding self-notifications. Staff config is read at sending and the first attempted recipient is frozen; recipient changes block retries. Missing configuration leaves jobs waiting. Immediate post-commit attempts and existing admin/worker processing apply. Emails contain a generic sign-in instruction, no conversation text, private support address in customer messages, or delivery address. Acceptance remains distinct from delivery. No new migration or scheduling setup was performed.


E32 is source implementation awaiting verification. New order-recorded, dispatched and delivered events create private versioned `order-email.*` StoreSetting jobs inside the business transaction. Immediate post-commit processing remains; no additional function or migration is introduced.

Compare-and-set claims and 90-second leases coordinate workers. Retries reuse frozen payloads and provider idempotency keys. Network errors, 409, 429 and 5xx can retry, bounded to five attempts and 23 hours from the first attempt. Resend documents 24-hour key retention: https://resend.com/changelog/idempotency-keys . Exhausted or uncertain outcomes require investigation. Legacy and UNCONFIRMED sends are never replayed automatically. ACCEPTED does not mean delivered.

Each attempt rechecks verified recipient ownership. Credential changes block attempted jobs; missing configuration leaves pending jobs waiting. Admin DTOs omit recipients, payloads and credential fingerprints.

Owner operations: `npm run notifications:process` processes a batch; append `-- --watch` for a separately managed persistent worker. Existing RESEND_API_KEY and RESEND_FROM_EMAIL are required. The script initializes environment before Prisma. The agent has not run it or inspected environment values. Vercel does not automatically schedule it. Admin Notifications provides a CSRF-protected processing POST for up to three jobs; the worker processes up to ten per batch. Each provider attempt has a five-second budget. Batches inspect the oldest 100 candidate records; high-volume pagination/monitoring remains necessary.

Pending: deferred regression/type/build checks, production/provider/device acceptance, worker hosting, delivery/bounce events, localization, retention and conversion of other email flows. This is not full notification-roadmap completion.
