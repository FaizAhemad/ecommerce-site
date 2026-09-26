# Gadgify quality inspection

Owner requested this workflow on 2026-09-24. It is separate from existing listing/photo moderation. Source implementation is not evidence of a physical inspection, migration or production verification.

## Current operating choice

The owner is unsure whether every shop should ship through Gadgify. Keep current shop-managed delivery and expose **optional administrator-requested inspection per external-shop order**. Orders with no inspection record retain their existing flow. Mandatory inspection, central warehousing/dispatch, transport charges and liability remain undecided; do not enable those implicitly.

Gadgify admins retain oversight of all shops. Sellers can read only their authorized shop's inspection details/photos, and use the existing support conversation to respond. Customers receive only status and the dispatch-hold indicator, not inspection photos, findings or staff call notes. Only administrators record inspection changes.

## Workflow

Admin selects an external-shop order before customer dispatch, provides a note and requests inspection. This creates REQUESTED and places that shop order on hold. Admin records physical receipt before choosing PASSED or FAILED. Failed items can be recorded as RETURNING_TO_SHOP then RETURNED_TO_SHOP, or move to REPLACEMENT_REQUESTED. Replacement receipt returns to RECEIVED for a fresh pass/fail decision. Customer dispatch remains blocked until PASSED, including during return/replacement handling.

Admin notes should identify defects and, when returning items, the carrier/tracking reference. Return-to-shop status records staff activity; it does not book a courier, deduct stock, cancel an order or issue a refund. Inspection covers all items in the selected shop order; per-item/partial acceptance is separate pending scope.

Up to three private evidence images of 1 MB each are supported after receipt or failure, using existing signature/MIME validation. Photos are not public URLs and cannot be viewed by other shops or customers. Images remain evidence; no deletion/retention automation is added. Staff may record call notes, visible to admins only; the application does not place calls.

## Security and delivery behavior

Reserved shop-inspection and inspection-media records cannot use generic Settings APIs. Writes recheck admin and order eligibility within the existing serializable transaction, require expected versions and bind action UUIDs to actor/content. Shop inspection and dispatch reads/writes share that transaction boundary to reject conflicting changes. Existing shop/customer authorization remains in place for reads.

Inspection changes queue generic notices to active shop members with verified emails. Membership, shop approval and recipient verification are checked again before sending. Call notes and photo uploads do not trigger email. Messages direct sellers to authenticated records, omit private evidence and make no financial claims. At most two queued jobs are attempted immediately after commit; the existing worker/admin processing handles the remainder and bounded retries. Provider acceptance does not prove delivery.

## Implementation and pending acceptance

Source: focused inspection state/record/notification helpers, existing fulfillment dispatcher endpoints, admin/seller/customer order panels, inspection list filter, protected photos and audit events. Uses existing StoreSetting and prepared marketplace schema; no new migration or environment variable is introduced. Existing marketplace migrations and generated Prisma types remain rollout prerequisites.

Regression cases cover transitions, holds, duplicate/stale updates, privacy and revoked-recipient suppression. They have not run. Tests/lint/build/format, database concurrency, browser/phone, provider delivery and production acceptance remain deferred. Mandatory-inspection policy, custody/transport responsibility, partial-item inspection and retention rules remain pending. APPLICATION_BACKLOG.md is the sole checklist; PROJECT_STATUS.md records source evidence and limitations.
