import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Checkbox } from './mui/Checkbox'
import { CircularProgress } from './mui/CircularProgress'
import { FormControlLabel } from './mui/FormControlLabel'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
type Rules = { enabled: boolean; shippingMinor: number; taxBps: number }
export function CheckoutSettings() {
  const query = useQuery({
    queryKey: privateKey('admin', 'settings'),
    queryFn: async ({ signal }) => {
      const response = await apiFetch('/api/admin/settings', { signal })
      if (!response.ok) throw new Error('Unable to load settings.')
      return (await response.json()) as { settings: { key: string; value: string }[] }
    },
    retry: false,
  })
  if (query.isPending) return <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading checkout settings…</Typography></Stack>
  if (query.isError)
    return (
      <Alert severity="error" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load checkout settings.</Alert>
    )
  const value = query.data?.settings.find((setting) => setting.key === 'checkout')?.value
  let rules: Rules | undefined
  try {
    rules = value ? (JSON.parse(value) as Rules) : undefined
  } catch {
    rules = undefined
  }
  return (
    <CheckoutSettingsForm
      key={value ?? 'new'}
      initial={rules}
      saved={() => void query.refetch({ cancelRefetch: false })}
    />
  )
}
function CheckoutSettingsForm({ initial, saved }: { initial?: Rules; saved: () => void }) {
  const notify = useNotification(),
    lock = useRef(false),
    controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  useEffect(() => () => controller.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current) return
    const fields = new FormData(event.currentTarget)
    const tax = String(fields.get('tax') ?? '').trim()
    if (tax && !/^\d+(\.\d{1,2})?$/.test(tax)) {
      notify('Enter tax with at most two decimal places.')
      return
    }
    const rules = {
      enabled: fields.get('enabled') === 'on',
      shippingMinor: 0,
      taxBps: tax ? Math.round(Number(tax) * 100) : 0,
    }
    lock.current = true
    setPending(true)
    const abort = new AbortController()
    controller.current = abort
    try {
      const response = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout: JSON.stringify(rules) }),
      })
      const body = (await response.json()) as { error?: { message?: string } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to save checkout settings.')
      if (!abort.signal.aborted) {
        notify('Checkout settings saved.', 'success')
        saved()
      }
    } catch (error) {
      if (!abort.signal.aborted)
        notify(error instanceof Error ? error : new Error('Unable to save settings.'))
    } finally {
      lock.current = false
      if (!abort.signal.aborted) setPending(false)
    }
  }
  return (
    <Paper component="form" variant="outlined" onSubmit={(event) => void submit(event)} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 720 }}>
      <Stack spacing={2}>
      <Typography component="h2" variant="h6">Online checkout · India / INR</Typography>
      <Typography color="text.secondary">
        Delivery is free at launch. Tax is optional and defaults to 0%. Regional delivery quotes
        will remain disabled until dispatch coverage and carrier rates are configured.
      </Typography>
      <Alert severity="info">No per-item or order-level delivery fee is charged currently. Delivery will be quoted once per shipment after regional rates are configured.</Alert>
      <TextField name="tax" label="Tax (%) · optional" type="number" slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }} defaultValue={initial ? initial.taxBps / 100 : ''} disabled={pending} sx={{ maxWidth: 320 }} />
      <FormControlLabel control={<Checkbox name="enabled" defaultChecked={initial?.enabled ?? false} disabled={pending} />} label="Enable checkout after charges, policies and Razorpay configuration are approved" />
      <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: 'flex-start' }}>
        {pending ? 'Saving…' : 'Save checkout settings'}
      </Button>
      </Stack>
    </Paper>
  )
}
