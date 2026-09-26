ALTER TABLE "Product"
ADD COLUMN "compareAtPriceMinor" INTEGER;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_compareAtPriceMinor_gt_priceMinor"
CHECK ("compareAtPriceMinor" IS NULL OR "compareAtPriceMinor" > "priceMinor");
