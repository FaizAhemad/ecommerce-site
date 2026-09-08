CREATE TABLE "Category" (
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("name")
);

INSERT INTO "Category" ("name", "sortOrder") VALUES
('Clothing', 0), ('Sports', 1), ('Home & Kitchen', 2), ('Furniture', 3),
('Footwear', 4), ('Jewelry', 5), ('Accessories', 6), ('Watches', 7),
('Electronics', 8), ('Toys', 9);

-- Preserve every category already assigned to a product, including legacy names.
INSERT INTO "Category" ("name", "sortOrder")
SELECT DISTINCT "category", 10 FROM "Product"
ON CONFLICT ("name") DO NOTHING;

ALTER TABLE "Product" ADD CONSTRAINT "Product_category_fkey"
FOREIGN KEY ("category") REFERENCES "Category"("name")
ON DELETE RESTRICT ON UPDATE CASCADE;
