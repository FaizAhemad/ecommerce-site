export type CheckoutRules = { enabled: boolean; shippingMinor: number; taxBps: number }
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
export function checkoutTotal(subtotalMinor: number, rules: CheckoutRules) {
  const taxMinor = Math.round((subtotalMinor * rules.taxBps) / 10000)
  const totalMinor = subtotalMinor + rules.shippingMinor + taxMinor
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
