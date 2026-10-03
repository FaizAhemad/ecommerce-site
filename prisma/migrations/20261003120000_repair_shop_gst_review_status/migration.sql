-- Repair physical schema drift: the commercial-offers migration is recorded as
-- applied in at least one database, but Shop.gstReviewStatus is absent there.
-- Newer databases that already have the field safely keep their current data.
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

COMMIT;
