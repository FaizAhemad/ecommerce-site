type Props = {
  subtotalMinor?: number
  shippingMinor?: number
  taxMinor?: number
  discountMinor?: number
  totalMinor?: number
}
/** Display server-provided INR amounts; never calculate payable totals here. */
export function OrderTotals({ subtotalMinor, shippingMinor, taxMinor, discountMinor, totalMinor }: Props) {
  const money = (value: number | undefined) => value === undefined ? 'Unavailable' :
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100)
  return <dl className="my-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 sm:px-4">
    <div className="flex justify-between gap-4 border-b border-[var(--line)] py-3 text-sm text-[var(--muted)]"><dt>Items subtotal</dt><dd className="m-0 text-right tabular-nums text-[var(--ink)]">{money(subtotalMinor)}</dd></div>
    {!!discountMinor && <div className="flex justify-between gap-4 border-b border-[var(--line)] py-3 text-sm text-[var(--muted)]"><dt>Coupon discount</dt><dd className="m-0 text-right tabular-nums text-[var(--ink)]">−{money(discountMinor)}</dd></div>}
    <div className="flex justify-between gap-4 border-b border-[var(--line)] py-3 text-sm text-[var(--muted)]"><dt>Delivery</dt><dd className="m-0 text-right tabular-nums text-[var(--ink)]">{money(shippingMinor)}</dd></div>
    <div className="flex justify-between gap-4 border-b border-[var(--line)] py-3 text-sm text-[var(--muted)]"><dt>Tax</dt><dd className="m-0 text-right tabular-nums text-[var(--ink)]">{money(taxMinor)}</dd></div>
    <div className="flex justify-between gap-4 py-4 text-base font-semibold text-[var(--ink)]"><dt>Total payable</dt><dd className="m-0 text-right tabular-nums">{money(totalMinor)}</dd></div>
  </dl>
}
