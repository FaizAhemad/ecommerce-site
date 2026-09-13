# Password recovery

E16 implements email-based Forgot password and Reset password plus one-time verification-token claims. [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) is the only completion checklist; [PROJECT_STATUS.md](PROJECT_STATUS.md) records offline evidence and owner acceptance.

## Customer flow

Login links to /forgot-password. The form requests an email and displays the same neutral acknowledgment for known/unknown accounts; it never says an account exists or guarantees delivery. The customer follows the emailed link, enters and confirms a new password, and returns to normal login after success. Existing sessions for that account are revoked. Password fields support password managers, are disabled while pending and retain values on failure. The reset token is never stored in local/session storage or React Query.

Both routes reuse SiteLayout, PageContainer's form width, auth-card/form controls, shared colors/spacing and five-second snackbar conventions. They are available to signed-in and guest visitors. The current UI uses English copy; full localization and rendered Android Chrome/iOS Safari acceptance are pending. Recovery is email-based; accounts with only a mobile number still need the separate mobile recovery flow.

## API and token contract

| Endpoint | Contract |
| --- | --- |
| POST /api/auth/password-reset-request | `{ email }`; neutral 200 `{ accepted: true, requestId }` for valid/unknown accounts and internal/provider failures. CSRF, method errors and existing 429 limits still apply. No credentials or tokens returned. |
| POST /api/auth/password-reset | `{ token, password }`; password length 8-128, confirmation checked in the form. Success 200 `{ reset: true, requestId }`; invalid/expired/used token or lost serializable claim returns safe 400; store failure returns safe 503. |
| Existing email/mobile verification POSTs | Retain their success DTOs and use the shared transactional token claim. Their dedicated customer pages are not added by E16. |

The reset token is a cryptographically random 32-byte value encoded as hexadecimal, stored hashed and valid for one hour. Token replacement is transactional. Consumption checks purpose/expiry/unused state inside a Serializable transaction, conditionally claims exactly one row, applies the password/account change and revokes the reset owner's existing sessions. Other accounts remain unchanged. Failed changes roll back; writes are not automatically replayed. The reset response expires the current browser session cookie and successful UI navigation clears private in-memory state; other tabs receive an identity-free invalidation message and recheck /me.

New email links use a fragment (/reset-password#token=...), keeping the token out of the initial HTTP request. Old ?token= links remain supported. The page captures the token in memory and removes it from the address bar; refreshing the cleaned page requires reopening the email link. Global no-referrer metadata prevents outgoing Referer disclosure, including from legacy query links; historical incoming query URLs can still exist in platform access logs. Do not copy tokens, passwords, cookies or email addresses into diagnostics or screenshots.

## Configuration and owner acceptance

Existing APP_URL must be the intended application's HTTPS origin in production. Link construction ignores request Host/forwarded headers, rejects embedded credentials and uses /reset-password on that origin. Existing RESEND_API_KEY and RESEND_FROM_EMAIL supply the email transport. No new environment variable, migration, dependency or serverless function is introduced. Codex did not inspect .env or test provider configuration.

Owner acceptance should exercise: guest and signed-in recovery; known/unknown addresses; actual Resend delivery and fragment preservation by the email client; correct new password and rejected old password; revoked sessions on other devices; reused/expired/replaced links; wrong confirmation; duplicate clicks; slow/offline requests; missing-token recovery; and 320-430px Android/iOS keyboard and focus behavior. Use controlled synthetic accounts. Deploy the frontend and backend together so new links resolve to the new page.

Offline evidence is 108 passing tests, compilation and formatting, with three pre-existing lint warnings. It does not establish live database concurrency or email/browser behavior. Neutral bodies alone do not solve timing-based account discovery; synchronous provider delivery still differs between branches. Recipient-based throttling, durable retries, post-reset notification delivery, login/reset concurrency review and the broader account-security audit remain pending.

Design reference: [OWASP Forgot Password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). This implementation adopts neutral responses, hashed expiring tokens, one-time use, configured link origins and regular login after reset; it is not a claim that all recommendations or security gates are complete.
