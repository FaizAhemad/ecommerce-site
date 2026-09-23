import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { changeCoupon, getCoupons, type Coupon, type CouponInput } from '../api/coupons'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'

function localDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
export function CouponManager() {
  const notify = useNotification()
  const [formOpen, setFormOpen] = useState(false)
  const lock = useRef(false),
    controller = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Coupon | null>(null)
  const [archiveCode, setArchiveCode] = useState<string | null>(null),
    [newDraft, setNewDraft] = useState(0)
  const query = useInfiniteQuery({
    queryKey: privateKey('admin', 'coupons'),
    initialPageParam: 0,
    queryFn: ({ signal, pageParam }) => getCoupons(pageParam, signal),
    getNextPageParam: (page) => page.nextPage ?? undefined,
    retry: false,
  })
  useEffect(() => () => controller.current?.abort(), [])
  const coupons = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.coupons) ?? []).map((coupon) => [
        coupon.code,
        coupon,
      ]),
    ).values(),
  ]
  async function mutate(
    input: CouponInput | { code: string; expectedVersion: number },
    archive = false,
  ) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    const abort = new AbortController()
    controller.current = abort
    try {
      const coupon = await changeCoupon(input, archive, abort.signal)
      if (abort.signal.aborted) return
      if (!archive) setSelected(coupon)
      else if (selected?.code === coupon.code) {
        setSelected(null)
        setNewDraft((value) => value + 1)
      }
      setArchiveCode(null)
      setFormOpen(false)
      void queryClient.invalidateQueries({ queryKey: privateKey('admin', 'coupons') })
      notify(
        archive
          ? 'Coupon archived. Its history is retained.'
          : coupon.status === 'ACTIVE' ? 'Coupon activated for its configured dates.' : 'Coupon draft saved.',
        'success',
      )
    } catch (error) {
      if (!abort.signal.aborted)
        notify(error instanceof Error ? error : new Error('Unable to save the coupon.'))
    } finally {
      lock.current = false
      if (!abort.signal.aborted) setBusy(false)
    }
  }
  return (
    <>
      <p>
        Configure coupons for India / INR. Only explicitly activated coupons can be used.
        One coupon applies to items per order; delivery is not discounted. Orders consume a use
        when recorded, including unpaid, cancelled and refunded orders. Discounted orders must
        retain a payable total of at least ₹1. Choose the approved tax treatment before activation.
      </p>
      <button
        className="secondary-button"
        disabled={busy}
        onClick={() => {
          setSelected(null)
          setNewDraft((value) => value + 1)
          setArchiveCode(null)
          setFormOpen(true)
        }}
      >
        New coupon
      </button>
      <FormDialog open={formOpen} title={selected ? `Edit ${selected.code}` : 'Create coupon'} busy={busy} onClose={() => setFormOpen(false)}>
      <CouponForm
        key={selected ? `${selected.code}:${selected.version}` : `new:${newDraft}`}
        initial={selected}
        busy={busy}
        save={(input) => void mutate(input)}
      />
      </FormDialog>
      <h3>Saved coupons</h3>
      {query.isPending && <p role="status">Loading coupons…</p>}
      {query.isError && (
        <div role="alert">
          <p>Unable to load {coupons.length ? 'more coupons' : 'coupons'}.</p>
          <button
            className="secondary-button"
            disabled={query.isFetching}
            onClick={() => void query.refetch({ cancelRefetch: false })}
          >
            Reload coupons
          </button>
        </div>
      )}
      {!query.isPending && !query.isError && !coupons.length && <p>No coupon drafts recorded.</p>}
      {coupons.map((coupon) => (
        <article className="record-card" key={coupon.code}>
          <h4>
            {coupon.code} · {coupon.status === 'ARCHIVED' ? 'Archived' : coupon.status === 'ACTIVE' ? 'Active' : 'Draft'}
          </h4>
          <p>
            {coupon.type === 'PERCENT'
              ? `${coupon.value / 100}% off, capped at ₹${coupon.maxDiscountMinor / 100}`
              : `₹${coupon.value / 100} off`}{' '}
            · Minimum items subtotal ₹{coupon.minSubtotalMinor / 100}
          </p>
          <p>
            {new Date(coupon.startsAt).toLocaleString()} –{' '}
            {new Date(coupon.endsAt).toLocaleString()}
          </p>
          <p>
            Configured limits: {coupon.usageLimit} total, {coupon.perCustomerLimit} per customer.
            Version {coupon.version}.
            {' '}Recorded uses: {coupon.used ?? 0}.
          </p>
          {coupon.status !== 'ARCHIVED' && (
            <div className="profile-actions">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => {
                  setSelected(coupon)
                  setArchiveCode(null)
                  setFormOpen(true)
                }}
              >
                Edit
              </button>
              {archiveCode === coupon.code ? (
                <>
                  <span>Archive this code? It cannot be reused.</span>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void mutate({ code: coupon.code, expectedVersion: coupon.version }, true)
                    }
                  >
                    Confirm archive
                  </button>
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => setArchiveCode(null)}
                  >
                    Keep coupon
                  </button>
                </>
              ) : (
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => setArchiveCode(coupon.code)}
                >
                  Archive
                </button>
              )}
            </div>
          )}
        </article>
      ))}
      {query.hasNextPage && (
        <button
          className="secondary-button"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage({ cancelRefetch: false })}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load more coupons'}
        </button>
      )}
    </>
  )
}
function CouponForm({
  initial,
  busy,
  save,
}: {
  initial: Coupon | null
  busy: boolean
  save: (input: CouponInput) => void
}) {
  const notify = useNotification()
  const [type, setType] = useState<'FIXED' | 'PERCENT'>(initial?.type ?? 'FIXED')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const fields = new FormData(event.currentTarget)
    const amount = (name: string) => {
      const value = String(fields.get(name) ?? '')
      if (!/^\d+(?:\.\d{1,2})?$/.test(value))
        throw new Error('Enter amounts with at most two decimal places.')
      return Math.round(Number(value) * 100)
    }
    try {
      const value = amount('value')
      save({
        code: initial?.code ?? String(fields.get('code') ?? ''),
        type,
        value,
        minSubtotalMinor: amount('minimum'),
        maxDiscountMinor: type === 'FIXED' ? value : amount('cap'),
        usageLimit: Number(fields.get('totalUses')),
        perCustomerLimit: Number(fields.get('customerUses')),
        startsAt: new Date(String(fields.get('startsAt'))).toISOString(),
        endsAt: new Date(String(fields.get('endsAt'))).toISOString(),
        expectedVersion: initial?.version ?? 0,
        status: fields.get('active') === 'on' ? 'ACTIVE' : 'DRAFT',
        approved: fields.get('approved') === 'on',
        taxTreatment: fields.get('taxTreatment') === 'BEFORE_TAX' ? 'BEFORE_TAX' : fields.get('taxTreatment') === 'AFTER_TAX' ? 'AFTER_TAX' : undefined,
      })
    } catch (error) {
      notify(error instanceof Error ? error : new Error('Check the coupon fields.'))
    }
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <label>
        Coupon code
        <input
          name="code"
          defaultValue={initial?.code ?? ''}
          required
          minLength={3}
          maxLength={32}
          pattern={'[A-Za-z0-9][A-Za-z0-9_\\-]{2,31}'}
          disabled={busy || Boolean(initial)}
        />
      </label>
      <label>
        Discount type
        <select
          value={type}
          disabled={busy}
          onChange={(event) => setType(event.target.value as 'FIXED' | 'PERCENT')}
        >
          <option value="FIXED">Fixed amount (₹)</option>
          <option value="PERCENT">Percentage</option>
        </select>
      </label>
      <label>
        {type === 'PERCENT' ? 'Discount (%)' : 'Discount (₹)'}
        <input
          name="value"
          type="number"
          min="0.01"
          max={type === 'PERCENT' ? 100 : 100000}
          step="0.01"
          defaultValue={initial ? initial.value / 100 : ''}
          required
          disabled={busy}
        />
      </label>
      <label>
        Minimum items subtotal (₹)
        <input
          name="minimum"
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          defaultValue={initial ? initial.minSubtotalMinor / 100 : ''}
          required
          disabled={busy}
        />
      </label>
      {type === 'PERCENT' && (
        <label>
          Maximum discount (₹)
          <input
            name="cap"
            type="number"
            min="0.01"
            max="100000"
            step="0.01"
            defaultValue={initial ? initial.maxDiscountMinor / 100 : ''}
            required
            disabled={busy}
          />
        </label>
      )}
      <label>
        Starts (your local time)
        <input
          name="startsAt"
          type="datetime-local"
          defaultValue={localDate(initial?.startsAt)}
          required
          disabled={busy}
        />
      </label>
      <label>
        Ends (your local time)
        <input
          name="endsAt"
          type="datetime-local"
          defaultValue={localDate(initial?.endsAt)}
          required
          disabled={busy}
        />
      </label>
      <label>
        Total usage limit
        <input
          name="totalUses"
          type="number"
          min="1"
          max="1000000"
          step="1"
          defaultValue={initial?.usageLimit ?? ''}
          required
          disabled={busy}
        />
      </label>
      <label>
        Per-customer limit
        <input
          name="customerUses"
          type="number"
          min="1"
          max="1000000"
          step="1"
          defaultValue={initial?.perCustomerLimit ?? ''}
          required
          disabled={busy}
        />
      </label>
      <label>
        Tax treatment
        <select name="taxTreatment" defaultValue={initial?.taxTreatment ?? ''} disabled={busy}>
          <option value="">Choose before activating</option>
          <option value="BEFORE_TAX">Calculate configured tax after discount</option>
          <option value="AFTER_TAX">Keep tax on original items subtotal</option>
        </select>
      </label>
      <label><input type="checkbox" name="active" defaultChecked={initial?.status === 'ACTIVE'} disabled={busy} /> Activate within these dates</label>
      <label><input type="checkbox" name="approved" disabled={busy} /> I approve these amounts, tax treatment and usage terms for this store.</label>
      <button className="primary-button" disabled={busy}>
        {busy ? 'Saving…' : 'Save coupon'}
      </button>
    </form>
  )
}
