BEGIN;
LOCK TABLE "Order", "OrderItem", "ShopOrderItem" IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE "SellerOrder" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "shopName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','PACKING','SHIPPED','DELIVERED','CANCELLED')),
  "carrier" TEXT, "trackingCode" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("orderId","shopId"), UNIQUE ("id","shopId")
);
CREATE INDEX "SellerOrder_shopId_createdAt_idx" ON "SellerOrder"("shopId","createdAt");
INSERT INTO "SellerOrder" ("id","orderId","shopId","shopName","status","createdAt")
SELECT 'so_' || md5(o."id" || ':' || si."shopId"), o."id", si."shopId", min(si."shopName"),
  CASE WHEN o."status"::text='CANCELLED' THEN 'CANCELLED'
       WHEN s."isPlatform" AND o."status"::text='DELIVERED' THEN 'DELIVERED'
       WHEN s."isPlatform" AND o."status"::text='SHIPPED' THEN 'SHIPPED' ELSE 'PENDING' END, o."createdAt"
FROM "ShopOrderItem" si JOIN "OrderItem" oi ON oi."id"=si."orderItemId"
JOIN "Order" o ON o."id"=oi."orderId" JOIN "Shop" s ON s."id"=si."shopId"
GROUP BY o."id",si."shopId",s."isPlatform";
UPDATE "SellerOrder" so SET "carrier"=sh."carrier", "trackingCode"=sh."trackingCode"
FROM "Shipment" sh, "Shop" s WHERE so."orderId"=sh."orderId" AND so."shopId"=s."id" AND s."isPlatform";
ALTER TABLE "ShopOrderItem" ADD COLUMN "sellerOrderId" TEXT;
UPDATE "ShopOrderItem" si SET "sellerOrderId"=so."id" FROM "OrderItem" oi, "SellerOrder" so
WHERE oi."id"=si."orderItemId" AND so."orderId"=oi."orderId" AND so."shopId"=si."shopId";
ALTER TABLE "ShopOrderItem" ALTER COLUMN "sellerOrderId" SET NOT NULL;
ALTER TABLE "ShopOrderItem" ADD CONSTRAINT "ShopOrderItem_sellerOrderId_shopId_fkey"
FOREIGN KEY ("sellerOrderId","shopId") REFERENCES "SellerOrder"("id","shopId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SellerOrderEvent" (
  "id" TEXT PRIMARY KEY, "sellerOrderId" TEXT NOT NULL REFERENCES "SellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status" TEXT NOT NULL, "reason" TEXT NOT NULL, "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "SellerOrderEvent_sellerOrderId_createdAt_idx" ON "SellerOrderEvent"("sellerOrderId","createdAt");
CREATE TABLE "SellerReturn" (
  "id" TEXT PRIMARY KEY, "sellerOrderId" TEXT NOT NULL UNIQUE REFERENCES "SellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'REQUESTED' CHECK ("status" IN ('REQUESTED','APPROVED','REJECTED','RECEIVED','CANCELLED')),
  "resolution" TEXT NOT NULL DEFAULT '', "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE OR REPLACE FUNCTION "snapshot_order_item_shop"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE shop_id TEXT; shop_name TEXT; seller_id TEXT;
BEGIN
  SELECT s."id",s."name" INTO shop_id,shop_name FROM "ShopProduct" sp JOIN "Shop" s ON s."id"=sp."shopId" WHERE sp."productId"=NEW."productId";
  IF NOT FOUND THEN RAISE EXCEPTION 'Product shop ownership is required'; END IF;
  seller_id := 'so_' || md5(NEW."orderId" || ':' || shop_id);
  INSERT INTO "SellerOrder" ("id","orderId","shopId","shopName") VALUES (seller_id,NEW."orderId",shop_id,shop_name)
    ON CONFLICT ("orderId","shopId") DO NOTHING;
  INSERT INTO "ShopOrderItem" ("orderItemId","shopId","shopName","sellerOrderId") VALUES (NEW."id",shop_id,shop_name,seller_id);
  RETURN NEW;
END;
$$;
-- Legacy Gadgify shipment writes must never update another shop's fulfillment.
CREATE FUNCTION "guard_platform_shipment"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "SellerOrder" so JOIN "Shop" s ON s."id"=so."shopId" WHERE so."orderId"=NEW."orderId" AND NOT s."isPlatform")
    THEN RAISE EXCEPTION 'Use shop-specific fulfillment for marketplace orders'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Shipment_platform_only" BEFORE INSERT OR UPDATE ON "Shipment"
FOR EACH ROW EXECUTE FUNCTION "guard_platform_shipment"();
CREATE FUNCTION "sync_platform_fulfillment"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "SellerOrder" so SET
    "status"=CASE WHEN NEW."status"::text='DELIVERED' THEN 'DELIVERED' WHEN NEW."status"::text IN ('IN_TRANSIT','OUT_FOR_DELIVERY','EXCEPTION') THEN 'SHIPPED' ELSE 'PENDING' END,
    "carrier"=NEW."carrier","trackingCode"=NEW."trackingCode","version"=so."version"+1,"updatedAt"=CURRENT_TIMESTAMP
  FROM "Shop" s WHERE so."orderId"=NEW."orderId" AND so."shopId"=s."id" AND s."isPlatform" AND so."status" <> 'CANCELLED';
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Shipment_sync_platform" AFTER INSERT OR UPDATE ON "Shipment"
FOR EACH ROW EXECUTE FUNCTION "sync_platform_fulfillment"();
CREATE FUNCTION "guard_order_cancellation"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status"::text='CANCELLED' AND OLD."status" IS DISTINCT FROM NEW."status" AND EXISTS (
    SELECT 1 FROM "SellerOrder" WHERE "orderId"=NEW."id" AND "status" IN ('PACKING','SHIPPED','DELIVERED'))
    THEN RAISE EXCEPTION 'Shop fulfillment has started; cancellation requires review'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Order_guard_shop_cancellation" BEFORE UPDATE OF "status" ON "Order"
FOR EACH ROW EXECUTE FUNCTION "guard_order_cancellation"();
CREATE FUNCTION "sync_order_cancellation"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status"::text='CANCELLED' AND OLD."status" IS DISTINCT FROM NEW."status" THEN
    UPDATE "SellerOrder" SET "status"='CANCELLED',"version"="version"+1,"updatedAt"=CURRENT_TIMESTAMP
    WHERE "orderId"=NEW."id" AND "status"='PENDING';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Order_sync_shop_cancellation" AFTER UPDATE OF "status" ON "Order"
FOR EACH ROW EXECUTE FUNCTION "sync_order_cancellation"();
-- Whole-order legacy returns remain available only for Gadgify-only orders.
CREATE FUNCTION "guard_platform_return"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "SellerOrder" so JOIN "Shop" s ON s."id"=so."shopId"
    WHERE so."orderId"=NEW."orderId" AND NOT s."isPlatform")
    THEN RAISE EXCEPTION 'Use shop-specific returns for marketplace orders'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ReturnRequest_platform_only" BEFORE INSERT ON "ReturnRequest"
FOR EACH ROW EXECUTE FUNCTION "guard_platform_return"();
COMMIT;
