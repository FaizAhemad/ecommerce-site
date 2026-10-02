import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { changeCoupon, getCoupons, type Coupon, type CouponInput } from '../api/coupons'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { Checkbox } from './mui/Checkbox'
import { Chip } from './mui/Chip'
import { CircularProgress } from './mui/CircularProgress'
import { FormControl } from './mui/FormControl'
import { FormControlLabel } from './mui/FormControlLabel'
import { InputLabel } from './mui/InputLabel'
import { MenuItem } from './mui/MenuItem'
import { Paper } from './mui/Paper'
import { Select } from './mui/Select'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

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
    <Stack spacing={2}>
      <Alert severity="info">
        Configure coupons for India / INR. Only explicitly activated coupons can be used.
        One coupon applies to items per order; delivery is not discounted. Orders consume a use
        when recorded, including unpaid, cancelled and refunded orders. Discounted orders must
        retain a payable total of at least ₹1. Choose the approved tax treatment before activation.
      </Alert>
      <Button variant="contained" sx={{ alignSelf: 'flex-start' }}
        disabled={busy}
        onClick={() => {
          setSelected(null)
          setNewDraft((value) => value + 1)
          setArchiveCode(null)
          setFormOpen(true)
        }}
      >
        New coupon
      </Button>
      <FormDialog open={formOpen} title={selected ? `Edit ${selected.code}` : 'Create coupon'} busy={busy} onClose={() => setFormOpen(false)}>
      <CouponForm
        key={selected ? `${selected.code}:${selected.version}` : `new:${newDraft}`}
        initial={selected}
        busy={busy}
        save={(input) => void mutate(input)}
      />
      </FormDialog>
      <Typography component="h2" variant="h6">Saved coupons</Typography>
      {query.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 2 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading coupons…</Typography></Stack>}
      {query.isError && (
        <Alert severity="error" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Reload coupons</Button>}>Unable to load {coupons.length ? 'more coupons' : 'coupons'}.</Alert>
      )}
      {!query.isPending && !query.isError && !coupons.length && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No coupon drafts recorded</Typography></Paper>}
      {coupons.map((coupon) => (
        <Card variant="outlined" component="article" key={coupon.code} sx={{ p: { xs: 2, sm: 2.5 } }}><Stack spacing={1.25}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Typography component="h3" variant="h6">{coupon.code}</Typography>
            <Chip size="small" label={coupon.status === 'ARCHIVED' ? 'Archived' : coupon.status === 'ACTIVE' ? 'Active' : 'Draft'} color={coupon.status === 'ACTIVE' ? 'success' : coupon.status === 'ARCHIVED' ? 'default' : 'warning'} />
          </Stack>
          <Typography>
            {coupon.type === 'PERCENT'
              ? `${coupon.value / 100}% off, capped at ₹${coupon.maxDiscountMinor / 100}`
              : `₹${coupon.value / 100} off`}{' '}
            · Minimum items subtotal ₹{coupon.minSubtotalMinor / 100}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(coupon.startsAt).toLocaleString()} –{' '}
            {new Date(coupon.endsAt).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configured limits: {coupon.usageLimit} total, {coupon.perCustomerLimit} per customer.
            Version {coupon.version}.
            {' '}Recorded uses: {coupon.used ?? 0}.
          </Typography>
          {coupon.status !== 'ARCHIVED' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined"
                disabled={busy}
                onClick={() => {
                  setSelected(coupon)
                  setArchiveCode(null)
                  setFormOpen(true)
                }}
              >
                Edit
              </Button>
              {archiveCode === coupon.code ? (
                <>
                  <Alert severity="warning">Archive this code? It cannot be reused.</Alert>
                  <Button variant="outlined"
                    disabled={busy}
                    onClick={() =>
                      void mutate({ code: coupon.code, expectedVersion: coupon.version }, true)
                    }
                  >
                    Confirm archive
                  </Button>
                  <Button variant="outlined"
                    disabled={busy}
                    onClick={() => setArchiveCode(null)}
                  >
                    Keep coupon
                  </Button>
                </>
              ) : (
                <Button variant="outlined"
                  disabled={busy}
                  onClick={() => setArchiveCode(coupon.code)}
                >
                  Archive
                </Button>
              )}
            </Stack>
          )}
        </Stack></Card>
      ))}
      {query.hasNextPage && (
        <Button variant="outlined" sx={{ alignSelf: 'flex-start' }}
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage({ cancelRefetch: false })}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load more coupons'}
        </Button>
      )}
    </Stack>
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
    <Stack component="form" spacing={2} onSubmit={submit}>
      <TextField name="code" label="Coupon code" defaultValue={initial?.code ?? ''} required slotProps={{ htmlInput: { minLength: 3, maxLength: 32, pattern: '[A-Za-z0-9][A-Za-z0-9_\\-]{2,31}' } }} disabled={busy || Boolean(initial)} />
      <FormControl fullWidth disabled={busy}><InputLabel id="coupon-type-label">Discount type</InputLabel><Select labelId="coupon-type-label" label="Discount type" value={type} onChange={(event) => setType(event.target.value as 'FIXED' | 'PERCENT')}><MenuItem value="FIXED">Fixed amount (₹)</MenuItem><MenuItem value="PERCENT">Percentage</MenuItem></Select></FormControl>
      <TextField name="value" label={type === 'PERCENT' ? 'Discount (%)' : 'Discount (₹)'} type="number" slotProps={{ htmlInput: { min: 0.01, max: type === 'PERCENT' ? 100 : 100000, step: 0.01 } }} defaultValue={initial ? initial.value / 100 : ''} required disabled={busy} />
      <TextField name="minimum" label="Minimum items subtotal (₹)" type="number" slotProps={{ htmlInput: { min: 0, max: 1000000, step: 0.01 } }} defaultValue={initial ? initial.minSubtotalMinor / 100 : ''} required disabled={busy} />
      {type === 'PERCENT' && <TextField name="cap" label="Maximum discount (₹)" type="number" slotProps={{ htmlInput: { min: 0.01, max: 100000, step: 0.01 } }} defaultValue={initial ? initial.maxDiscountMinor / 100 : ''} required disabled={busy} />}
      <TextField name="startsAt" label="Starts (your local time)" type="datetime-local" defaultValue={localDate(initial?.startsAt)} required disabled={busy} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField name="endsAt" label="Ends (your local time)" type="datetime-local" defaultValue={localDate(initial?.endsAt)} required disabled={busy} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField name="totalUses" label="Total usage limit" type="number" slotProps={{ htmlInput: { min: 1, max: 1000000, step: 1 } }} defaultValue={initial?.usageLimit ?? ''} required disabled={busy} />
      <TextField name="customerUses" label="Per-customer limit" type="number" slotProps={{ htmlInput: { min: 1, max: 1000000, step: 1 } }} defaultValue={initial?.perCustomerLimit ?? ''} required disabled={busy} />
      <FormControl fullWidth disabled={busy}><InputLabel id="coupon-tax-label">Tax treatment</InputLabel><Select name="taxTreatment" labelId="coupon-tax-label" label="Tax treatment" defaultValue={initial?.taxTreatment ?? ''}><MenuItem value="">Choose before activating</MenuItem><MenuItem value="BEFORE_TAX">Calculate configured tax after discount</MenuItem><MenuItem value="AFTER_TAX">Keep tax on original items subtotal</MenuItem></Select></FormControl>
      <FormControlLabel control={<Checkbox name="active" defaultChecked={initial?.status === 'ACTIVE'} disabled={busy} />} label="Activate within these dates" />
      <FormControlLabel control={<Checkbox name="approved" disabled={busy} />} label="I approve these amounts, tax treatment and usage terms for this store." />
      <Button type="submit" variant="contained" disabled={busy}>
        {busy ? 'Saving…' : 'Save coupon'}
      </Button>
    </Stack>
  )
}
