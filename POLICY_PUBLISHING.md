# Policy publication

E29 supplies publication controls, not legal copy or legal approval. The owner must provide approved wording for Gadgify. Completion and evidence remain in APPLICATION_BACKLOG.md and PROJECT_STATUS.md.

Admin Policies supports privacy, returns, refund, terms, shipping, cancellation and cookies in English, Hindi and Marathi. Saving a draft is private. Publishing requires the saved draft, explicit approval confirmation and current version; stale writes fail without automatic replay. Publication writes an immutable version snapshot and actor/time audit entry in the same transaction. Later draft changes do not replace published text.

Existing StoreSetting keys store policy.kind.locale, policy-history.kind.locale.version and audit.UUID. No migration or environment variable is added. Generic settings excludes and rejects reserved policy/history/audit keys. The protected audit API reads the latest 100 publication events; other admin actions are not yet covered by this audit mechanism.

GET /api/policies returns only the selected published title, plain text, version and timestamp, or null. Drafts/actor fields remain private. Responses are no-store. React renders text without raw HTML; missing translations do not silently substitute another legal version. Public /privacy, /returns, /refund-policy, /terms, /shipping, /cancellation and /cookies show explicit missing content until text is published.

Checkout consent versions, cookie consent, rollback/unpublish, complete localization and legally approved content remain pending. Owner acceptance must verify content, draft privacy, stale editor conflicts, publication/history and mobile/keyboard behavior. No content was published and no live service was accessed by Codex. Further checks are deferred to the final verification phase at the owner's request.
