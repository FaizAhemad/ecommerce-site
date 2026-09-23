export type CheckoutRules = { enabled: boolean; shippingMinor: number; taxBps: number }
export class CheckoutDiscountError extends Error {}
export function checkoutRules(value: string | undefined): CheckoutRules | null {
  try {
    const rules = JSON.parse(value ?? 'null') as Record<string, unknown> | null
    if (
      !rules ||
      typeof rules.enabled !== 'boolean' ||
      !Number.isSafeInteger(rules.shippingMinor) ||
      Number(rules.shippingMinor) < 0 ||
      Number(rules.shippingMinor) > 10000000 ||
      !Number.isSafeInteger(rules.taxBps) ||
      Number(rules.taxBps) < 0 ||
      Number(rules.taxBps) > 10000
    )
      return null
    return rules as CheckoutRules
  } catch {
    return null
  }
}
export function checkoutTotal(subtotalMinor: number, rules: CheckoutRules, discountMinor = 0, taxTreatment?: 'BEFORE_TAX' | 'AFTER_TAX') {
  if (!Number.isSafeInteger(discountMinor) || discountMinor < 0 || discountMinor > subtotalMinor || (discountMinor > 0 && !taxTreatment))
    throw new Error('Invalid discount')
  const taxableMinor = taxTreatment === 'BEFORE_TAX' ? subtotalMinor - discountMinor : subtotalMinor
  const taxMinor = Math.round((taxableMinor * rules.taxBps) / 10000)
  const totalMinor = subtotalMinor - discountMinor + rules.shippingMinor + taxMinor
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
    shippingMinor: rules.shippingMinor,
    taxMinor,
    totalMinor,
    currency: 'INR',
  }
}
