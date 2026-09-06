# White-label Commerce Platform Requirements

## Product Direction

Build a reusable, production-ready commerce platform for small businesses. The same application must support different businesses through configuration and data, without forks or business-specific source-code changes.

```text
Same application + different configuration = different business deployment
```

Initial operating model:

- One deployment
- One business configuration
- One database
- Architecture ready to evolve toward multi-tenant operation

## Architecture Boundaries

The platform is composed of these capabilities:

- Customer application
- Admin application
- Authentication and authorization
- Business configuration and CMS
- Product catalog and media
- Cart and checkout
- Payments and webhooks
- Orders, cancellation, returns, and refunds
- Shipping, delivery, and tracking
- Reviews and moderation
- Notifications and transactional email
- AI assistant
- Policies and policy versioning
- Localization and accessibility
- Structured error handling
- Testing, performance, and production operations

Business-specific data belongs in the database or configuration layer. Business logic belongs in source code. Secrets belong in environment or infrastructure configuration.

## Configuration

### Database or admin-managed configuration

- Application and business name
- Logo, favicon, tagline, and brand colors
- Typography settings where appropriate
- Support and business contact details
- Address, business hours, social links, and footer content
- Currency, locale, timezone, and supported locales
- Shipping rules, delivery areas, charges, thresholds, and estimates
- Feature toggles such as returns, refunds, and cancellation
- AI assistant name, greeting, and escalation details
- Approved policies and their localized versions
- Product catalog, inventory, prices, and media

### Environment and secret configuration

- Database credentials and URLs
- Payment provider keys and secrets
- Email provider credentials
- AI and map provider credentials
- Session, JWT, and encryption secrets
- Storage, production URL, and infrastructure settings
- Monitoring and logging configuration

Never expose backend secrets to the browser. Frontend environment variables must be intentionally safe for browser exposure. Sensitive local files must be ignored by git.

## White-label Branding

Do not hardcode a particular business identity in UI, metadata, authentication, notifications, AI, email templates, or CSS. Use a centralized application configuration contract. Page titles, favicon, Open Graph metadata, footer, support details, and assistant identity must be configurable.

The current storefront UI is light-only by product decision. Use semantic theme tokens and preserve readable contrast across text, controls, borders, product surfaces, focus indicators, dialogs, snackbars, maps, and sticky elements. Business brand colors must be mapped through semantic tokens rather than used raw everywhere. Dark mode is not part of the current UI until a new palette is approved.

### Theme review requirement

The previously implemented theme preview was removed after review. The approved current palette is Ink and Citron: primary `#28313b`, accent `#c7d866`. A future dark-mode proposal must be separately reviewed before implementation.

## Localization

All customer-facing and admin-facing UI, validation messages, errors, notifications, emails, statuses, and policy titles must use i18n. Initial locale targets are:

- `en-US`
- `hi-IN`
- `mr-IN`

Dynamic business content must support localization where appropriate. Translated legal content requires business review and must not be assumed legally equivalent.

## Commerce

- Product catalog uses a responsive grid only; no list view or grid/list toggle.
- Initial catalog families include accessories, toys, and home gadgets such as mop hangers, organizers, and sink caddies. The category list must remain API-configured and extensible.
- The products page must support API-backed search, category filtering, sorting, and other configured filters without hardcoded catalog assumptions.
- Large catalogs must use cursor/page-based API pagination with infinite scroll or an equivalent progressive loading pattern. The UI must not assume that all products are loaded at once.
- Each product must have a separate product detail page and URL, with media, price, inventory state, options, reviews, and configured commerce actions supplied by the API.
- Products support multiple images, one primary image, and multiple videos through a media abstraction.
- Product media must be supplied by the business; do not add third-party product media or hotlink assets.
- Cart, checkout, payment, payment verification, webhooks, and order history must be integrated.
- Refunds must be tied to the original payment and order, verify eligibility and remaining amount on the backend, and be idempotent.
- Return, refund, and cancellation flows must use configurable business rules and feature flags.
- Cancellation must define allowed states, cutoff, and refund behavior.
- Reviews must define eligibility, verified purchase behavior, moderation, and status handling.

## Delivery and Tracking

Support configurable delivery areas, charges, free-shipping thresholds, estimates, providers, tracking, and shipment status. Tracking belongs in shipment and tracking-event models, not only in the order record.

Live courier GPS is optional and must only be implemented when the provider or delivery-agent requirements are confirmed. Map access must use a `MapProvider` abstraction. Do not invent provider URLs or delivery promises.

## Policies and Legal Content

Provide structure and customer-facing pages for:

- Privacy Policy
- Terms and Conditions
- Refund Policy
- Return Policy
- Cancellation Policy
- Shipping or Delivery Policy
- Cookie Policy where applicable

Policies must be manageable without source changes and support type, title, content, locale, version, status, publication time, and audit timestamps. Published versions must remain historically auditable. Relevant policies must be accessible from the footer and checkout, with recorded acceptance versions when legally/business requirements call for consent.

Do not present generated or placeholder legal text as authoritative. Missing content must be reported as:

```text
BUSINESS INPUT REQUIRED
Policy: <policy name>
Status: Content not supplied
Action required: Business owner must provide or review approved policy content.
```

## Email and Notifications

Domain operations should emit events such as order created and payment succeeded. Notification handling should be asynchronous where appropriate so email provider failures do not automatically fail the business transaction.

Transactional templates must support branding, localization, customer and order data, relevant calls to action, and support details for at least:

- Account verification
- Welcome
- Password reset
- Order confirmation
- Payment success and failure
- Order cancellation and return
- Refund initiated and completed
- Order shipped, out for delivery, and delivered

Email display configuration includes sender name, sender address, reply-to, and support address. Provider credentials remain secrets. Notification failures must be recorded, retried, and visible to admins.

## AI Assistant

The assistant uses configured business information, product data, approved policies, FAQs, contact details, and order tools. It must not invent prices, stock, discounts, refund or return eligibility, delivery dates, order status, payment status, or policy terms. Unsupported information must be clearly identified as unavailable. Verified application data is authoritative.

## Administration and Authorization

Admin settings should manage non-secret business profile, branding, contact, policies, email display configuration, locales, shipping, feature flags, and AI configuration. Secrets must not appear in ordinary admin screens.

Support a permission model that can evolve beyond one unrestricted admin. Candidate roles are Super Admin, Admin, Order Manager, Product Manager, Support, and Content/Policy Manager. Avoid unnecessary RBAC complexity until requirements are confirmed.

## Reliability, UX, and Security

- Use centralized structured errors with error code, safe localized message, request ID, and optional validation details.
- Never expose stack traces, SQL exceptions, provider exceptions, secrets, or internal implementation details.
- Prevent visual overlap with a centralized layering system and responsive layout constraints.
- Keep asynchronous AI, payment, media, and tracking work responsive.
- Optimize rendering, API calls, queries, caching, media, bundle size, and network requests.
- Use consistent design-system components, loading states, empty states, dialogs, drawers, snackbars, and focus states.
- Do not invent business rules when requirements affect money, legal rights, delivery promises, or eligibility. Raise a `CLARIFICATION NEEDED` decision instead.

## Verification Requirements

Before production readiness, test success and failure paths for authentication, authorization, products and media, cart, checkout, payment and webhooks, orders, cancellation, returns, refunds, reviews, tracking, email events, policies, localization, AI, and admin.

## Home Page Experience

The home page must be composed of independent API-configured sections rather than one hardcoded block. It should support a hero, product/category carousel, featured products, promotional content, brand story, trust or service information, and configured calls to action. Carousel controls must be keyboard accessible, responsive, and must not introduce layout shift or overlap.

The home page and all catalog surfaces must remain responsive for thousands of products and asynchronous API loading.

Every meaningful change follows:

```text
Implement -> format -> lint -> type check -> test -> build
```

## Business Inputs Required Before Launch

- Business name, application name, logo, favicon, colors, and tagline
- Business and support email, phone, address, and hours
- Currency, tax/GST, catalog, inventory, pricing, delivery areas, and shipping charges
- Approved policy content for every applicable policy
- Product images, primary images, and videos
- Verified payment, email, AI, storage, map, shipping, and tracking providers
- Domain, production database, storage, environment variables, and monitoring
