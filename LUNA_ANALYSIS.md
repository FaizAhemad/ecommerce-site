# Luna UI/UX analysis

Status: working design analysis, 2026-09-25. This document translates the current Gadgify documentation, route inventory, owner screenshots and source review into an application-wide visual direction. It is not a completion checklist; `APPLICATION_BACKLOG.md` remains the only checklist.

## Product character

Gadgify sells useful household objects in India, primarily Maharashtra. The interface should feel calm, trustworthy and practical: a warm light surface, confident dark text, restrained citron accents and clear purchase actions. The visual system should support product discovery without making the store feel like a luxury editorial page or a noisy discount marketplace.

## Visual system

- **Surfaces:** warm off-white page background, white or near-white cards and drawers, subtle neutral borders, and restrained shadows only for elevation.
- **Text:** dark ink for headings and primary copy; muted ink for secondary copy; never use low-contrast grey for required instructions or prices.
- **Accent:** citron marks selected, confirmed or attention states with dark text. It is an accent, not the default background for large areas.
- **Actions:** dark ink primary buttons with light text; neutral outlined secondary buttons; a distinct destructive treatment for irreversible actions. Every button uses the shared height, radius, typography, focus and pending rules.
- **Semantic feedback:** success, information, warning and error each have a consistent border/icon/text treatment and an inline explanation. Color never carries meaning alone.
- **Spacing:** shared 4/8/12/16/24/32/48px scale; 16px phone gutters, 24px tablet gutters and 32px desktop gutters through `PageContainer` and layout tokens.
- **Typography:** display face for short headings, body/control face for readable copy and form controls, 16px minimum input text, comfortable line height, sentence case labels and a clear heading hierarchy.
- **Shape and layers:** one control radius, one card radius, one dialog layer and one snackbar layer. Avoid page-specific radii, button padding, shadows or z-index values unless a documented exception exists.

## Content and wording

Use plain customer language. Say “Loading your store” or “Checking your account” in a user-facing state; do not expose internal API/session terminology. Use specific labels such as “Add to cart”, “Choose delivery address”, “Place order” and “Check order status”. Explain what happened and the next safe action in errors. Preserve entered data. Distinguish order recorded, payment pending, payment confirmed and email accepted. Remove placeholder text, unsupported promises and technical details that do not help a customer decide.

## Whole-application review map

Review every route and every admin tab in this order, then repeat affected consumers after shared changes:

1. Bootstrap, session loading/error, `SiteLayout`, `PageContainer`, header, navigation, footer, social links, snackbar, dialogs and overlays.
2. Customer purchase path: home, catalog, product/media/reviews, cart, checkout, payment, orders, order detail, tracking and returns.
3. Account path: login, signup, forgot/reset password, email verification, profile, addresses, expiry and logout.
4. Support and information: help/tour, support tickets/replies/attachments, feedback and all policy pages.
5. Marketplace: shops, seller onboarding, seller products/media, moderation, seller orders, fulfillment, inspection and disputes.
6. Administration: analytics, products/categories, orders, payments/refunds, returns, customers, messages, feedback, settings, coupons, shipments, notifications, sellers and support.

For each page/component check normal, loading, slow, background refresh, empty, validation error, server error, retry, pending mutation, success, forbidden and long-content states where applicable. Check 320/360/390/430px phones, 768px tablet and 1280/1440px desktop, keyboard focus, text zoom, touch targets, safe areas and overlay behavior. Record source, owner screenshot, browser and real-device evidence separately.

## Shared-component policy

Reuse `SiteLayout`, `PageContainer`, shared buttons/fields/cards, `FormDialog`, `NotificationProvider`, `OrderTotals`, query-key factories and domain hooks. Extend an existing primitive before creating a page-local duplicate. Primary login and checkout remain pages; contextual editors use the shared dialog. Notifications keep the five-second queue behavior, deduplicate equal messages, remain visible inline for critical outcomes and never expose raw exceptions or provider payloads.

## Release focus

The first release should keep Gadgify-only commerce enabled and external-shop purchasing, commissions and payouts disabled until their business, provider and verification gates are approved. Fix broken login/purchase flows, hidden mobile content, misleading financial states, private-data exposure, inaccessible controls and inconsistent shared primitives before decorative polish.

## Evidence boundary

Code inspection and screenshots are useful findings but do not prove production readiness. Do not mark a scope complete from a browser screenshot alone. Keep tests, provider test-mode evidence, migrations, security review, real Android/iOS checks and owner acceptance distinct in `PROJECT_STATUS.md`.
