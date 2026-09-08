# Copilot instructions

Before editing this repository, read `AGENTS.md`, `APPLICATION_BACKLOG.md`, and `PROJECT_STATUS.md`. Treat the backlog as pending work unless the status document contains implementation and verification evidence.

Read `PAGE_INVENTORY.md` before changing routes or page-level behavior. Keep its route/component/access/status tables current in the same change, and update `PROJECT_STATUS.md` when implementation or verification status changes.

Security is a release gate: use server-side authorization, prevent customer-data leakage, validate and escape input, review browser/network exposure, handle sessions and storage deliberately, apply rate limits and request-abuse controls, address dependency vulnerabilities, use a two-minute API timeout, and require penetration testing before calling the application stable.

Follow the existing React/TypeScript, Prisma, API, and snackbar patterns. Preserve failed form values, avoid exposing secrets or internal errors, and update docs when behavior or verification status changes. Test the relevant build, lint, unit, API, and authenticated browser paths.

Maintain the backlog checklist: use `- [ ]` for pending points and `- [x]` only after implementation and verification, with evidence in `PROJECT_STATUS.md`.
