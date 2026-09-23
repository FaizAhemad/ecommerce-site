# Session expiry policy

Source implementation dated 2026-09-22; verification remains pending.

Customers: 30-minute inactivity and 24-hour absolute lifetime. Admins: 15-minute inactivity and 8-hour absolute lifetime. No Remember me. HttpOnly/SameSite=Lax cookies retain Secure in production. Every authenticated request checks database expiry and the creation-time cap. Existing 30-day sessions are rejected and require fresh login.

No migration: Session.expiresAt now holds the idle deadline capped by createdAt plus the role-specific lifetime. CSRF-protected POST /api/auth/session-activity conditionally renews only unexpired existing rows. It cannot recreate expired/deleted sessions. A dedicated rate bucket allows 120/IP and 30/account requests per minute. Background reads never renew sessions. Visible-page trusted pointer/keyboard/wheel/touch activity sends renewal at most once per minute. These signals are not proof of human identity; a stolen session can imitate activity, so the absolute cap remains mandatory.

The last-minute warning includes explicit continuation and appears inside open drawers. At expiry, a read-only probe checks whether another tab renewed the session. Expired identity triggers existing private-cache cancellation/removal. An unavailable probe past a known deadline also clears private UI. Browser deadlines use server remaining duration; tokens/customer data never enter localStorage. Already authorized in-flight operations may complete; never replay them automatically.

Existing password-confirmed phone updates and password-reset session revocation remain intact. Email replacement and fresh-password confirmation for financial operations are separate scope. Expired database-row cleanup remains operational follow-up, not an authorization requirement.

Policy tests are authored but unexecuted. Owner acceptance must cover old cookies, both roles, exact idle/absolute boundaries, background-only tabs, multi-tab activity, logout/reset races, offline failures and warning accessibility. No environment file, live provider/database or deployment was accessed. Reference: [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#session-expiration).
