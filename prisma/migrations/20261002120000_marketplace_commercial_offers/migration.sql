-- Owner-applied only. Requires marketplace_foundation and seller_fulfillment first.
BEGIN;

ALTER TABLE "Shop"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "gstReviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD CONSTRAINT "Shop_contact_bounds" CHECK (
    ("phone" IS NULL OR length("phone") BETWEEN 7 AND 20) AND
    ("address" IS NULL OR length("address") BETWEEN 5 AND 500) AND
    ("city" IS NULL OR length("city") BETWEEN 2 AND 100)
  ),
  ADD CONSTRAINT "Shop_gst_review_status_check" CHECK ("gstReviewStatus" IN ('PENDING','APPROVED','NEEDS_INFO','REJECTED'));

ALTER TABLE "ShopProduct"
  ADD COLUMN "offerStatus" TEXT NOT NULL DEFAULT 'NOT_OFFERED',
  ADD COLUMN "feeType" TEXT,
  ADD COLUMN "feeValue" INTEGER,
  ADD COLUMN "offerVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "acceptedOfferVersion" INTEGER,
  ADD CONSTRAINT "ShopProduct_offer_status_check" CHECK ("offerStatus" IN ('NOT_OFFERED','PROPOSED','ACCEPTED','REJECTED')),
  ADD CONSTRAINT "ShopProduct_fee_type_check" CHECK ("feeType" IS NULL OR "feeType" IN ('FIXED_PER_UNIT','PERCENTAGE')),
  ADD CONSTRAINT "ShopProduct_fee_value_check" CHECK (
    ("feeType" IS NULL AND "feeValue" IS NULL) OR
    ("feeType"='FIXED_PER_UNIT' AND "feeValue" BETWEEN 1 AND 1000000000) OR
    ("feeType"='PERCENTAGE' AND "feeValue" BETWEEN 1 AND 10000)
  ),
  ADD CONSTRAINT "ShopProduct_offer_version_check" CHECK (
    "offerVersion" >= 0 AND
    ("acceptedOfferVersion" IS NULL OR ("offerStatus"='ACCEPTED' AND "acceptedOfferVersion"="offerVersion")) AND
    ("offerStatus"='NOT_OFFERED' OR "feeType" IS NOT NULL)
  );

ALTER TABLE "OrderItem"
  ADD COLUMN "discountMinor" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "OrderItem_discount_nonnegative" CHECK ("discountMinor" >= 0 AND "discountMinor" <= "unitPriceMinor"::BIGINT * "quantity");

ALTER TABLE "ShopOrderItem"
  ADD COLUMN "feeType" TEXT,
  ADD COLUMN "feeValue" INTEGER,
  ADD COLUMN "offerVersion" INTEGER,
  ADD COLUMN "feeBaseMinor" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "feeAmountMinor" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "feeStatus" TEXT NOT NULL DEFAULT 'NONE',
  ADD CONSTRAINT "ShopOrderItem_fee_type_check" CHECK ("feeType" IS NULL OR "feeType" IN ('FIXED_PER_UNIT','PERCENTAGE')),
  ADD CONSTRAINT "ShopOrderItem_fee_status_check" CHECK ("feeStatus" IN ('NONE','PENDING','DUE','VOID','REVERSED')),
  ADD CONSTRAINT "ShopOrderItem_fee_nonnegative" CHECK ("feeBaseMinor" >= 0 AND "feeAmountMinor" >= 0);
ALTER TABLE "ShopOrderItem" ALTER COLUMN "feeStatus" SET DEFAULT 'PENDING';

CREATE OR REPLACE FUNCTION "snapshot_order_item_shop"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE shop_id TEXT; shop_name TEXT; seller_id TEXT; platform BOOLEAN;
  fee_type TEXT; fee_value INTEGER; offer_version INTEGER; fee_base BIGINT; fee_amount BIGINT;
BEGIN
  SELECT s."id",s."name",s."isPlatform",sp."feeType",sp."feeValue",sp."offerVersion"
    INTO shop_id,shop_name,platform,fee_type,fee_value,offer_version
    FROM "ShopProduct" sp JOIN "Shop" s ON s."id"=sp."shopId"
    WHERE sp."productId"=NEW."productId";
  IF NOT FOUND THEN RAISE EXCEPTION 'Product shop ownership is required'; END IF;
  IF NOT platform AND NOT EXISTS (
    SELECT 1 FROM "ShopProduct" sp JOIN "Shop" s ON s."id"=sp."shopId"
    WHERE sp."productId"=NEW."productId" AND sp."moderationStatus"='APPROVED'
      AND sp."offerStatus"='ACCEPTED' AND sp."acceptedOfferVersion"=sp."offerVersion"
      AND s."status"='APPROVED' AND s."gstReviewStatus"='APPROVED'
  ) THEN RAISE EXCEPTION 'Shop commercial offer acceptance is required'; END IF;
  seller_id := 'so_' || md5(NEW."orderId" || ':' || shop_id);
  INSERT INTO "SellerOrder" ("id","orderId","shopId","shopName") VALUES (seller_id,NEW."orderId",shop_id,shop_name)
    ON CONFLICT ("orderId","shopId") DO NOTHING;
  fee_base := GREATEST(NEW."unitPriceMinor"::BIGINT * NEW."quantity" - NEW."discountMinor", 0);
  IF platform THEN fee_type := NULL; fee_value := NULL; offer_version := NULL; fee_amount := 0;
  ELSIF fee_type='FIXED_PER_UNIT' THEN fee_amount := fee_value::BIGINT * NEW."quantity";
  ELSIF fee_type='PERCENTAGE' THEN fee_amount := ROUND(fee_base * fee_value::NUMERIC / 10000);
  ELSE RAISE EXCEPTION 'Accepted seller fee terms are missing'; END IF;
  IF fee_amount > fee_base THEN RAISE EXCEPTION 'Seller fee exceeds the discounted item amount'; END IF;
  IF fee_amount > 2147483647 THEN RAISE EXCEPTION 'Seller fee exceeds supported range'; END IF;
  INSERT INTO "ShopOrderItem" ("orderItemId","shopId","shopName","sellerOrderId","feeType","feeValue","offerVersion","feeBaseMinor","feeAmountMinor","feeStatus")
    VALUES (NEW."id",shop_id,shop_name,seller_id,fee_type,fee_value,offer_version,fee_base::INTEGER,fee_amount::INTEGER,CASE WHEN platform OR fee_amount=0 THEN 'NONE' ELSE 'PENDING' END);
  RETURN NEW;
END;
$$;

COMMIT;
