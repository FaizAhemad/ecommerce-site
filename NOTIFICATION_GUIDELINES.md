# Application message guidelines

Use `useNotification()` from `src/components/NotificationProvider.tsx` for action feedback. Call `notify(messageOrError)` for errors, or pass `success` or `info` as the second argument. Passing an `ApiRateLimitError` preserves translated retry guidance. Never notify during render.

| Situation | Presentation | Examples |
| --- | --- | --- |
| Action failed | Error snackbar | Cart/wishlist updates, authentication, subscription, review upload, admin save, tracking connection failure |
| Action completed and needs confirmation | Success snackbar | Authentication, newsletter subscription, review submission, admin save |
| Existing UI already confirms success | Update that UI only | Cart count, wishlist heart; no extra success message |
| Request pending | Disabled control and loading label | Adding, saving, uploading; never announce success before the API responds |
| Field needs correction | Inline validation beside the field | Required order number, invalid email, unknown order number |
| Page cannot load or resource is missing | Persistent page/section state with recovery action | Storefront failure, cart load failure, product not found |
| Empty content or durable information | Inline content | Empty cart, no results, policy notices, tracking history, selected files, upload instructions |
| Feature is unavailable | Persistent explanation; informational snackbar if attempted | Checkout integration placeholder; never claim payment or order success |

Snackbars are fixed at the bottom and do not change card layout. They auto-dismiss after five seconds, allow manual dismissal, queue distinct messages, and deduplicate identical pending notifications. Errors use an assertive live region; success/info use a polite live region. Dismiss controls are keyboard accessible. Notifications survive normal route changes through the shared provider.

Keep actionable errors specific without exposing server internals. Preserve form values after failures. Do not replace essential form guidance or page content with a notification. Avoid duplicating the same action result inline and in a snackbar.

Navigation controls should remain stable while session state is restored. Orders is shown for authenticated users. The Admin link requires verified ADMIN role; responsive/live acceptance remains tracked. Page and API authorization remain separate. Authentication actions belong in the header action area, not duplicated inside the primary navigation.

Reviewed against the current workspace on 2026-09-12. [PROJECT_STATUS.md](PROJECT_STATUS.md) records evidence; [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) owns completion. These conventions are not a claim that every page has passed live verification.

## Current coverage

Cart add/update and wishlist failures; authentication outcomes; newsletter outcomes; review submission and skipped-file notices; admin product save/update and duplicate-file notices; tracking request failures; checkout unavailability. Tracking field validation, admin selected filenames, page load errors, and empty states intentionally remain inline.

## Verification checklist

- Cart additions and wishlist toggles update the count/heart immediately without a message below the card; failed saves roll back the affected optimistic change.
- Failed actions show a snackbar and restore the affected optimistic state. Network timeouts are ambiguous; prompt users to check saved state before retrying, rather than automatically retrying non-idempotent cart additions.
- Pending buttons block duplicate submissions.
- Notifications remain readable on mobile, can be dismissed by keyboard, and queue without overwriting earlier feedback.
- Page errors still provide recovery actions; field errors remain associated with their inputs.
- Verify against a running API, including stopped-server, unauthorized, and server-error scenarios; a production build alone does not establish live behavior.

## Optimistic cart and wishlist updates

Use the consolidated [action-state contract](ARCHITECTURE_UI_UX_AUDIT.md). E11 shares cart/header state and updates affected quantities/counts/estimated totals optimistically, with per-product locks, affected-row rollback and final reconciliation. Unrelated cart rows remain usable; checkout is unavailable while cart changes are unresolved. Duplicate submissions are guarded synchronously. Wishlist hearts stay in memory, with version/epoch protection against stale reads and rollbacks.

Tracking now shows pending feedback and explicitly handles failed lookups. Admin reads display loading/error/retry; sequential uploads report file/stage progress and reuse completed uploads on retry. Login/signup/logout show guarded pending states; logout changes session only after server confirmation and shows a retry snackbar on failure. Failed form inputs remain. Session-probe failures use persistent retry UI rather than reporting a confirmed logout.

Snackbars survive ordinary route changes; account/session-generation changes remount the notification/route subtree so messages and copied private state from the prior account do not carry across. Payments/orders/refunds must still await authoritative server/provider outcomes. Live mobile/keyboard/error acceptance remains pending.

# Notification timing

Mobile acceptance: snackbar text and Dismiss must remain readable/reachable at 320–430px, with safe-area insets, software keyboard and any sticky action bar. Reserve space or reposition overlays so notifications do not cover payment/form controls. Keep five-second dismissal and persistent page/field recovery where the user still needs information after the snackbar closes. Verify touch and screen reader behavior.

Snackbars automatically dismiss after five seconds (`SNACKBAR_DURATION_MS`), with a manual Dismiss button available for immediate removal. A new notification starts its own timer, and duplicate messages are suppressed while the same notification is already queued.

## Rate-limit and current limitations

Use the shared typed 429 error through `apiFetch` and pass it to `notify` so English/Hindi/Marathi retry guidance is retained. Do not automatically retry limited writes; query defaults skip retries for this error. The five-second snackbar lifetime does not change the server retry interval. See [RATE_LIMITING.md](RATE_LIMITING.md).

These are target conventions as well as current components. E11 fixes tracking error handling, admin load states and catalog failures. Provider/email outcomes, remaining admin operations and full rendered regression coverage remain in the backlog. Support currently uses mailto/tel and has no snackbar-backed submission. Do not report these flows fully verified until tested.

E13 commerce conflicts: order/cart serialization conflicts return 409 with refresh guidance, never optimistic purchase success or automatic write replay. Admin status selectors retain confirmed values after errors and reconcile only after a successful response. Repeated cancellation of an already-cancelled order does not restore stock again. Payment capture acknowledgement must not imply cancellation was reversed or funds refunded. The product owner validates these behaviors in production.

E14 CSRF failures return 403 CSRF_INVALID with refresh guidance. Bootstrap failures use a safe preparation error; no mutation is sent. Existing page error/snackbar handling and five-second dismissal remain, including generic action-specific text where pages already use it. A 403 does not expire the session; the next explicit attempt fetches fresh proof. Preserve failed drafts and rollback optimistic cart/hearts. Never automatically replay a failed/ambiguous write. Old deployed tabs require refresh; production notification acceptance belongs to the owner. See [CSRF_PROTECTION.md](CSRF_PROTECTION.md).

E15: newsletter errors now carry code/message/requestId; the client accepts the previous string contract during rollout. A saved subscription whose confirmation fails is explicitly reported as saved, and failed inputs are retained. Unexpected server failures return safe current-status/check-before-retry guidance; do not imply rollback or automatically replay writes. Success remains a five-second snackbar and no longer asks customers to configure the sender. Unconfirmed/malformed responses cannot produce success feedback. Full English/Hindi/Marathi error localization remains pending.

E16 account recovery uses the same five-second snackbar for request acknowledgment, validation and API errors. Persistent page guidance explains inbox/spam and missing-link recovery. The forgot-password response is neutral and must not claim that an email was delivered. Successful reset clears drafts and navigates to normal login with password-reset guidance; no automatic login occurs. Failed passwords stay in memory on the mounted form; they are never logged/stored. A timed-out mutation may already have committed; do not replay it automatically. Post-reset notification email and durable delivery retries remain pending.


E17 supersedes the E15 failed-draft behavior specifically for 502 CONFIRMATION_EMAIL_FAILED: persistence is already confirmed, so show Subscribed, clear the completed input and notify with info: "You are subscribed, but we could not confirm the email was sent. No need to subscribe again." Other errors preserve failed drafts. Keep five-second dismissal; the Subscribed button remains visible after the notice closes. Email delivery and durable retry handling remain unverified/pending.


E18: verification/resend use five-second snackbars plus persistent page results/errors. Resend acceptance means the provider accepted sending, not delivery. Explicit confirmation changes verified state only after server success. Never replay writes, store/log tokens or imply an email-less account is verified. Signup mail failure can be recovered through Account email after sign-in.


E19 Profile: all writes share a synchronous lock and immediate pending feedback. Confirmed saves notify through the five-second snackbar; failures have persistent inline guidance and retain drafts. Delete requires inline confirmation. Do not automatically replay ambiguous/timed-out writes; a refresh may reveal that the server already saved. Email changes and mobile-code notifications remain separate.


E20 Orders reads use persistent loading/error/retry and load-more feedback; failed reads never become empty history or payment success. Existing rows remain on pagination failure. Retry/load-more use non-cancelling fetch options to join active requests. No financial mutation changed.


E21 adds browser offline status and five-second online notice without queued writes. E22 ticket creation reports saved reference even when email is unconfirmed; only verified stored customer email receives a receipt. Failed drafts retain their UUID for explicit retry, preventing duplicate mail. Status errors remain inline; provider acceptance is not delivery. Status-change email/attachments/threading remain pending.


E23: order creation reports payment pending; only verified server capture reports payment confirmed. SDK failure/dismissal/uncertainty requests order refresh. No automatic payment replay. Support destination/verified-customer receipts run concurrently with settled results; saved ticket and email acceptance remain distinct.


E24 admin transactional messages distinguish saved UNCONFIRMED from provider ACCEPTED. UUID retries do not resend, and altered saved drafts are rejected. Only existing verified customer addresses are supported. No durable retry queue or inbox-delivery events are implemented; do not display delivered/queued promises.


E25 refund reconciliation success says Provider full refund verified. It must never say a refund was issued by this action or settled in a bank. Partial/unconfirmed proof is an error without status mutation; legacy manual-refund records need owner audit.
