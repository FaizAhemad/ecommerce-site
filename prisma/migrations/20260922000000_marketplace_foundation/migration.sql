-- Owner-applied only. Existing commerce remains single-store until marketplace rollout.
BEGIN;
LOCK TABLE "Product", "OrderItem" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE "Shop" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL CHECK (length("name") BETWEEN 1 AND 120),
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','APPROVED','REJECTED','SUSPENDED')),
  "isPlatform" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Shop_one_platform_idx" ON "Shop" ("isPlatform") WHERE "isPlatform" = TRUE;
CREATE TABLE "ShopMembership" (
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','ACTIVE','REVOKED')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("shopId", "userId")
);
CREATE INDEX "ShopMembership_userId_status_idx" ON "ShopMembership" ("userId", "status");
CREATE TABLE "ShopProduct" (
  "productId" TEXT PRIMARY KEY REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "moderationStatus" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("moderationStatus" IN ('DRAFT','PENDING','APPROVED','REJECTED')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ShopProduct_shopId_moderationStatus_idx" ON "ShopProduct" ("shopId", "moderationStatus");
CREATE TABLE "ShopOrderItem" (
  "orderItemId" TEXT PRIMARY KEY REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "shopName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ShopOrderItem_shopId_idx" ON "ShopOrderItem" ("shopId");

INSERT INTO "Shop" ("id", "slug", "name", "status", "isPlatform")
VALUES ('gadgify-platform', 'gadgify', 'Gadgify', 'APPROVED', TRUE);
INSERT INTO "ShopProduct" ("productId", "shopId", "moderationStatus")
SELECT "id", 'gadgify-platform', 'APPROVED' FROM "Product";
INSERT INTO "ShopOrderItem" ("orderItemId", "shopId", "shopName")
SELECT "id", 'gadgify-platform', 'Gadgify' FROM "OrderItem";

-- Preserve compatibility with existing platform-only product creation.
-- Future seller creation MUST replace this mapping in the same transaction,
-- with isActive=false until marketplace moderation/checkout gates are enabled.
CREATE FUNCTION "map_platform_product"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "ShopProduct" ("productId", "shopId", "moderationStatus")
  VALUES (NEW."id", 'gadgify-platform', 'APPROVED');
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Product_platform_ownership" AFTER INSERT ON "Product"
FOR EACH ROW EXECUTE FUNCTION "map_platform_product"();

CREATE FUNCTION "snapshot_order_item_shop"() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "ShopOrderItem" ("orderItemId", "shopId", "shopName")
  SELECT NEW."id", s."id", s."name" FROM "ShopProduct" sp
  JOIN "Shop" s ON s."id" = sp."shopId" WHERE sp."productId" = NEW."productId";
  IF NOT FOUND THEN RAISE EXCEPTION 'Product shop ownership is required'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "OrderItem_shop_snapshot" AFTER INSERT ON "OrderItem"
FOR EACH ROW EXECUTE FUNCTION "snapshot_order_item_shop"();
COMMIT;
