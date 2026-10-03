-- Repair schema drift reported by `prisma migrate diff` after the marketplace
-- commercial migration was recorded as applied without the GST review column.
-- Keep this forward-only and safe on databases where the column already exists.
BEGIN;

ALTER TABLE "Shop"
  ADD COLUMN IF NOT EXISTS "gstReviewStatus" TEXT NOT NULL DEFAULT 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Shop_gst_review_status_check'
      AND conrelid = '"Shop"'::regclass
  ) THEN
    ALTER TABLE "Shop"
      ADD CONSTRAINT "Shop_gst_review_status_check"
      CHECK ("gstReviewStatus" IN ('PENDING', 'APPROVED', 'NEEDS_INFO', 'REJECTED'));
  END IF;
END;
$$;

ALTER TABLE "PurchaseFeedback"
  DROP CONSTRAINT IF EXISTS "PurchaseFeedback_userId_fkey",
  ADD CONSTRAINT "PurchaseFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  DROP CONSTRAINT IF EXISTS "PurchaseFeedback_orderId_fkey",
  ADD CONSTRAINT "PurchaseFeedback_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
