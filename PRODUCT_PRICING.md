# Product pricing presentation

The catalog's `priceMinor` remains the current selling price and the only amount used by carts, checkout, order snapshots and payment totals. `compareAtPriceMinor` is optional presentation data: when it is greater than `priceMinor`, storefront cards may show the current price, a struck-through original price and the rounded percentage difference. Null or invalid values produce no sale treatment. The UI never calculates or changes the amount charged from this field.

Gadgify's admin product editor and seller catalog drafts accept the optional original price. API validation requires it to be an integer number of minor currency units greater than the selling price; the prepared database constraint enforces the same invariant. Existing seller draft JSON without this property remains valid and reads as no original price.

Rollout prerequisite: apply `prisma/migrations/20260925120000_product_compare_price/migration.sql` and regenerate Prisma Client from the updated schema before deploying code that reads or writes this field. The owner has deferred migrations, generation and production acceptance; no rollout is claimed.
