import './OrderTotals.css'
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
  return <dl className="order-totals">
    <div><dt>Items subtotal</dt><dd>{money(subtotalMinor)}</dd></div>
    {!!discountMinor && <div><dt>Coupon discount</dt><dd>-{money(discountMinor)}</dd></div>}
    <div><dt>Delivery</dt><dd>{money(shippingMinor)}</dd></div>
    <div><dt>Tax</dt><dd>{money(taxMinor)}</dd></div>
    <div className="order-totals-payable"><dt>Total payable</dt><dd>{money(totalMinor)}</dd></div>
  </dl>
}
