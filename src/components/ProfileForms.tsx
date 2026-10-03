import { useState, type FormEvent } from 'react'
import { Check, MapPin, Pencil, Plus, UserRound } from 'lucide-react'
import { emptyAddress, type AddressDraft, type ProfileData } from '../api/profile'
import { FormDialog } from './FormDialog'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Checkbox } from './mui/Checkbox'
import { FormControlLabel } from './mui/FormControlLabel'
import { TextField } from './mui/TextField'
import { Stack } from './mui/Stack'

type Save = (path: 'profile' | 'addresses', method: string, body: unknown) => Promise<boolean>

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
          <Button
            type="button"
            variant="outlined"
            fullWidth
            className="mt-5"
            disabled={pending}
            onClick={() => { clearError(); setProfileOpen(true) }}
          >
            <Pencil aria-hidden="true" className="size-4" /> Edit personal details
          </Button>
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

          {error && !editorOpen && <Alert className="mb-4" severity="error" role="alert">{error}</Alert>}

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
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button type="button" color="error" variant="contained" disabled={pending} onClick={async () => { if (await save('addresses', 'DELETE', { id: address.id })) { setDeleting(null); if (editing === address.id) { setDraft(null); setEditing(null) } } }}>Delete address</Button>
                        <Button type="button" variant="text" disabled={pending} onClick={() => setDeleting(null)}>Keep it</Button>
                      </Stack>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                      <Button type="button" size="small" variant="outlined" disabled={pending || draft !== null} onClick={() => startAddress(address)}>Edit</Button>
                      {!address.isDefault && <Button type="button" size="small" variant="text" disabled={pending} onClick={() => void save('addresses', 'PATCH', { id: address.id, makeDefault: true })}>Make default</Button>}
                      <Button type="button" size="small" color="error" variant="text" disabled={pending} onClick={() => { clearError(); setDeleting(address.id) }}>Delete</Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {!draft && <Button type="button" className="mt-4" variant="contained" disabled={pending} onClick={() => startAddress()}><Plus aria-hidden="true" className="size-4" /> Add address</Button>}
        </section>
      </div>

      <FormDialog open={profileOpen} title="Personal details" busy={pending} onClose={() => { setPassword(''); setProfileOpen(false) }}>
        <Stack component="form" spacing={2.5} onSubmit={submitProfile} aria-busy={pending}>
          {error && <Alert severity="error" role="alert">{error}</Alert>}
          <TextField label="Name" autoComplete="name" required slotProps={{ htmlInput: { maxLength: 100 } }} value={name} disabled={pending} onChange={(event) => setName(event.target.value)} fullWidth />
          <TextField label="Login phone number" type="tel" autoComplete="tel" slotProps={{ htmlInput: { maxLength: 16, 'aria-describedby': 'profile-phone-help' } }} value={phone} disabled={pending} onChange={(event) => setPhone(event.target.value)} helperText={<span id="profile-phone-help">Use your country code. Changing this number clears its verification. Current number {data.profile.phoneVerified ? 'is verified.' : 'is not verified.'}</span>} fullWidth />
          {phone !== (data.profile.phone ?? '') && (
            <TextField label="Current password" type="password" autoComplete="current-password" required slotProps={{ htmlInput: { maxLength: 128 } }} value={password} disabled={pending} onChange={(event) => setPassword(event.target.value)} helperText="Confirm your password to change the login phone number." fullWidth />
          )}
          <Button type="submit" variant="contained" fullWidth disabled={pending}>
            {pending ? 'Saving your details…' : 'Save personal details'}
          </Button>
        </Stack>
      </FormDialog>

      {draft && (
        <FormDialog open title={editing ? 'Edit delivery address' : 'Add delivery address'} busy={pending} onClose={() => { setDraft(null); setEditing(null) }}>
          <Stack component="form" spacing={2.5} onSubmit={submitAddress} aria-busy={pending}>
            {error && <Alert severity="error" role="alert">{error}</Alert>}
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
              <TextField key={field} label={label} type={field === 'phone' ? 'tel' : 'text'} required={!['label', 'line2', 'phone'].includes(field)} autoComplete={autoComplete} slotProps={{ htmlInput: { maxLength: limit } }} value={draft[field] ?? ''} disabled={pending} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} fullWidth />
            ))}
            <FormControlLabel control={<Checkbox checked={draft.isDefault} disabled={pending || (editing !== null && data.addresses.some((address) => address.id === editing && address.isDefault))} onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })} />} label="Use as default delivery address" />
            <p className="m-0 rounded-lg bg-[var(--paper)] p-3 text-xs leading-5 text-[var(--muted)]">Addresses used by existing orders are protected. Add another address if you need to change those details.</p>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button type="submit" variant="contained" disabled={pending} fullWidth>{pending ? 'Saving address…' : 'Save address'}</Button>
              <Button type="button" variant="outlined" disabled={pending} onClick={() => { setDraft(null); setEditing(null) }} fullWidth>Cancel</Button>
            </Stack>
          </Stack>
        </FormDialog>
      )}

    </>
  )
}
