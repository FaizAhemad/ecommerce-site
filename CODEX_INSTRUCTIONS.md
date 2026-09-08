# Codex project instructions

Use `AGENTS.md` and `APPLICATION_BACKLOG.md` as the project instructions for Codex work. The backlog separates stabilization/security gates, product features, and UI fixes. Keep this file and the Copilot instructions aligned when the priorities or acceptance criteria change.

Use `PAGE_INVENTORY.md` as the route and page source of truth. Update it in the same change whenever a page, route, access rule, or page-level behavior is added, removed, renamed, or materially changed. Record verification evidence in `PROJECT_STATUS.md`.

Do not claim production readiness while a security-gate item is unverified. Keep customer data server-authorized and scoped to the requesting user, keep secrets in environment variables, and record test evidence and known blockers in `PROJECT_STATUS.md`.

When a backlog point is completed and verified, update its checkbox to `- [x]` in `APPLICATION_BACKLOG.md` and add the evidence to `PROJECT_STATUS.md`; leave incomplete points as `- [ ]`.
