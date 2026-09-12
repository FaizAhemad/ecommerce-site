# Original requirements brief — historical source

Preserved original 49-section product/architecture brief. It describes desired capabilities, not completed functionality or the current technical layout. Reviewed for alignment on 2026-09-12; original scope is retained below.

Use [REQUIREMENTS.md](REQUIREMENTS.md) for the maintained specification, [APPLICATION_BACKLOG.md](APPLICATION_BACKLOG.md) for the single completion checklist, [PROJECT_STATUS.md](PROJECT_STATUS.md) for evidence and [PAGE_INVENTORY.md](PAGE_INVENTORY.md) for current routes. Current implementation uses Node.js handlers under server/api, Prisma/PostgreSQL, a custom History API router, a light-only theme, five-second snackbars and 30/60-second client/provider timeouts. Historical examples such as Python are not statements about the current stack.

---

Yes. Since you may **reuse/sell the application to other businesses**, I would change the architecture from a one-off business website into a **white-label, configurable commerce platform**.

 The important distinction is: **business-specific data should not require code changes**. App name, logo, emails, policies, support details, branding, etc. should be configurable. Secrets still belong in environment variables, while editable business content can live in a database/configuration layer.

 Here is the updated command.

 # WHITE-LABEL COMMERCE PLATFORM

 ## MASTER ARCHITECTURE AND IMPLEMENTATION REQUIREMENTS

 Build this application as a **production-ready, reusable, white-label small-business commerce platform**.

 The application should not be tightly coupled to one specific business.

 The same codebase should be capable of being configured and deployed for another business with minimal/no source-code changes.

---

 # 1\. CORE ARCHITECTURAL PRINCIPLE

 Build the system as:

```
Reusable Commerce Platform
        │
        ├── Application
        ├── Admin
        ├── Authentication
        ├── Products
        ├── Cart
        ├── Checkout
        ├── Payments
        ├── Orders
        ├── Delivery
        ├── Reviews
        ├── Notifications
        ├── AI Assistant
        ├── Policies
        ├── CMS/Business Configuration
        └── Localization
```

 Business-specific configuration must be separated from application logic.

 The goal is:

```
Same application
       +
Different configuration
       =
Different business deployment
```

 Do not create a separate fork of the codebase for every customer/business.

---

 # 2\. BUSINESS CONFIGURATION

 Create a centralized business/application configuration system.

 Business-specific information must NOT be scattered throughout React components, Python files, CSS, or random constants.

 Examples:

```
Application name
Business name
Logo
Favicon
Tagline
Support email
Business email
Phone
Address
Currency
Default locale
Supported locales
Business timezone
Social links
Contact information
Footer content
Policy configuration
```

 Conceptually:

```
BusinessConfiguration
├── identity
├── branding
├── contact
├── localization
├── commerce
├── shipping
├── notifications
├── policies
└── feature configuration
```

---

 # 3\. CONFIGURATION VS ENVIRONMENT VARIABLES

 Do NOT put everything into `.env`.

 Use the correct mechanism.

 ## Environment variables

 Use environment variables for:

```
Secrets
API keys
Database credentials
Razorpay secret
Email provider credentials
AI provider credentials
Map provider credentials
JWT/session secrets
Encryption keys
Production URLs
Infrastructure configuration
```

 ## Application/business configuration

 Use database/configuration for things that a business may reasonably change:

```
App name
Business name
Logo
Support email
Phone
Address
Currency
Policies
Footer information
Brand colors
Supported languages
Shipping configuration
Business settings
```

 This allows a future admin to change business information without redeploying the application.

---

 # 4\. CONFIGURATION FILES

 For local development, create actual environment files as appropriate.

 Do NOT require the user to manually create an `example.env` and pretend that is configuration.

 Use environment-specific files such as:

```
.env
.env.local
.env.development
.env.production
```

 depending on the framework/environment strategy.

 Sensitive files must be in `.gitignore`.

 Never commit secrets.

 The application must document which variables are required.

 Do not expose backend secrets to the frontend.

 Frontend-exposed environment variables must contain only values intentionally safe for browser exposure.

---

 # 5\. WHITE-LABEL BRANDING

 The following should be configurable:

```
Application name
Business name
Logo
Favicon
Primary color
Secondary color
Accent color
Typography configuration where appropriate
Footer branding
Contact information
Support information
```

 Do not hardcode:

```
"My Business"
```

 anywhere in the UI.

 Use configuration.

 For example conceptually:

```
appConfig.businessName
```

 or server-provided configuration.

 The actual implementation should use the project's established configuration architecture.

---

 # 6\. EMAIL CONFIGURATION

 Email-related business information must be configurable.

 Do NOT hardcode:

```
from email
reply-to email
support email
business email
sender name
application name
```

 Email configuration should support:

```
sender name
sender email
reply-to email
support email
```

 Provider credentials must remain in environment variables/secrets.

---

 # 7\. EMAIL TEMPLATES

 Create proper transactional email templates.

 At minimum support:

```
Account verification
Welcome
Password reset
Order confirmation
Payment successful
Payment failed
Order cancelled
Order returned
Refund initiated
Refund completed
Order shipped
Out for delivery
Order delivered
```

 Add other events where business requirements require them.

 Every email must support:

```
Branding
Application/business name
Logo where appropriate
Localized content
Order information
Customer information
Relevant CTA
Footer
Support/contact information
```

 Do not hardcode business identity into templates.

---

 # 8\. EMAIL EVENT ARCHITECTURE

 Business operations should generate domain events where appropriate.

 Conceptually:

```
Order created
    ↓
OrderCreated event
    ↓
Notification handler
    ↓
Email
```

 Example:

```
Payment successful
    ↓
PaymentSucceeded
    ↓
Order confirmation
    ↓
Email
```

 This keeps business logic separate from email implementation.

 Do not make the core order transaction depend synchronously on an email provider unless there is a specific reason.

 Prefer reliable asynchronous processing where appropriate.

---

 # 9\. EMAIL FAILURE

 If an email provider is temporarily unavailable:

 The order/payment operation should not automatically fail merely because an email could not be sent, unless business requirements explicitly require that behavior.

 Record the notification failure.

 Retry according to an appropriate retry strategy.

 Provide visibility to admins.

 Do not silently lose transactional notifications.

---

 # 10\. POLICIES

 The application must support configurable business policies.

 At minimum:

```
Privacy Policy
Terms & Conditions
Refund Policy
Return Policy
Cancellation Policy
Shipping/Delivery Policy
Cookie Policy where applicable
```

 Do not invent legal text and present it as legally authoritative.

 The platform should provide the **structure and pages** for these policies.

 The business owner must supply or approve the actual legal content.

---

 # 11\. POLICY MANAGEMENT

 Policies should be manageable without modifying source code.

 Recommended model:

```
Policy
├── id
├── type
├── title
├── content
├── locale
├── version
├── status
├── published_at
├── created_at
└── updated_at
```

 Support localized versions.

 Example:

```
Privacy Policy
├── en-US
├── hi-IN
└── mr-IN
```

 Do not assume all translations are legally equivalent.

 The business owner should review/approve translated legal content.

---

 # 12\. POLICY VERSIONING

 Policies should support versions.

 Example:

```
Privacy Policy
v1
v2
v3
```

 When a policy changes, do not overwrite historical information blindly.

 Maintain publication/version information.

 This is important for auditability.

---

 # 13\. POLICY PAGES

 Customer-facing pages should include appropriate access to:

```
Privacy Policy
Terms & Conditions
Refund Policy
Return Policy
Cancellation Policy
Shipping Policy
```

 These should be accessible from the footer.

 Do not clutter the main navigation with all policy pages.

---

 # 14\. CHECKOUT POLICY LINKS

 Checkout should provide access to the relevant policies.

 For example, where legally/business appropriate:

```
Terms & Conditions
Privacy Policy
Return/Refund Policy
```

 If acceptance/consent is required, explicitly record the appropriate version.

 Do not assume legal consent requirements.

 Ask the business owner/legal advisor where necessary.

---

 # 15\. LEGAL DISCLAIMER

 The platform must not claim that generated/default policy text is legally sufficient for every jurisdiction.

 Provide placeholders/configuration for the business's approved policy text.

 If the business owner says:

 > "I don't know what policy to use"

 the application should still provide the pages and configuration mechanism, but the agent must flag:

```
LEGAL CONTENT REQUIRED
```

 rather than silently inventing legal guarantees.

---

 # 16\. FOOTER

 The footer should dynamically render configured information.

 Example conceptual structure:

```
Brand
Description

Shop
Products
Orders

Customer Support
Contact
FAQ if configured

Policies
Privacy
Terms
Returns
Refunds
Cancellation
Shipping

Languages
English
Hindi
Marathi
```

 Only display sections/content that are configured.

 Do not show fake links.

---

 # 17\. APP NAME

 The application name must be configurable.

 Do not hardcode the application name into:

 - Page titles
- Header
- Footer
- Emails
- Notifications
- AI assistant
- Authentication screens
- Metadata

 Use centralized configuration.

---

 # 18\. PAGE METADATA

 Page metadata should be configurable where appropriate.

 Support:

```
Application title
Business name
Default description
Favicon
Open Graph metadata
Social preview information
```

 Do not hardcode another business's branding into metadata.

---

 # 19\. AI ASSISTANT BRANDING

 The AI assistant should use configurable branding.

 Example:

```
Assistant name
Assistant greeting
Business name
Support escalation information
```

 Do not hardcode:

```
"Ask MyBusiness AI"
```

 Instead make the assistant identity configurable.

---

 # 20\. AI BUSINESS KNOWLEDGE

 AI should be able to use configured business information such as:

```
Business information
Product catalog
Product descriptions
Shipping policy
Return policy
Refund policy
Cancellation policy
Frequently asked questions
Contact information
```

 The AI must not invent business policies.

 If the required information does not exist, it should clearly indicate that information is unavailable.

---

 # 21\. AI POLICY RESTRICTIONS

 The AI must NEVER invent:

```
Refund eligibility
Return eligibility
Discounts
Prices
Stock
Delivery dates
Order status
Payment status
Policy terms
```

 These must come from authoritative application data.

 AI can explain verified information in natural language.

---

 # 22\. ORDER REFUND

 The application must support refund workflows.

 Do not assume the exact refund policy.

 The technical system should support:

```
Refund requested
Refund approved
Refund rejected
Refund initiated
Refund processing
Refund completed
Refund failed
```

 Actual valid transitions must be defined according to business requirements/payment provider capabilities.

---

 # 23\. REFUND PAYMENT INTEGRATION

 Refunds must be tied to the original payment/order.

 Never allow an arbitrary frontend amount to determine the refund amount.

 Backend must verify:

```
Order
Payment
Amount
Refund eligibility
Already refunded amount
```

 before initiating a refund.

 Refund operations must be idempotent.

---

 # 24\. RETURN WORKFLOW

 The system should be architected to support:

```
Return requested
Return approved
Return rejected
Return pickup
Return received
Return completed
```

 Do not assume every business supports returns.

 Make the feature configurable.

 For example:

```
returnsEnabled
refundsEnabled
cancellationEnabled
```

 These are feature/business configuration values.

---

 # 25\. CANCELLATION

 Support configurable cancellation rules.

 Example:

```
Cancellation enabled
Cancellation cutoff
Allowed order states
Refund behavior
```

 Do not hardcode:

```
"Orders can always be cancelled."
```

 Business rules must be configurable or explicitly defined.

---

 # 26\. SHIPPING / DELIVERY POLICY

 The platform should support configurable delivery information:

```
Delivery areas
Shipping charges
Free shipping threshold
Estimated delivery information
Delivery provider
Tracking support
```

 Do not invent delivery promises.

---

 # 27\. TRACKING

 Orders should support:

```
Tracking ID
Shipment status
Tracking timeline
Delivery provider
Shipment timestamps
Current location where provider supports it
```

 Example:

```
Order
  ↓
Shipment
  ↓
Tracking ID
  ↓
Tracking events
  ↓
Current status
```

 Do not store tracking information only inside the order record.

---

 # 28\. LIVE DELIVERY LOCATION

 If the business provides local delivery with GPS tracking, architect the system to support:

```
Delivery agent
    ↓
GPS location
    ↓
Backend
    ↓
Authorized customer
    ↓
Map
```

 Do not assume that every courier provides live GPS.

 If using a third-party courier, the actual provider/API must be supplied and verified.

 If using your own delivery staff, a delivery-agent interface may be required.

---

 # 29\. MAP

 The map provider must be configurable.

 Do not hardcode a map provider before requirements are confirmed.

 The application should abstract:

```
MapProvider
```

 so a provider can be configured later.

 Do not add third-party map URLs merely as placeholders.

---

 # 30\. MULTI-BUSINESS FUTURE

 The architecture should be capable of evolving toward multi-tenant operation.

 However:

 **Do not implement a complicated multi-tenant SaaS architecture unless it is actually required now.**

 Initially:

```
One deployment
One business configuration
One database
```

 should be acceptable.

 The code should nevertheless avoid assumptions that make future white-label deployments difficult.

---

 # 31\. BUSINESS CONFIGURATION ADMIN

 Admin should eventually be able to manage appropriate non-secret settings.

 Potential areas:

```
Business profile
Branding
Contact information
Policies
Email display configuration
Supported languages
Shipping configuration
Feature toggles
AI configuration
```

 Secrets should NOT be exposed in normal admin UI.

 Secret management should use appropriate infrastructure/environment configuration.

---

 # 32\. ADMIN PERMISSIONS

 Do not make every admin a super-admin.

 Architect roles/permissions so the platform can support:

```
Super Admin
Admin
Order Manager
Product Manager
Support
Content/Policy Manager
```

 Exact roles should be finalized based on business needs.

 Do not invent a complicated RBAC system if it is not required, but do not hardcode a single unrestricted admin forever.

---

 # 33\. LOCALIZATION

 Supported locales:

```
en-US
hi-IN
mr-IN
```

 All customer-facing and admin-facing UI must use i18n.

 No hardcoded UI text.

 No hardcoded error messages.

 No hardcoded email text.

 No hardcoded policy titles/content.

 Dynamic business configuration must support localization where appropriate.

---

 # 34\. MEDIA

 Products support:

```
Multiple images
One primary image
Multiple videos
```

 The business owner provides test media.

 Do not add third-party product images/videos.

 Do not hotlink external assets.

 Use the application's media abstraction.

---

 # 35\. PRODUCT CATALOG

 Customer product presentation is:

 **GRID ONLY**

 No list view.

 No grid/list toggle.

 Responsive CSS grid.

 Product card design must remain consistent throughout the application.

---

 # 36\. REVIEWS

 Support product reviews/comments.

 Potential fields:

```
Rating
Comment
Customer
Order
Verified purchase
Status
Created date
```

 Review eligibility and moderation rules must be explicitly defined.

 Do not assume them.

---

 # 37\. UX CONSISTENCY

 Every page must use the same design system.

 Consistent:

```
Header
Footer
Buttons
Inputs
Cards
Typography
Spacing
Colors
Dialogs
Drawers
Snackbars
Errors
Loading states
Empty states
```

 Do not create page-specific visual systems.

---

 # 38\. NO UI OVERLAP

 Strictly prevent overlap between:

```
Header
Footer
Popups
Dialogs
Dropdowns
Snackbars
AI assistant
Forms
Text fields
Buttons
Maps
Sticky elements
```

 Use a centralized layering/z-index system.

 The AI assistant must dynamically account for other UI elements.

---

 # 39\. PERFORMANCE

 "No lag" is a requirement.

 Optimize:

```
Frontend rendering
API calls
Database queries
Images
Videos
Bundle size
Caching
Network requests
AI requests
```

 Avoid unnecessary work.

 The application must remain responsive while AI, payment, image, tracking, and other asynchronous operations are running.

---

 # 40\. HARD-CODED STRING RULE

 No user-facing hardcoded strings.

 This includes:

```
Buttons
Labels
Errors
Success messages
Notifications
Empty states
Dialog text
Validation
Order statuses
Tracking statuses
Emails
AI UI
Policies
Footer
Header
```

 Use i18n.

---

 # 41\. ERROR HANDLING

 Use centralized structured errors.

 Backend:

```
Error code
Safe message
Request ID
Optional validation details
```

 Frontend:

```
Error code
Localized message
Recovery action
```

 Never expose:

```
Stack traces
SQL exceptions
Provider exceptions
API secrets
Internal implementation details
```

---

 # 42\. TESTING

 Test at minimum:

```
Authentication
Authorization
Products
Product media
Cart
Checkout
Payment
Webhook
Orders
Cancellation
Returns
Refunds
Reviews
Tracking
Email events
Policies
Localization
AI assistant
Admin
```

 Test both success and failure paths.

---

 # 43\. BUILD / LINT / TYPE CHECK

 After every meaningful change:

```
Implement
↓
Format
↓
Lint
↓
Type check
↓
Tests
↓
Build
```

 Fix failures before proceeding.

 Never hide errors by disabling checks.

---

 # 44\. NO ASSUMPTIONS

 If the requirements are unclear and the decision affects business behavior:

 STOP.

 Ask the business owner.

 Use:

```
CLARIFICATION NEEDED

Area:
...

Question:
...

Why it matters:
...

Recommended option:
...

Alternatives:
...
```

 Do not invent policies, fees, delivery promises, refund rules, or legal requirements.

---

 # 45\. BUSINESS INFORMATION CHECKLIST

 Before production launch, collect:

 ## Branding

```
Business name
Application name
Logo
Favicon
Brand colors
Tagline
```

 ## Contact

```
Business email
Support email
Phone
Address
Business hours
```

 ## Commerce

```
Currency
Tax/GST configuration
Product categories
Prices
Inventory
Shipping charges
Delivery areas
```

 ## Policies

```
Privacy Policy
Terms & Conditions
Return Policy
Refund Policy
Cancellation Policy
Shipping Policy
Cookie Policy where applicable
```

 ## Media

```
Product images
Primary image for each product
Product videos
```

 ## Integrations

```
Razorpay credentials
Email provider
Map provider
AI provider
Shipping/tracking provider if applicable
```

 ## Production

```
Domain
Production database
Production storage
Environment variables
Monitoring/logging configuration
```

---

 # 46\. LEGAL CONTENT

 The developer must not invent legally binding business policies without explicit approval.

 If policy content is missing:

 Create the page structure and configuration mechanism.

 Then report:

```
BUSINESS INPUT REQUIRED

Policy:
Privacy Policy

Status:
Content not supplied

Action required:
Business owner must provide/review approved policy content.
```

 The application must make it easy to add the approved content later.

---

 # 47\. WHITE-LABEL DEPLOYMENT TEST

 The final architecture should make this possible:

```
Business A
    ↓
Configuration A
    ↓
Application

Business B
    ↓
Configuration B
    ↓
Same Application
```

 Changing:

```
Name
Logo
Colors
Emails
Policies
Contact details
Products
Languages
Shipping
Business settings
```

 must not require rewriting business logic.

---

 # 48\. FINAL QUALITY BAR

 Do not consider the project complete merely because all pages exist.

 The complete application must provide:

```
Frontend
+
Backend
+
Database
+
Authentication
+
Authorization
+
Payments
+
Webhooks
+
Orders
+
Refunds
+
Returns
+
Delivery
+
Tracking
+
Email
+
Reviews
+
AI
+
Policies
+
i18n
+
Admin
+
Error handling
+
Testing
+
Performance
+
Production build
```

 Everything must be integrated end-to-end.

---

 # 49\. FINAL RULE

 Build a **reusable commerce platform**, not a one-off website.

 Business-specific values belong in configuration/data.

 Secrets belong in environment/infrastructure configuration.

 Legal policies require business approval.

 External integrations must be verified rather than invented.

 User-facing text must use i18n.

 No third-party test media should be introduced.

 No important requirement should be assumed.

 Lint, type-check, test, and build after meaningful changes.

 The application should be maintainable by another developer and deployable for another business without rewriting the application.

 ### One architectural decision I'd strongly recommend

 For your use case, I would **not** make "everything a `.env` variable." That's tempting for a reusable product, but it becomes painful very quickly.

 Think of it as three layers:

```
┌─────────────────────────────────────────┐
│           DATABASE / ADMIN              │
│                                         │
│ Business name                           │
│ Logo                                    │
│ Policies                                │
│ Contact details                         │
│ Products                                │
│ Shipping rules                          │
│ Branding                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          ENVIRONMENT / SECRETS          │
│                                         │
│ DATABASE_URL                            │
│ RAZORPAY_KEY_SECRET                     │
│ EMAIL_API_KEY                            │
│ AI_API_KEY                               │
│ MAP_API_KEY                              │
│ SESSION_SECRET                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             SOURCE CODE                 │
│                                         │
│ Commerce logic                          │
│ Authentication                          │
│ Payment handling                        │
│ Orders                                  │
│ Reviews                                 │
│ Tracking                                │
│ AI tools                                │
│ UI components                           │
└─────────────────────────────────────────┘
```

 That separation is what will make this realistically **sellable/redeployable to another small business**.

 And for the policies, since you said you don't know much about them, I would **not ask the coding agent to make up legal policies**. Build the complete Privacy/Refund/Return/Cancellation/Terms infrastructure now, and then you can give me your business type, country/state, what you sell, delivery model, return conditions, etc., and I can help you work out what information the policies need. For actual legal compliance, the final text should be reviewed appropriately for the jurisdictions you operate in.
