# CSRF protection

E14, implemented 2026-09-13. Completion is tracked only in [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md), with evidence in [PROJECT_STATUS.md](PROJECT_STATUS.md). Production acceptance belongs to the owner.

## Shared contract

All current browser API calls use `src/api/http.ts`. Before a same-origin API write, it obtains `GET /api/auth/csrf` with `X-CSRF-Bootstrap: 1`, credentials and no-store caching. The response is `{ csrfToken: string }`. The helper sends that value in `X-CSRF-Token` on the original request, retaining its body and headers. Reads do not bootstrap or send the token. External provider URLs never receive an automatically attached token.

The token is a domain-separated HMAC derived using the existing random HttpOnly session credential as its key. It does not reveal that credential and is not itself an authentication credential. Without a session cookie, bootstrap creates a random HttpOnly guest seed cookie: `__Host-gadgify_csrf` with Secure, Path=/ and SameSite=Lax in production, or `gadgify_csrf` for HTTP development. Guest bootstrap does not log in or create a database session. Authentication handlers continue to validate actual session existence, expiry and ownership; CSRF proof cannot grant access.

Tokens stay in memory, scoped to the client session generation. Concurrent actions in one tab share bootstrap while retaining independent cancellation. The helper clears tokens after successful auth writes or a 403; account-generation changes also force a fresh token. The bootstrap and action share the existing 30/60-second request budget. No mutation is automatically replayed. First write after refresh/session change adds a bootstrap request; subsequent writes reuse its token.

The sole Vercel dispatcher validates unsafe methods before rate limits and handlers. Missing/invalid proof returns private/no-store `403 CSRF_INVALID` with safe refresh guidance and a request ID. GET/HEAD/OPTIONS continue to handler method/auth checks. Current email verification is POST and is protected. Future GET handlers must not mutate customer state.

Fetch Metadata rejects cross-site and sibling-site bootstrap/writes. When Origin or Referer is present, it must match the request Host and expected scheme (HTTPS in production, HTTP in development). Forwarded-host and arbitrary preview-origin allowlists are not trusted. Missing source metadata still requires token proof on writes and a non-simple bootstrap header. Keep the API same-origin and do not enable credentialed cross-origin access to bootstrap. If a future reverse proxy changes Host, review its trusted-origin configuration before rollout.

Only exact `POST /api/webhooks/razorpay` bypasses browser CSRF validation. Its existing provider-signature checks remain mandatory. Browser payment creation/verification stays protected. This does not finish raw-body webhook verification, replay protection, refunds or provider reconciliation.

This follows the token/custom-header and defense-in-depth principles in the [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). CSRF does not replace XSS prevention, authorization or rate limits. No new environment variable, dependency, migration, CSP rule or Vercel function is introduced.

## Owner rollout and acceptance

Deploy frontend and server changes together. Already-open tabs running an old bundle cannot send the new header and will receive 403 on writes until refreshed. Do not bypass the guard to support stale bundles. Scripted cookie-authenticated API clients must bootstrap with a cookie jar and forward the token header; provider webhooks retain their separate contract.

| Production scenario | Expected result |
| --- | --- |
| Custom/preview host; login, refresh, logout and relogin | Bootstrap and writes succeed on the same origin; existing login/session restoration stays functional. |
| Guest signup/newsletter; admin product/category edits and uploads; review create/edit/media; cart/hearts | Existing handlers execute with valid proof; pending indicators and failed drafts remain. Use controlled synthetic records. |
| Missing/forged token, foreign origin or account switch | Writes rejected before mutation; stale UI reconciles through existing session behavior. Token errors do not imply logout. |
| Parallel actions, cancellation, slow/offline bootstrap | One bootstrap per tab, no duplicate write or lost failed draft; normal timeout/snackbar behavior. |
| Simultaneous first guest actions in different tabs | A competing first seed cookie can invalidate one token; rejected action may be explicitly retried with fresh proof. No automatic write replay. |
| Valid/invalid signed payment callback | Existing signature checks apply; invalid signature cannot change records. Live provider/raw-body acceptance remains separate. |
| Android Chrome and iOS Safari | Same-origin cookies/headers and action feedback work; owner records device evidence. |

Do not record cookies, tokens or customer payloads in evidence. No live checks, .env inspection, migrations or deployment were performed during this implementation, per the owner's workflow.

E15 supplements this contract with safe runtime dispatcher errors and correlated UUIDs. Bootstrap failures now include requestId; token generation, source checks, cookie flags, client lifecycle and signed-webhook exception are unchanged. Malformed API routes return structured 400 before guards/handlers; valid unsafe routes still require CSRF proof. Owner-reported E14 positive-path success remains separate from E15 production acceptance.
