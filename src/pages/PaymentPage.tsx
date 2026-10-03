import { useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowRight, Check, Image as ImageIcon, MapPin, PackageCheck, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '../api/cart'
import { emptyAddress, getProfile, profileRequest, type Address, type AddressDraft } from '../api/profile'
import { privateKey } from '../api/sessionScope'
import { sessionGeneration, sessionSignal } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import type { StorefrontApiResponse } from '../api/storefront'
import { CheckoutSubmit } from '../components/CheckoutSubmit'
import { FormDialog } from '../components/FormDialog'
import { useNotification } from '../components/NotificationProvider'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { TextField } from '../components/mui/TextField'
import { Radio } from '../components/mui/Radio'

type Props = {
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

export function PaymentPage({ storefront, onNavigate }: Props) {
  const cart = useCart()
  const notify = useNotification()
  const profile = useQuery({
    queryKey: privateKey('profile'),
    queryFn: ({ signal }) => getProfile(signal),
  })
  const [selected, setSelected] = useState('')
  const [addressOpen, setAddressOpen] = useState(false)
  const [addressDraft, setAddressDraft] = useState<AddressDraft>({ ...emptyAddress })
  const [addressPending, setAddressPending] = useState(false)
  const [addressError, setAddressError] = useState('')
  const addressLock = useRef(false)
  const [snapshot, setSnapshot] = useState<{
    items: NonNullable<typeof cart.data>
    addresses: Address[]
    addressId: string
  } | null>(null)
  const attempted = snapshot !== null
  const addresses = snapshot?.addresses ?? profile.data?.addresses ?? []
  const selectedId =
    snapshot?.addressId ||
    addresses.find((address) => address.id === selected && address.country === 'IN')?.id ||
    addresses.find((address) => address.isDefault && address.country === 'IN')?.id ||
    addresses.find((address) => address.country === 'IN')?.id ||
    ''
  const items = snapshot?.items ?? cart.data ?? []
  const units = items.reduce((sum, item) => sum + item.quantity, 0)
  const money = (minor: number) =>
    new Intl.NumberFormat(storefront.localization.locale, {
      style: 'currency',
      currency: 'INR',
    }).format(minor / 100)
  const saveAddress = async (event: FormEvent) => {
    event.preventDefault()
    if (addressLock.current || attempted) return
    addressLock.current = true
    setAddressPending(true)
    setAddressError('')
    const generation = sessionGeneration()
    try {
      const country = addressDraft.country.trim().toUpperCase()
      if (!/^[A-Z]{2}$/.test(country)) {
        setAddressError('Enter a valid two-letter country code, such as IN.')
        return
      }
      const result = await profileRequest('addresses', 'POST', { ...addressDraft, country }, sessionSignal())
      if (generation !== sessionGeneration()) return
      const nextAddresses = result.addresses
      queryClient.setQueryData(privateKey('profile'), (current: Awaited<ReturnType<typeof getProfile>> | undefined) =>
        current ? { ...current, addresses: nextAddresses } : current,
      )
      const nextAddress = nextAddresses.find((address) => address.isDefault && address.country === 'IN') ?? nextAddresses.find((address) => address.country === 'IN')
      if (nextAddress) setSelected(nextAddress.id)
      setAddressOpen(false)
      setAddressDraft({ ...emptyAddress })
      notify('Delivery address saved.', 'success')
    } catch (error) {
      if (generation === sessionGeneration()) {
        const message = error instanceof Error ? error.message : 'Unable to save this address. Please try again.'
        setAddressError(message)
        notify(message, 'error')
      }
    } finally {
      addressLock.current = false
      if (generation === sessionGeneration()) setAddressPending(false)
    }
  }

  return (
    <div className="w-full">
      <section
        className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-12"
        aria-labelledby="payment-title"
      >
        <header className="mb-6 border-b border-[var(--line)] pb-5 sm:mb-8 sm:pb-6">
          <p className="eyebrow mb-2">Checkout</p>
          <h1 id="payment-title" className="!mb-2 !max-w-none !text-4xl !leading-tight !tracking-tight sm:!text-5xl">
            Review your order
          </h1>
          <p className="mb-5 text-sm leading-6 text-[var(--muted)] sm:text-base">
            Confirm where it should go, then review the final total before placing your order.
          </p>
          <ol className="m-0 flex max-w-2xl list-none flex-wrap items-center gap-2 p-0 text-xs font-medium sm:gap-3 sm:text-sm" aria-label="Checkout steps">
            <li className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[rgba(215,225,208,0.55)] px-3 text-[var(--ink)]" aria-current="step">
              <span className="grid size-5 place-items-center rounded-full bg-[var(--ink)] text-[10px] text-white">1</span>
              Delivery &amp; order
            </li>
            <ArrowRight aria-hidden="true" className="size-4 text-[var(--muted)]" />
            <li className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--muted)]">
              <span className="grid size-5 place-items-center rounded-full border border-[var(--line)] text-[10px]">2</span>
              Payment after order
            </li>
          </ol>
        </header>

        {!attempted && (cart.isPending || profile.isPending) ? (
          <div className="grid min-h-64 place-content-center justify-items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center" role="status">
            <span className="grid size-11 place-items-center rounded-full bg-[rgba(215,225,208,0.5)]"><PackageCheck aria-hidden="true" className="size-5" /></span>
            <p className="m-0 text-sm text-[var(--muted)]">Loading your cart and delivery addresses…</p>
          </div>
        ) : !attempted && (cart.isError || profile.isError) ? (
          <div className="mx-auto grid min-h-64 max-w-2xl place-content-center justify-items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center" role="alert">
            <p className="m-0 text-sm text-[var(--ink)]">We couldn’t load checkout details.</p>
            <p className="m-0 text-sm text-[var(--muted)]">Your cart and saved addresses have not been changed.</p>
            <Button
              variant="outlined"
              disabled={cart.isFetching || profile.isFetching}
              onClick={() => {
                void cart.refetch({ cancelRefetch: false })
                void profile.refetch({ cancelRefetch: false })
              }}
            >
              {cart.isFetching || profile.isFetching ? 'Refreshing…' : 'Try again'}
            </Button>
          </div>
        ) : !items.length ? (
          <div className="mx-auto grid min-h-72 max-w-2xl place-content-center justify-items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-[rgba(215,225,208,0.5)]"><PackageCheck aria-hidden="true" className="size-5" /></span>
            <h2 className="!mb-0 !text-xl !font-semibold !tracking-tight">Your cart is empty</h2>
            <p className="m-0 text-sm text-[var(--muted)]">Add something to your cart before checking out.</p>
            <Button component="a" variant="contained" href="/products" onClick={onNavigate('/products')}>
              Browse products <ArrowRight aria-hidden="true" className="ml-2 inline size-4" />
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)] lg:gap-8">
            <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="delivery-title">
              <div className="mb-5 flex items-start gap-3 border-b border-[var(--line)] pb-4 sm:mb-6 sm:pb-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[rgba(215,225,208,0.55)] text-[var(--ink)]"><MapPin aria-hidden="true" className="size-[18px]" /></span>
                <div>
                  <h2 id="delivery-title" className="!mb-1 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!text-2xl">Delivery address</h2>
                  <p className="m-0 text-sm leading-6 text-[var(--muted)]">Choose a saved address in India for this order.</p>
                </div>
              </div>
              {!addresses.length ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5">
                  <h3 className="mb-1 text-sm font-semibold text-[var(--ink)]">Add a delivery address</h3>
                  <p className="mb-4 text-sm leading-6 text-[var(--muted)]">A saved address is needed before checkout can continue.</p>
                  {!attempted && <Button type="button" variant="contained" onClick={() => { setAddressError(''); setAddressDraft({ ...emptyAddress }); setAddressOpen(true) }}><Plus aria-hidden="true" className="size-4" /> Add delivery address</Button>}
                </div>
              ) : (
                <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0" disabled={attempted}>
                  <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Saved addresses</legend>
                  {addresses.map((address) => {
                    const isSelected = selectedId === address.id
                    const unavailable = address.country !== 'IN'
                    return (
                      <label
                        key={address.id}
                        className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${unavailable ? 'cursor-not-allowed opacity-60' : 'hover:border-[rgba(40,49,59,0.35)]'} ${isSelected ? 'border-[var(--ink)] bg-[rgba(215,225,208,0.28)] ring-1 ring-[var(--ink)]' : 'border-[var(--line)] bg-[var(--surface)]'}`}
                      >
                        <Radio
                          name="delivery-address"
                          value={address.id}
                          disabled={unavailable}
                          checked={isSelected}
                          onChange={() => setSelected(address.id)}
                        />
                        <span className="min-w-0 flex-1 text-sm leading-6 text-[var(--ink)]">
                          <span className="mb-0.5 flex flex-wrap items-center gap-2 font-semibold">
                            {address.name}
                            {address.isDefault && <span className="rounded-full bg-[var(--paper)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">Default</span>}
                          </span>
                          <span className="block break-words text-[var(--muted)]">
                            {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}
                          </span>
                          {address.phone && <span className="block text-xs text-[var(--muted)]">{address.phone}</span>}
                          {unavailable && <span className="mt-1 block text-xs font-medium text-[var(--muted)]">Delivery is currently available in India only.</span>}
                        </span>
                        {isSelected && <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-[var(--ink)]" />}
                      </label>
                    )
                  })}
                </fieldset>
              )}
              {!attempted && addresses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  <Button type="button" variant="text" onClick={() => { setAddressError(''); setAddressDraft({ ...emptyAddress }); setAddressOpen(true) }}><Plus aria-hidden="true" className="size-4" /> Add another address</Button>
                  <a className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)]" href="/profile" onClick={onNavigate('/profile')}>Manage addresses <ArrowRight aria-hidden="true" className="size-4" /></a>
                </div>
              )}
            </section>

            <aside className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6 lg:sticky lg:top-24" aria-labelledby="checkout-summary-title">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                <h2 id="checkout-summary-title" className="!mb-0 !text-xl !font-semibold !leading-tight !tracking-tight text-[var(--ink)]">Order summary</h2>
                <span className="shrink-0 rounded-full bg-[var(--paper)] px-2.5 py-1 text-xs text-[var(--muted)]">{units} {units === 1 ? 'item' : 'items'}</span>
              </div>
              <ul className="m-0 max-h-[min(45vh,420px)] list-none divide-y divide-[var(--line)] overflow-y-auto p-0">
                {items.map((item) => (
                  <CheckoutItem key={item.product.id} item={item} money={money} />
                ))}
              </ul>
              <CheckoutSubmit
                itemsSubtotalMinor={items.reduce((sum, item) => sum + item.product.priceMinor * item.quantity, 0)}
                addressId={selectedId}
                cartRevision={JSON.stringify(items.map((item) => [item.id, item.quantity, item.product.priceMinor]))}
                disabled={cart.isUpdating || cart.isFetching || profile.isFetching}
                onAttempt={() => setSnapshot({ items, addresses, addressId: selectedId })}
              />
              {cart.isUpdating && <p className="mb-0 mt-3 text-center text-xs text-[var(--muted)]" role="status">Updating your cart…</p>}
            </aside>
          </div>
        )}
      </section>
      <FormDialog open={addressOpen} title="Add delivery address" busy={addressPending} onClose={() => setAddressOpen(false)}>
        <form className="grid gap-4" onSubmit={(event) => void saveAddress(event)} aria-busy={addressPending}>
          <p className="m-0 text-sm leading-6 text-[var(--muted)]">Save an India delivery address to use for this order.</p>
          {addressError && <Alert severity="error" role="alert">{addressError}</Alert>}
          {([
            ['label', 'Address label (optional)', 50, false], ['name', 'Recipient name', 100, true], ['line1', 'Address line 1', 200, true], ['line2', 'Address line 2 (optional)', 200, false], ['city', 'City', 100, true], ['state', 'State / region', 100, true], ['postalCode', 'Postal code', 20, true], ['phone', 'Delivery phone (optional)', 16, false],
          ] as const).map(([field, label, limit, required]) => (
            <TextField fullWidth size="small" key={field} label={label} type={field === 'phone' ? 'tel' : 'text'} autoComplete={field === 'name' ? 'shipping name' : field === 'line1' ? 'shipping address-line1' : field === 'line2' ? 'shipping address-line2' : field === 'city' ? 'shipping address-level2' : field === 'state' ? 'shipping address-level1' : field === 'postalCode' ? 'shipping postal-code' : 'off'} slotProps={{ htmlInput: { maxLength: limit } }} required={required} value={addressDraft[field] ?? ''} disabled={addressPending} onChange={(input) => setAddressDraft({ ...addressDraft, [field]: input.target.value })} />
          ))}
          <TextField fullWidth size="small" label="Country code" type="text" autoComplete="shipping country" autoCapitalize="characters" spellCheck={false} slotProps={{ htmlInput: { inputMode: 'text', pattern: '[A-Za-z]{2}', title: 'Enter a two-letter country code, such as IN.', maxLength: 2 } }} placeholder="IN" required value={addressDraft.country} disabled={addressPending} onChange={(input) => setAddressDraft({ ...addressDraft, country: input.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() })} />
          <Button type="submit" variant="contained" fullWidth disabled={addressPending}>{addressPending ? 'Saving address…' : 'Save and use this address'}</Button>
        </form>
      </FormDialog>
    </div>
  )
}

function CheckoutItem({
  item,
  money,
}: {
  item: NonNullable<ReturnType<typeof useCart>['data']>[number]
  money: (minor: number) => string
}) {
  const image = item.product.images?.[0]
  const imageUrl = image?.url.trim()
  const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : ''
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <li className="flex min-w-0 items-center gap-3 py-3.5">
      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)] sm:size-16">
        {safeImageUrl && !imageFailed ? (
          <img className="size-full object-contain p-1" src={safeImageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <ImageIcon aria-hidden="true" className="size-5 text-[var(--muted)]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-sm font-medium leading-5 text-[var(--ink)]">{item.product.name}</span>
        <span className="mt-1 block text-xs text-[var(--muted)]">Qty {item.quantity}</span>
      </span>
      <strong className="shrink-0 text-sm font-semibold tabular-nums text-[var(--ink)]">{money(item.product.priceMinor * item.quantity)}</strong>
    </li>
  )
}
