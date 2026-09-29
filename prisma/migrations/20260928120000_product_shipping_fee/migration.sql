-- Product delivery fees are optional until an owner configures them.
-- Checkout must stay unavailable for a cart containing an unconfigured product.
ALTER TABLE "Product" ADD COLUMN "shippingFeeMinor" INTEGER;

-- Snapshot the per-unit fee with each order item so later product edits do not alter order history.
ALTER TABLE "OrderItem" ADD COLUMN "shippingFeeMinor" INTEGER NOT NULL DEFAULT 0;
