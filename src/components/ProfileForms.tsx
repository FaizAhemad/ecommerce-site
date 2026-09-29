import { useState, type FormEvent } from 'react'
import { Check, MapPin, Pencil, Plus, UserRound } from 'lucide-react'
import { emptyAddress, type AddressDraft, type ProfileData } from '../api/profile'
import { FormDialog } from './FormDialog'

type Save = (path: 'profile' | 'addresses', method: string, body: unknown) => Promise<boolean>

const fieldClassName =
  'min-h-12 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60'

export function ProfileForms({
  data,
  pending,
  error,
  clearError,
  save,
}: {
  data: ProfileData
  pending: boolean
  error: string
  clearError: () => void
  save: Save
}) {
  const [name, setName] = useState(data.profile.name ?? '')
  const [profileOpen, setProfileOpen] = useState(false)
  const [phone, setPhone] = useState(data.profile.phone ?? '')
  const [password, setPassword] = useState('')
  const [draft, setDraft] = useState<AddressDraft | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const editorOpen = profileOpen || draft !== null

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (await save('profile', 'PATCH', { name, phone, currentPassword: password })) {
      setPassword('')
      setProfileOpen(false)
    }
  }

  const submitAddress = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    if (
      await save('addresses', editing ? 'PATCH' : 'POST', {
        ...draft,
        ...(editing ? { id: editing } : {}),
      })
    ) {
      setDraft(null)
      setEditing(null)
    }
  }

  const startAddress = (address?: AddressDraft & { id?: string }) => {
    clearError()
    setDraft(address ? { ...address } : { ...emptyAddress })
    setEditing(address?.id ?? null)
    setDeleting(null)
  }

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:gap-6">
        <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6" aria-labelledby="personal-details-title">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[rgba(215,225,208,0.5)] text-[var(--ink)]"><UserRound aria-hidden="true" className="size-[18px]" /></span>
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Contact details</p>
              <h2 id="personal-details-title" className="!mb-0 !mt-0.5 !text-lg !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!text-xl">Personal details</h2>
            </div>
          </div>
          <dl className="m-0 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            <div className="grid gap-1 py-3 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4">
              <dt className="text-xs text-[var(--muted)]">Name</dt>
              <dd className="m-0 break-words text-sm font-medium text-[var(--ink)]">{data.profile.name || <span className="font-normal text-[var(--muted)]">Not added yet</span>}</dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-4">
              <dt className="text-xs text-[var(--muted)]">Phone</dt>
              <dd className="m-0 break-words text-sm font-medium text-[var(--ink)]">{data.profile.phone || <span className="font-normal text-[var(--muted)]">Not added yet</span>}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="secondary-button mt-5 inline-flex w-full items-center justify-center gap-2 !normal-case !tracking-normal"
            disabled={pending}
            onClick={() => { clearError(); setProfileOpen(true) }}
          >
            <Pencil aria-hidden="true" className="size-4" /> Edit personal details
          </button>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6" aria-labelledby="address-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[rgba(215,225,208,0.5)] text-[var(--ink)]"><MapPin aria-hidden="true" className="size-[18px]" /></span>
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Delivery</p>
                <h2 id="address-title" className="!mb-0 !mt-0.5 !text-lg !font-semibold !leading-tight !tracking-tight text-[var(--ink)] sm:!text-xl">Saved addresses</h2>
              </div>
            </div>
            <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-xs text-[var(--muted)]">{data.addresses.length} {data.addresses.length === 1 ? 'address' : 'addresses'}</span>
          </div>

          {error && !editorOpen && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-950" role="alert">{error}</p>}

          {data.addresses.length === 0 ? (
            <div className="grid min-h-40 place-content-center justify-items-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] px-4 py-6 text-center">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--surface)] text-[var(--muted)]"><MapPin aria-hidden="true" className="size-4" /></span>
              <p className="m-0 text-sm font-medium text-[var(--ink)]">No addresses saved yet</p>
              <p className="m-0 max-w-sm text-xs leading-5 text-[var(--muted)]">Add a delivery address to make checkout quicker.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.addresses.map((address) => (
                <article className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4" key={address.id}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="m-0 min-w-0 flex-1 break-words text-sm font-semibold text-[var(--ink)]">{address.label || address.name}</h3>
                    {address.isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(215,225,208,0.55)] px-2 py-1 text-[10px] font-medium text-[var(--ink)]"><Check aria-hidden="true" className="size-3" /> Default</span>}
                  </div>
                  <p className="mb-4 break-words text-xs leading-5 text-[var(--muted)]">
                    <span className="font-medium text-[var(--ink)]">{address.name}</span><br />
                    {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                    {address.city}, {address.state} {address.postalCode}<br />
                    {address.country}{address.phone ? ` · ${address.phone}` : ''}
                  </p>
                  {deleting === address.id ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="group" aria-label="Confirm address deletion">
                      <p className="mb-3 text-xs leading-5 text-red-950">Delete this saved address?</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="min-h-10 rounded-lg bg-red-700 px-3 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60" disabled={pending} onClick={async () => { if (await save('addresses', 'DELETE', { id: address.id })) { setDeleting(null); if (editing === address.id) { setDraft(null); setEditing(null) } } }}>Delete address</button>
                        <button type="button" className="min-h-10 rounded-lg px-3 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface)]" disabled={pending} onClick={() => setDeleting(null)}>Keep it</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                      <button type="button" className="min-h-10 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-60" disabled={pending || draft !== null} onClick={() => startAddress(address)}>Edit</button>
                      {!address.isDefault && <button type="button" className="min-h-10 rounded-lg px-3 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:opacity-60" disabled={pending} onClick={() => void save('addresses', 'PATCH', { id: address.id, makeDefault: true })}>Make default</button>}
                      <button type="button" className="min-h-10 rounded-lg px-3 text-xs font-medium text-[#a33a37] hover:bg-red-50 disabled:opacity-60" disabled={pending} onClick={() => { clearError(); setDeleting(address.id) }}>Delete</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {!draft && <button type="button" className="primary-button mt-4 inline-flex min-h-11 items-center justify-center gap-2 !normal-case !tracking-normal" disabled={pending} onClick={() => startAddress()}><Plus aria-hidden="true" className="size-4" /> Add address</button>}
        </section>
      </div>

      <FormDialog open={profileOpen} title="Personal details" busy={pending} onClose={() => { setPassword(''); setProfileOpen(false) }}>
        <form className="grid gap-5" onSubmit={submitProfile} aria-busy={pending}>
          {error && <p className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-950" role="alert">{error}</p>}
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Name
            <input className={fieldClassName} autoComplete="name" required maxLength={100} value={name} disabled={pending} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="grid gap-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]" htmlFor="profile-phone">Login phone number
              <input id="profile-phone" className={fieldClassName} type="tel" autoComplete="tel" maxLength={16} value={phone} disabled={pending} onChange={(event) => setPhone(event.target.value)} aria-describedby="profile-phone-help" />
            </label>
            <p id="profile-phone-help" className="m-0 text-xs leading-5 text-[var(--muted)]">
              Use your country code. Changing this number clears its verification. Current number {data.profile.phoneVerified ? 'is verified.' : 'is not verified.'}
            </p>
          </div>
          {phone !== (data.profile.phone ?? '') && (
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
              Current password
              <input className={fieldClassName} type="password" autoComplete="current-password" required maxLength={128} value={password} disabled={pending} onChange={(event) => setPassword(event.target.value)} />
              <span className="text-xs font-normal leading-5 text-[var(--muted)]">Confirm your password to change the login phone number.</span>
            </label>
          )}
          <button type="submit" className="primary-button flex min-h-12 w-full items-center justify-center !normal-case !tracking-normal" disabled={pending}>
            {pending ? 'Saving your details…' : 'Save personal details'}
          </button>
        </form>
      </FormDialog>

      {draft && (
        <FormDialog open title={editing ? 'Edit delivery address' : 'Add delivery address'} busy={pending} onClose={() => { setDraft(null); setEditing(null) }}>
          <form className="grid gap-5" onSubmit={submitAddress} aria-busy={pending}>
            {error && <p className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-950" role="alert">{error}</p>}
            <p className="m-0 text-sm leading-6 text-[var(--muted)]">Use the address where you would like your orders delivered.</p>
            {(
              [
                ['label', 'Address label (optional)', 50, 'off'],
                ['name', 'Recipient name', 100, 'shipping name'],
                ['line1', 'Address line 1', 200, 'shipping address-line1'],
                ['line2', 'Address line 2 (optional)', 200, 'shipping address-line2'],
                ['city', 'City', 100, 'shipping address-level2'],
                ['state', 'State / region', 100, 'shipping address-level1'],
                ['postalCode', 'Postal code', 20, 'shipping postal-code'],
                ['country', 'Country code (for example IN)', 2, 'shipping country'],
                ['phone', 'Delivery phone (optional)', 16, 'shipping tel'],
              ] as const
            ).map(([field, label, limit, autoComplete]) => (
              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]" key={field}>
                {label}
                <input className={fieldClassName} type={field === 'phone' ? 'tel' : 'text'} required={!['label', 'line2', 'phone'].includes(field)} maxLength={limit} autoComplete={autoComplete} value={draft[field] ?? ''} disabled={pending} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />
              </label>
            ))}
            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]">
              <input className="size-5 accent-[var(--ink)]" type="checkbox" checked={draft.isDefault} disabled={pending || (editing !== null && data.addresses.some((address) => address.id === editing && address.isDefault))} onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })} />
              Use as default delivery address
            </label>
            <p className="m-0 rounded-lg bg-[var(--paper)] p-3 text-xs leading-5 text-[var(--muted)]">Addresses used by existing orders are protected. Add another address if you need to change those details.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="submit" className="primary-button flex min-h-12 items-center justify-center !normal-case !tracking-normal" disabled={pending}>{pending ? 'Saving address…' : 'Save address'}</button>
              <button type="button" className="secondary-button flex min-h-12 items-center justify-center !normal-case !tracking-normal" disabled={pending} onClick={() => { setDraft(null); setEditing(null) }}>Cancel</button>
            </div>
          </form>
        </FormDialog>
      )}

    </>
  )
}
