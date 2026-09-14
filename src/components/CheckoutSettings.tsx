import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
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
  if (query.isPending) return <p role="status">Loading checkout settings…</p>
  if (query.isError)
    return (
      <div role="alert">
        <p>Unable to load settings.</p>
        <button
          className="secondary-button"
          disabled={query.isFetching}
          onClick={() => void query.refetch({ cancelRefetch: false })}
        >
          Retry
        </button>
      </div>
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
    const shipping = String(fields.get('shipping') ?? ''),
      tax = String(fields.get('tax') ?? '')
    if (!/^\d+(\.\d{1,2})?$/.test(shipping) || !/^\d+(\.\d{1,2})?$/.test(tax)) {
      notify('Enter delivery charges and tax with at most two decimal places.')
      return
    }
    const rules = {
      enabled: fields.get('enabled') === 'on',
      shippingMinor: Math.round(Number(shipping) * 100),
      taxBps: Math.round(Number(tax) * 100),
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
    <form className="payment-form" onSubmit={(event) => void submit(event)}>
      <h3>Online checkout — India / INR</h3>
      <p>
        Set approved delivery charges and tax before enabling checkout. This applies one delivery
        charge per order and tax to the item subtotal. Product-specific tax and regional delivery
        rules are not supported by this configuration.
      </p>
      <label>
        Delivery charge (₹)
        <input
          name="shipping"
          type="number"
          min="0"
          max="100000"
          step="0.01"
          required
          defaultValue={initial ? initial.shippingMinor / 100 : ''}
          disabled={pending}
        />
      </label>
      <label>
        Tax (%)
        <input
          name="tax"
          type="number"
          min="0"
          max="100"
          step="0.01"
          required
          defaultValue={initial ? initial.taxBps / 100 : ''}
          disabled={pending}
        />
      </label>
      <label>
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={initial?.enabled ?? false}
          disabled={pending}
        />{' '}
        Enable checkout after charges, policies and Razorpay configuration are approved
      </label>
      <button className="primary-button" disabled={pending}>
        {pending ? 'Saving…' : 'Save checkout settings'}
      </button>
    </form>
  )
}
