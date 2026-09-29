# Product sizes, options and bundles

Current catalog products have one price and one stock count per product. Colors are display attributes; the current cart and order records do not identify a selected color, size, pack or SKU. Do not represent size-specific inventory using the parent product stock field.

## Required commerce behavior

- A product without selectable options continues to use the existing product price and stock fields.
- A variant is a sellable SKU with a stable identifier, seller-scoped ownership where applicable, selected attributes, price (defaulting to the product price when unchanged), active state and its own stock count.
- Apparel and footwear sizes are seller-entered options; support labels such as XS–XXL and numeric shoe sizes without assuming a universal sizing standard. Show size guidance only when supplied by the seller.
- Sports products can use attributes such as sport, material/type, size, pack quantity and included pieces. A bat, tennis ball, cork ball, leather ball, kit and T-shirt can each be a simple product or a product family with explicit variants. A kit must clearly list what it includes; it must not be modeled as a quantity multiplier or imply separate items that are not stocked.
- Require customers to select all required options before adding a variant to cart. Show availability for the chosen variant, disable unavailable choices, and validate the exact SKU stock again during checkout.
- Cart rows and immutable order-item snapshots must preserve variant/SKU identity, selected option labels and the charged unit price. Stock reservation, cancellation/restock and seller fulfillment must operate on the exact variant within the existing transaction and shop-ownership guards.
- Product cards may show overall availability derived from eligible variant stock, but must not promise a size/material is available before selection. “Limited stock” is presentation only; checkout remains authoritative.

## Rollout gates

Implement as a prepared schema migration plus coordinated API, cart, checkout, order history, admin and seller editor changes. Preserve existing product-only records and historical order snapshots. Keep external-shop checkout and financial rules unchanged. Apply/regenerate/verify only through the owner's migration rollout.

Medicines stay excluded from active seller/publication/purchase flows until the owner approves the catalog scope and qualified review confirms applicable licensing, prescription validation, age/identity checks, storage/fulfillment, privacy, payment, returns and customer-support requirements. Do not infer that a category name or seller attestation alone makes a medicine listing eligible.
