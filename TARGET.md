# Implementation Target

## Target Outcome

Deliver a reusable white-label commerce platform rather than a one-off storefront. A second business should be deployable by changing configuration, approved content, products, and infrastructure secrets, not by rewriting business logic.

## Current Baseline

The Vite + React + TypeScript frontend currently provides:

- Centralized starter configuration in `src/config.ts`
- Configurable business identity, contact details, locale, currency, and feature flags
- Product grid presentation with local placeholder art
- Light-only Ink and Citron theme with semantic tokens
- Responsive header, hero, collection, story, and footer surfaces
- A local cart-count interaction for UI prototyping
- Separate Home, Products, and Support routes with reusable components
- Approved starter palette: Ink and Citron (`#28313b` / `#c7d866`); dark mode is deferred pending a better palette decision
- Starter catalog families: Accessories, Toys, and Home gadgets, including mop hangers and household organizers

This is a frontend foundation, not a production commerce implementation yet.

## Delivery Phases

### Phase 1: Frontend foundation

- Establish light-only design tokens for the approved Ink and Citron palette, with contrast verification.
- Add typed configuration access instead of scattered business literals.
- Add i18n infrastructure for `en-US`, `hi-IN`, and `mr-IN`.
- Build reusable layout, form, button, card, dialog, drawer, snackbar, loading, and empty-state components.
- Keep the product catalog grid-only and responsive.
- Add an API-shaped home page section model for heroes, carousels, featured products, promotions, story, service information, and calls to action.
- Add API-backed catalog filters, progressive infinite loading, and product detail routes.
- Add accessible metadata, focus handling, keyboard navigation, and no-overlap layout rules.

### Phase 2: Application and data foundation

- Choose and document the backend, database, ORM, storage, and migration strategy.
- Define typed models for business configuration, products, media, users, roles, carts, orders, payments, shipments, tracking events, reviews, policies, notifications, and audit records.
- Define cursor/page pagination contracts, filter/sort contracts, product detail responses, and home-section responses.
- Add environment configuration documentation and secret handling.
- Add request IDs, structured errors, validation, authorization boundaries, and safe API responses.

### Phase 3: Customer commerce

- Implement authentication, account verification, password reset, and customer profile flows.
- Implement catalog, media, inventory, cart, checkout, payment provider abstraction, webhooks, and order history.
- Implement configurable cancellation, return, refund, shipping, and delivery workflows.
- Verify all money and eligibility decisions on the backend.

### Phase 4: Admin and operations

- Implement role-aware admin navigation and authorization.
- Add business profile, branding, contact, locale, shipping, feature, policy, and email display configuration screens.
- Add product and media management, inventory, order operations, returns, refunds, shipments, review moderation, and notification failure visibility.
- Keep secrets outside normal admin UI.

### Phase 5: Policies, email, and AI

- Add versioned and localized policy records and customer-facing pages.
- Add checkout policy access and versioned consent recording where required.
- Add domain events and asynchronous notification processing with retries and failure records.
- Add localized transactional templates for the required account, order, payment, refund, return, and delivery events.
- Add a configured AI assistant that uses authoritative catalog, order, FAQ, contact, and policy tools and refuses unsupported claims.

### Phase 6: Delivery and integrations

- Add shipment and tracking abstractions.
- Integrate only verified payment, email, storage, map, AI, and shipping providers.
- Add live delivery location only after a real courier or delivery-agent requirement is supplied.
- Keep map rendering behind a `MapProvider` abstraction.

### Phase 7: Verification and release

- Add unit, integration, API, authorization, webhook, event, and end-to-end tests.
- Test success and failure paths for every capability listed in `REQUIREMENTS.md`.
- Run formatting, lint, type check, tests, and production build in CI.
- Verify both themes, all target locales, responsive breakpoints, focus states, and no-overlap behavior.
- Document deployment, migrations, backups, monitoring, error reporting, and rollback procedures.

## Acceptance Criteria

The target is complete only when:

- A new business can change identity, branding, contact details, products, locales, shipping settings, email display details, policies, and feature flags through configuration/data.
- A catalog with thousands of products loads progressively from API pagination and can be filtered without loading the entire catalog into the browser.
- Products and home sections have independent routes/components and render from API responses.
- Secrets are environment-managed and never shipped to the browser or exposed in ordinary admin UI.
- The light-only Ink and Citron theme remains legible with business branding applied.
- Customer and admin UI text is translated through i18n rather than hardcoded.
- Legal policy pages exist, are versioned, and clearly identify missing business-approved content.
- Payments, webhooks, order state changes, refunds, returns, delivery, tracking, notifications, and AI use authoritative backend data.
- Notification failure does not silently lose an event or incorrectly fail an order/payment transaction.
- Role boundaries, structured errors, request IDs, auditability, and safe provider error handling are present.
- Automated checks cover core success and failure paths and the production build passes.

## Open Decisions Requiring Business Input

These must not be silently invented:

- Business country, state, tax/GST treatment, and legal jurisdiction
- Product type, return conditions, refund rules, cancellation cutoff, and eligibility
- Delivery areas, charges, estimates, courier, and tracking capabilities
- Payment, email, AI, storage, map, and shipping providers
- Approved policy text and translated legal content
- Admin roles and exact permissions
- Whether live delivery location is needed

Use this format when blocked:

```text
CLARIFICATION NEEDED

Area: <decision area>
Question: <specific question>
Why it matters: <technical or business impact>
Recommended option: <default proposal>
Alternatives: <other valid options>
```
