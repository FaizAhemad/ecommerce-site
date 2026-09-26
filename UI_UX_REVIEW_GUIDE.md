# Application-wide UI/UX instructions

Owner direction, 2026-09-25: review the whole Gadgify application, not isolated successful page states. See [LUNA_ANALYSIS.md](LUNA_ANALYSIS.md) for the design analysis and [ASTRA_CHANGES.md](ASTRA_CHANGES.md) for the implementation handoff. This is the review procedure, not a second completion checklist. APPLICATION_BACKLOG.md remains the sole checklist; PAGE_INVENTORY.md defines coverage; PROJECT_STATUS.md records evidence. ARCHITECTURE_UI_UX_AUDIT.md owns the design standard.


## Complete component coverage (owner clarification, 2026-09-25)

Every user-visible component and state is in scope, not only pages or the startup loader. Begin with shared design tokens/layout/primitives, then build startup and other states from that foundation. This supersedes the earlier suggestion to style the loader in isolation. Review each component; change it when evidence shows inconsistency, rather than rewriting working components unnecessarily.

Build a component-to-consumer inventory from src/components, page-local markup, feature styles, App and layout code. Record component/style owner, variants, consuming routes/admin tabs, states, accessibility concerns and evidence references in PAGE_INVENTORY.md. Include inline controls without a dedicated component file. Tie findings to UI-01 through UI-09 in APPLICATION_BACKLOG.md; this inventory is coverage data, not another completion checklist.

| Component family | Required coverage |
| --- | --- |
| Layout and navigation | SiteLayout, PageContainer, header, footer, mobile menus, tabs, breadcrumbs/back links, pagination, sticky/floating controls and social links |
| Typography and surfaces | Headings, paragraphs, labels, helper text, links, prices, totals, dividers, cards, panels, tables, badges and status indicators |
| Actions and inputs | Primary/secondary/destructive/icon buttons, text/password/search inputs, textarea, selects, radios, checkboxes, quantity controls, filters, coupon and upload controls |
| Media and commerce | Product images/video, galleries, previews, broken/missing media, ratings/reviews, cart rows, order summaries, address cards and payment actions |
| Loading and feedback | Startup/session loader, route/section skeletons, button pending states, progress, empty/unavailable/error states, offline notices and retry controls |
| Notifications | Snackbars/toasts, inline validation, success/error/info alerts, session warnings, notification history and saved-versus-delivered messages |
| Overlays | Dialogs/drawers, backdrops, confirmation prompts, menus, tooltips where present, help/tour overlays and interaction with provider payment windows |
| Feature records | Account/profile, support conversations/attachments, seller/moderation/inspection records, admin dashboards/settings/tables and all embedded editors |

For every applicable component inspect default, hover, focus, active/selected, disabled, loading, invalid, error, empty and success states. Review short/long text, wrapping, phone/tablet/desktop, text zoom, keyboard and screen-reader semantics. Explicitly record non-applicable variants and why. Inventory variants first; avoid forcing unrelated product/record cards into one inflexible component.

Notifications require consistent color, icon/text meaning, typography, spacing, max width, placement and dismissal controls. Preserve the five-second snackbar duration and deduplication/queue behavior. Critical validation and uncertain order/payment outcomes also remain visible inline. Announce messages with appropriate status/alert semantics without duplicate announcements or stealing focus. Inspect notification placement inside FormDialog's top layer, safe-area/keyboard overlap, long text, stacked messages, offline state and whether feedback obscures primary actions. Never expose raw exceptions or private/provider payloads.

Overlay review includes backdrop opacity, layer order, scroll locking, inert background, focus trap/restoration, Escape/close behavior and pending-action dismissal protection. A snackbar behind a drawer, an inaccessible dismiss button or hidden mobile content is a functional defect, not decorative polish.

Shared foundations use the existing Ink/Citron brand, semantic color roles, contrast-checked combinations, tokenized spacing/type/radius/layers, shared width variants and consistent control sizing. Use the shared system sans family across body, display, Tailwind and legacy styles; preserve hierarchy through deliberate size, weight and spacing rather than unrelated font families. Proposed gutters are 16px phone, 24px tablet and 32px desktop, reconciled centrally with existing PageContainer rules rather than added as page overrides. Reuse or deliberately extend shared primitives before changing consumers. Record remaining exceptions and migrate them in bounded batches.

Application-wide completion requires both route/state coverage and component/consumer coverage, including admin/seller-only and infrequently shown feedback. Source review, owner screenshots, browser evidence and real-device evidence remain separate; current verification/live-operation deferrals are unchanged.

## Review order

1. App startup, session loading/error, SiteLayout, header, mobile navigation, footer, overlays and notifications. Fix shared causes before repeating page-level changes.
2. Customer purchase journey: home, catalog/search/filters, product/media/reviews, cart, checkout, payment, orders, detail, tracking and returns.
3. Account journey: guest/authenticated navigation, login/signup, recovery, verification, profile/addresses, expiry and logout.
4. Support and information: help/tour, tickets/replies/attachments, feedback and every published/unpublished policy route.
5. Marketplace: shop directory/showcase, onboarding, seller products/media/orders, moderation, fulfillment, inspection and disputes, including pending/rejected/suspended access.
6. Administration: every tab and standalone admin route, not just the dashboard. Include analytics, products/categories, orders, payments/refunds, returns, customers, messages, feedback, settings, coupons, shipments, notifications and seller/support workflows. Reconcile the list against current router and tabs before each review.
7. Repeat cross-page journeys after shared changes; include refresh, direct links, back/forward, unknown routes and access denied.

## Loading and session standard

The supplied screenshot shows a full-screen spinner and technical session message with excessive empty space. Source confirms App.tsx returns a standalone app-loading screen before SiteLayout. This is a reported/source-confirmed finding, not a browser measurement.

Use a shared branded startup treatment with a modest Gadgify identity, readable status and restrained layout skeleton. Never show fabricated products, prices, reviews or private cached records. Reserve space for navigation and content to reduce layout shift. Reuse existing brand assets; do not invent a new logo.

Separate first startup, route loading, section refetch and button submission. A background refetch must not replace the whole page. Keep safe public context visible when architecture permits; session-dependent controls use neutral placeholders and protected content waits for verified identity. Never flash login while identity is still unknown, or display an old account's content.

Skeletons resemble the upcoming layout, are decorative/aria-hidden, and have a single polite status announcement. Respect reduced motion. Use no fake percentage or timed success. Slow requests need honest waiting text and a real error/retry state when the existing request budget expires (30 seconds, 60 for designated long operations). Do not add timers that duplicate requests or automatically replay writes. Errors remain distinguishable from signed-out and empty states.

## Shared component rules

Reuse SiteLayout, PageContainer width variants, FormDialog, NotificationProvider, OrderTotals and existing domain hooks/styles where applicable. First inspect available components; extend an existing component or extract a genuinely repeated pattern instead of copying markup. Shared controls must preserve native semantics, labels, keyboard behavior and disabled/pending state.

Keep primary auth/checkout flows as pages; contextual editors use FormDialog. Preserve modal focus restoration, inert background, scroll lock, safe areas and pending dismissal guards. Keep form drafts after errors. Five-second snackbars supplement persistent inline validation and uncertain payment/order outcomes.

Use the existing Ink/Citron palette and spacing/type/radius/layer tokens. Feature CSS belongs with its owner; remove conflicting rules at their source rather than appending global overrides. No per-page redesign of navigation, buttons, fields, loaders or empty/error messages. User-facing screens omit debugging/provider implementation details unless needed for a decision.

## Coverage for every route and admin tab

For each inventory entry inspect normal content, initial loading, slow response, background refresh, empty data, validation errors, network/server errors, retry, pending mutation and confirmed outcome. Include unavailable/forbidden states where relevant. Mark non-applicable cases explicitly with a reason; never count them as tested.

Check text hierarchy, container width, vertical rhythm, colors/contrast, long text, image failure, button priority, field labels, focus visibility, tab order, dialog scrolling, keyboard dismissal, touch targets and accidental horizontal scrolling. Include enlarged text and 200% zoom. Controls should have at least 44px touch areas. Use the audit's contrast standards and avoid color-only status.

Use phone widths 320, 360, 390 and 430px, tablet 768px and desktop 1280/1440px. At each phone width inspect navigation, sticky elements, address/cards, tables, drawers, safe-area padding and software-keyboard obstruction. Viewport emulation is not evidence of real Android Chrome or iOS Safari behavior; record device gaps separately.

Exercise duplicate clicks, failed draft preservation, account switching and session expiry. Payment/refund success requires server confirmation; do not make it optimistic. A UI review must preserve authentication, ownership, CSRF, rate limits, cache scoping and request budgets.

## How browser review is performed

Before browsing, reconcile PAGE_INVENTORY.md against src/router.tsx, App.tsx and AdminPage tabs, including standalone seller/admin routes. Create one evidence row per route/tab/state/viewport in PROJECT_STATUS.md (or an evidence artifact linked from it). Review complete journeys as well as individual screens.

When browser verification is authorized, read and announce the available computer-use skill, open the approved environment, inspect rendered UI and keyboard behavior, capture before/after evidence, and record console/network symptoms without credentials or customer data. Use synthetic accounts/records. Read-only inspection does not authorize placing orders, sending messages, changing stock or triggering real charges/refunds. Provider testing requires the approved test environment and explicit relevant authorization.

Current owner restrictions remain: no .env inspection, starting local services, live API/database/provider checks, migrations or deployment; test/lint/format/build execution remains deferred. No browser session or production navigation was performed for this instruction update. Until rendered verification is authorized/available, perform source review and record owner screenshots as supplied evidence, with missing states/viewports marked unverified. Do not quietly treat source inspection as browser acceptance.

## Evidence and completion

Each finding records: route/tab, user role, state, viewport/device, observed issue, shared root cause, changed component, evidence reference/date/revision and remaining verification. Evidence labels are source-reviewed, owner-screenshot, browser-observed or real-device-observed. They are not interchangeable.

A shared-component fix must be followed by a consumer inventory and checks of affected routes, including loading/errors/overlays. Do not declare a page complete from its default desktop view. UI backlog entries remain pending until their stated coverage is evidenced. Communicate the current review batch and its gaps, rather than saying the entire UI is done after a single page change.

Immediate starting point: UI-01/UI-02 component/style inventory and shared visual foundations, followed by UI-09 startup/loading/empty/error/notification primitives and their consumers. The screenshot's loader has not been redesigned by this documentation change.

## Visual and language direction for the 10-15 day launch window

Owner target: publish in approximately 10-15 days (stated 2026-09-25). This is a planning target, not evidence of readiness. Prioritize launch-critical paths and do not enable unresolved marketplace finances to meet the date.

Color: keep the existing light Ink/Citron identity; assign consistent semantic roles to page/surface/text/border/primary/error/success colors. Use citron as an accent with contrast-appropriate dark text, not low-contrast body copy. Confirm actual foreground/background combinations, focus indicators and disabled controls. Avoid unrelated colors per feature.

Spacing: use the shared token scale (4/8/12/16/24/32/48px where compatible with the audit), one PageContainer width system and consistent section/card/field gaps. Phone gutters should remain consistent, with no oversized blank startup regions or cramped edge-aligned controls. Inspect long content and real wrapping before declaring alignment fixed.

Typography: reuse the established display/body families rather than adding fonts. Use display typography for headings and readable body/control typography for instructions, fields and status. Target 16px body/input text, comfortable line height around 1.5, a clear heading hierarchy and limited readable line lengths. Avoid tiny uppercase paragraphs and arbitrary font sizes across pages. Scale headings on phones; preserve text zoom and font loading fallbacks.

Wording: use plain customer language, sentence case, specific action labels and concise next steps. Prefer 'Loading your store' to exposing session/API mechanics during normal startup. Errors explain what happened and what the customer can do, preserve entered data, and never promise an uncertain outcome. Distinguish 'Order placed, payment pending', 'Payment confirmed' and email provider acceptance. Remove placeholder copy, question-mark separators and unsupported delivery/refund promises. Keep terms consistent across cart, checkout, orders and support. Full localization remains separately tracked; do not mix partially translated controls silently.

Suggested delivery sequence: days 1-3 shared visual/loading foundations and reusable states; days 4-7 customer shopping/checkout/payment/account/support journeys; days 8-10 admin/seller consistency and cross-page regressions; remaining days reserved for authorized tests, provider test-mode acceptance, real phone review and launch-blocking fixes. Adjust to actual findings. Do not use the entire window adding features and leave verification to launch day.

Release priorities: blocked purchase/login, hidden mobile content, misleading financial status, inaccessible controls and private-data/session issues block release. Inconsistent hierarchy, spacing, contrast and wording are addressed across shared consumers next. Decorative polish follows. If verification remains deferred or mandatory business/provider gates unresolved, keep the affected scope unreleased and state the limitation explicitly.

## Automated UI and validation testing strategy

Documented at the owner's request, 2026-09-25. Playwright and axe are planned, not installed or executed. Existing Node.js tests remain in place. This documentation request does not lift the prior installation/execution/live-operation deferrals.

| Tool | Scope | Adoption |
| --- | --- | --- |
| Playwright Test | Browser journeys, form validation, pending/duplicate actions, route states, responsive behavior and screenshot comparisons | Primary planned UI framework |
| @axe-core/playwright | Automated accessibility findings including labels, semantic issues and supported contrast checks | Planned alongside Playwright |
| Existing Node.js test runner | Server validation, identity/ownership, sessions, CSRF, totals, stock and financial invariants | Preserve existing suites; execution remains deferred |
| Vitest | Focused isolated React component coverage if browser journeys and existing unit tests leave a meaningful gap | Optional later; no migration required |

First coverage follows the full route/tab inventory: startup and session restoration; login/recovery/validation; catalog/product/cart; checkout and owned order/payment state; profile/address forms; support; seller/admin authorization and critical actions. Every applicable page includes loading/slow/empty/error/normal states, retained drafts, retries and duplicate clicks. Test visible behavior and accessible roles/labels, not internal component state or arbitrary sleep durations.

Run viewport coverage at 320/360/390/430px, 768px and 1280/1440px. Plan Chromium, Firefox and WebKit browser coverage, prioritizing critical journeys before expanding every combination. Emulated phones and WebKit are not substitutes for actual Android Chrome/iOS Safari acceptance. Manual review remains necessary for visual quality, wording, keyboard use and accessibility issues outside axe coverage.

Screenshot baselines must be approved from reviewed screens, not generated from the current flawed UI and accepted automatically. Stabilize fonts, animations and synthetic data; mask personal data. Review screenshot differences before changing baselines. Shared component changes require their consumer journeys to be checked again.

Separate deterministic mocked-response UI tests from authorized integration tests against an isolated test environment. Mock slow/error/429/session states without touching production. A mocked payment-success response only proves UI handling; provider test-mode checks must separately verify server capture, webhook and reconciliation behavior. Use synthetic customer/shop accounts, no real charges/refunds/email recipients, and no production mutation as a shortcut.

When setup is authorized, add separate scripts for UI, accessibility and visual checks without replacing existing npm test suites. Record the exact revision, environment, commands, browser/device, results and blockers in PROJECT_STATUS.md. CI smoke coverage should gate core login and purchase paths; broader route/state/browser coverage runs before release. Keep screenshots/traces free of secrets and private records. A passing browser suite is not a penetration test or a substitute for server authorization checks.

Release acceptance includes existing server regressions, critical UI journeys, validation and duplicate guards, reviewed visual baselines, accessibility triage, real-phone review and separately approved Razorpay test-mode evidence. Unverified scenarios remain pending in APPLICATION_BACKLOG.md; do not claim production readiness from tool installation.

Official references: [Playwright tests](https://playwright.dev/docs/writing-tests), [mobile emulation](https://playwright.dev/docs/emulation), [axe integration](https://playwright.dev/docs/accessibility-testing), [Vitest component testing](https://vitest.dev/guide/browser/component-testing).
