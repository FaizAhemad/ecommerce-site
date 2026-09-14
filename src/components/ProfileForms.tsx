import { useState, type FormEvent } from 'react'
import { emptyAddress, type AddressDraft, type ProfileData } from '../api/profile'

type Save = (path: 'profile' | 'addresses', method: string, body: unknown) => Promise<boolean>
export function ProfileForms({
  data,
  pending,
  save,
}: {
  data: ProfileData
  pending: boolean
  save: Save
}) {
  const [name, setName] = useState(data.profile.name ?? '')
  const [phone, setPhone] = useState(data.profile.phone ?? '')
  const [password, setPassword] = useState('')
  const [draft, setDraft] = useState<AddressDraft | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (await save('profile', 'PATCH', { name, phone, currentPassword: password })) setPassword('')
  }
  const submitAddress = async (event: FormEvent) => {
    event.preventDefault()
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
  return (
    <>
      <form className="auth-form" onSubmit={submitProfile} aria-busy={pending}>
        <h2>Personal details</h2>
        <label>
          Name
          <input
            autoComplete="name"
            required
            maxLength={100}
            value={name}
            disabled={pending}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Login phone number
          <input
            type="tel"
            autoComplete="tel"
            maxLength={16}
            value={phone}
            disabled={pending}
            onChange={(e) => setPhone(e.target.value)}
            aria-describedby="profile-phone-help"
          />
        </label>
        <p id="profile-phone-help">
          Use your country code. Changing this number clears its verification.{' '}
          {data.profile.phoneVerified ? 'Current number verified.' : 'Current number not verified.'}
        </p>
        {phone !== (data.profile.phone ?? '') && (
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              disabled={pending}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        <button className="primary-button auth-submit" disabled={pending}>
          {pending ? 'Please wait…' : 'Save personal details'}
        </button>
      </form>
      <section className="page-section" aria-labelledby="address-title">
        <h2 id="address-title">Delivery addresses</h2>
        {!data.addresses.length && <p>No addresses saved yet.</p>}
        {data.addresses.map((address) => (
          <article className="page-section" key={address.id}>
            <h3>
              {address.label || address.name}
              {address.isDefault ? ' — Default' : ''}
            </h3>
            <p>
              {address.name}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
              {address.phone ? ` · ${address.phone}` : ''}
            </p>
            <div className="profile-actions">
              <button
                className="secondary-button"
                disabled={pending || draft !== null}
                onClick={() => {
                  setDraft({ ...address })
                  setEditing(address.id)
                  setDeleting(null)
                }}
              >
                Edit
              </button>
              {!address.isDefault && (
                <button
                  className="secondary-button"
                  disabled={pending}
                  onClick={() =>
                    void save('addresses', 'PATCH', { id: address.id, makeDefault: true })
                  }
                >
                  Make default
                </button>
              )}
              <button
                className="secondary-button"
                disabled={pending}
                onClick={() => setDeleting(address.id)}
              >
                Delete
              </button>
            </div>
            {deleting === address.id && (
              <div role="group" aria-label="Confirm address deletion">
                <p>Delete this saved address?</p>
                <div className="profile-actions">
                  <button
                    className="secondary-button"
                    disabled={pending}
                    onClick={async () => {
                      if (await save('addresses', 'DELETE', { id: address.id })) {
                        setDeleting(null)
                        if (editing === address.id) {
                          setDraft(null)
                          setEditing(null)
                        }
                      }
                    }}
                  >
                    Confirm delete
                  </button>
                  <button
                    className="secondary-button"
                    disabled={pending}
                    onClick={() => setDeleting(null)}
                  >
                    Keep address
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
        {!draft ? (
          <button
            className="secondary-button"
            disabled={pending}
            onClick={() => {
              setDraft({ ...emptyAddress })
              setEditing(null)
            }}
          >
            Add address
          </button>
        ) : (
          <form className="auth-form" onSubmit={submitAddress} aria-busy={pending}>
            <h3>{editing ? 'Edit address' : 'New address'}</h3>
            {(
              [
                ['label', 'Label (optional)', 50, 'off'],
                ['name', 'Recipient name', 100, 'shipping name'],
                ['line1', 'Address line 1', 200, 'shipping address-line1'],
                ['line2', 'Address line 2 (optional)', 200, 'shipping address-line2'],
                ['city', 'City', 100, 'shipping address-level2'],
                ['state', 'State / region', 100, 'shipping address-level1'],
                ['postalCode', 'Postal code', 20, 'shipping postal-code'],
                ['country', 'Country code (e.g. IN)', 2, 'shipping country'],
                ['phone', 'Delivery phone (optional)', 16, 'shipping tel'],
              ] as const
            ).map(([field, label, limit, autoComplete]) => (
              <label key={field}>
                {label}
                <input
                  type={field === 'phone' ? 'tel' : 'text'}
                  required={!['label', 'line2', 'phone'].includes(field)}
                  maxLength={limit}
                  autoComplete={autoComplete}
                  value={draft[field] ?? ''}
                  disabled={pending}
                  onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                />
              </label>
            ))}
            <label className="profile-default">
              <input
                type="checkbox"
                checked={draft.isDefault}
                disabled={
                  pending ||
                  (editing !== null && data.addresses.some((a) => a.id === editing && a.isDefault))
                }
                onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
              />{' '}
              Use as default delivery address
            </label>
            <p>
              To replace your current default, make another address default. Addresses used by
              orders are protected; add a new address instead.
            </p>
            <div className="profile-actions">
              <button className="primary-button" disabled={pending}>
                {pending ? 'Saving…' : 'Save address'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={pending}
                onClick={() => {
                  setDraft(null)
                  setEditing(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  )
}
