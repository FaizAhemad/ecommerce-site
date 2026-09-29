export type CheckoutRules = { enabled: boolean; shippingMinor: number; taxBps: number }
export class CheckoutDiscountError extends Error {}
export function checkoutRules(value: string | undefined): CheckoutRules | null {
  try {
    const rules = JSON.parse(value ?? 'null') as Record<string, unknown> | null
    const taxBps = rules?.taxBps === undefined ? 0 : rules.taxBps
    if (
      !rules ||
      typeof rules.enabled !== 'boolean' ||
      !Number.isSafeInteger(taxBps) ||
      Number(taxBps) < 0 ||
      Number(taxBps) > 10000
    )
      return null
    // Delivery is product-specific. Ignore the legacy flat order fee in stored settings.
    return { enabled: rules.enabled, shippingMinor: 0, taxBps: Number(taxBps) }
  } catch {
    return null
  }
}
export function checkoutTotal(subtotalMinor: number, rules: CheckoutRules, discountMinor = 0, taxTreatment?: 'BEFORE_TAX' | 'AFTER_TAX', shippingMinor = rules.shippingMinor) {
  if (!Number.isSafeInteger(discountMinor) || discountMinor < 0 || discountMinor > subtotalMinor || (discountMinor > 0 && !taxTreatment))
    throw new Error('Invalid discount')
  const taxableMinor = taxTreatment === 'BEFORE_TAX' ? subtotalMinor - discountMinor : subtotalMinor
  const taxMinor = Math.round((taxableMinor * rules.taxBps) / 10000)
  const totalMinor = subtotalMinor - discountMinor + shippingMinor + taxMinor
  if (discountMinor > 0 && totalMinor < 100)
    throw new CheckoutDiscountError('This coupon leaves less than ₹1 payable. Remove the coupon or update your cart.')
  if (
    !Number.isSafeInteger(subtotalMinor) ||
    subtotalMinor < 1 ||
    !Number.isSafeInteger(totalMinor) ||
    totalMinor > 2147483647
  )
    throw new Error('Invalid checkout amount')
  return {
    subtotalMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
    currency: 'INR',
  }
}
