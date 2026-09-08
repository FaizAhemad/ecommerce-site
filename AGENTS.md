# Agent instructions

Read `APPLICATION_BACKLOG.md` before making product changes. The backlog is the source of truth for the pending security, feature, and UI work requested by the product owner. Items in that document are pending unless `PROJECT_STATUS.md` records a completed implementation and verification result.

Read `PAGE_INVENTORY.md` before changing routes or page-level behavior. Whenever a page is added, removed, renamed, or materially changed, update `PAGE_INVENTORY.md` in the same change and record implementation or verification changes in `PROJECT_STATUS.md`.

Security work gates production readiness. Before calling the application stable, address API caching and client data-fetching strategy, dependency vulnerabilities, XSS, rate limiting and request abuse, penetration testing, customer-data isolation, network/API exposure review, session and storage handling, and the two-minute request timeout contract. Never expose customer records, secrets, internal errors, or private media to the browser unnecessarily.

For implementation work, preserve the existing API boundaries and snackbar conventions. Use server-side authorization and validation, keep failed form input, and document limitations when a provider or environment is unavailable. Verify changes with the relevant build, lint, tests, and authenticated browser/API checks; a build alone is not live verification.

The requested roadmap includes AI, route tours, complete profiles and password/address management, help and feedback flows, referrals, cashback, coupons, purchase discounts, medicines, support email through Resend, request tracking, payments, offline/online status, SEO, policy content, dynamic media, and the listed navigation/filter/loading fixes. Do not mark these complete until the corresponding acceptance criteria are implemented and tested.

Track completion in `APPLICATION_BACKLOG.md`: unfinished items remain `- [ ]`; completed and verified items become `- [x]`, with evidence added to `PROJECT_STATUS.md`.
