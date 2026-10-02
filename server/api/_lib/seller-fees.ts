export type SellerFeeTerms = { type: 'FIXED_PER_UNIT' | 'PERCENTAGE'; value: number; version: number }
export type FeeLine = { productId: string; quantity: number; unitPriceMinor: number }

export function allocateDiscount(lines: readonly FeeLine[], discountMinor: number) {
  const totals = lines.map(line => line.quantity * line.unitPriceMinor)
  const subtotal = totals.reduce((sum, value) => sum + value, 0)
  if (!Number.isSafeInteger(discountMinor) || discountMinor < 0 || discountMinor > subtotal)
    throw new Error('Discount is outside the item subtotal.')
  if (!subtotal || !discountMinor) return totals.map(() => 0)
  const denominator = BigInt(subtotal), discount = BigInt(discountMinor)
  const shares = totals.map(total => discount * BigInt(total))
  const allocations = shares.map(share => Number(share / denominator))
  let remainder = discountMinor - allocations.reduce((sum, value) => sum + value, 0)
  const priority = shares.map((share, index) => ({ index, remainder: share % denominator, id: lines[index].productId }))
    .sort((a, b) => a.remainder === b.remainder ? a.id.localeCompare(b.id) : a.remainder > b.remainder ? -1 : 1)
  for (const item of priority) {
    if (!remainder) break
    allocations[item.index] += 1
    remainder -= 1
  }
  return allocations
}

export function sellerFeeAmount(terms: SellerFeeTerms | null | undefined, quantity: number, unitPriceMinor: number, discountMinor: number) {
  if (!terms) return { baseMinor: Math.max(0, quantity * unitPriceMinor - discountMinor), amountMinor: 0 }
  const baseMinor = Math.max(0, quantity * unitPriceMinor - discountMinor)
  const amountMinor = terms.type === 'FIXED_PER_UNIT'
    ? terms.value * quantity
    : Math.floor((baseMinor * terms.value + 5000) / 10000)
  if (![baseMinor, amountMinor].every(Number.isSafeInteger) || amountMinor > 2_147_483_647)
    throw new Error('Seller fee exceeds the supported order amount.')
  if (amountMinor > baseMinor) throw new Error('This discount would reduce the item price below the agreed per-unit fee.')
  return { baseMinor, amountMinor }
}
