# Application message guidelines

Use `useNotification()` from `src/components/NotificationProvider.tsx` for action feedback. Call `notify(message)` for errors, or pass `success` or `info` as the second argument. Never notify during render.

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

Snackbars are fixed at the bottom and do not change card layout. They persist until dismissed, queue distinct messages, and deduplicate identical pending notifications. Errors use an assertive live region; success/info use a polite live region. Dismiss controls are keyboard accessible. Notifications survive normal route changes through the shared provider.

Keep actionable errors specific without exposing server internals. Preserve form values after failures. Do not replace essential form guidance or page content with a notification. Avoid duplicating the same action result inline and in a snackbar.

Navigation controls should remain stable while session state is restored. Orders is shown for authenticated users; Admin is shown only after admin access is confirmed (with `/admin` kept navigable during that state transition). Authentication actions belong in the header action area, not duplicated inside the primary navigation.

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

Cart additions immediately include pending quantities in the header count. Writes are serialized, duplicate additions for the same product are blocked while pending, successful responses establish the confirmed count, and failures remove only their pending increment. A final read reconciles the count; stale reads are ignored. Wishlist toggles publish immediately to shared local state, lock the affected product across cards, and roll back only that product on failure. Version checks prevent background reads overwriting newer changes; session resets invalidate late wishlist rollbacks. Button pending indicators remain until saving settles. Payments and order placement must still wait for server confirmation.
# Notification timing

Snackbars automatically dismiss after five seconds (`SNACKBAR_DURATION_MS`), with a manual Dismiss button available for immediate removal. A new notification starts its own timer, and duplicate messages are suppressed while the same notification is already queued.
