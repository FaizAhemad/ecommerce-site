import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { FormDialog } from '../components/FormDialog'
import { SellerNavigation } from '../components/SellerNavigation'

type Application = { id: string; userId?: string; name: string; city: string; description: string; status: string; reason: string; version: number; updatedAt: string }
type Result = { application?: Application | null; applications?: Application[]; nextPage?: number | null }
export function SellerPage({ admin = false }: { admin?: boolean }) {
  const notify = useNotification()
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState(false), [selected, setSelected] = useState<Application | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [name, setName] = useState(''), [city, setCity] = useState(''), [description, setDescription] = useState('')
  const [reason, setReason] = useState(''), [decision, setDecision] = useState('APPROVED')
  const requestId = useRef<string | null>(null), lock = useRef(false), controller = useRef<AbortController | null>(null)
  const path = admin ? '/api/admin/sellers' : '/api/seller/application'
  const query = useQuery({ queryKey: privateKey('seller-onboarding', admin, page), retry: false,
    queryFn: async ({ signal }) => {
      const response = await apiFetch(`${path}?page=${page}`, { signal })
      if (!response.ok) throw new Error('Unable to load applications.')
      return await response.json() as Result
    },
  })
  useEffect(() => () => controller.current?.abort(), [])
  const own = query.data?.application
  const applications = admin ? query.data?.applications ?? [] : own ? [own] : []
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    const generation = sessionGeneration(), abort = new AbortController()
    controller.current = abort
    requestId.current ??= crypto.randomUUID()
    try {
      const response = await apiFetch(path, { method: admin ? 'PATCH' : 'POST', signal: AbortSignal.any([abort.signal, sessionSignal()]),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(admin ? {
          userId: selected?.userId, expectedVersion: selected?.version, status: decision, reason,
        } : { id: requestId.current, name, city, description, expectedVersion: own?.version }),
      })
      const body = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to save. Refresh before retrying.')
      if (abort.signal.aborted || generation !== sessionGeneration()) return
      setOpen(false)
      requestId.current = null
      notify(admin ? 'Seller decision recorded. No products or payouts were enabled.' : 'Application recorded for review.', 'success')
      await query.refetch({ cancelRefetch: false })
    } catch (failure) {
      if (!abort.signal.aborted && generation === sessionGeneration()) setError(failure instanceof Error ? failure.message : 'Unable to save application.')
    } finally {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setBusy(false)
    }
  }
  function edit(application: Application | null) {
    setSelected(application)
    setName(application?.name ?? '')
    setCity(application?.city ?? '')
    setDescription(application?.description ?? '')
    setReason('')
    setDecision(application?.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED')
    requestId.current = application?.status === 'REJECTED' ? crypto.randomUUID() : requestId.current
    setError('')
    setOpen(true)
  }
  return <section className="page-section">
    <p className="eyebrow">Gadgify marketplace</p>
    <h1>{admin ? 'Seller applications' : 'Sell with Gadgify'}</h1>
    <SellerNavigation admin={admin} />
    <p>{admin ? 'Review shop applications and manage access. Approval does not publish products or enable payouts.' : 'Tell us about your shop. A verified account email is required. Applications are reviewed before seller access is granted.'}</p>
    <p>Approved shops can prepare products for content review and a public showcase. Marketplace purchasing and payouts are not enabled; fees and seller terms must be confirmed first.</p>
    <button className="secondary-button" disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh applications</button>
    {query.isPending && <p role="status">Loading applications…</p>}
    {query.isError && <p role="alert">Unable to load applications. Refresh to try again.</p>}
    {!admin && query.isSuccess && (!own || own.status === 'REJECTED') && <button className="primary-button" disabled={busy} onClick={() => edit(own ?? null)}>{own ? 'Revise application' : 'Apply to sell'}</button>}
    {!admin && <p><a href="/verify-email">Check account email verification</a></p>}
    {admin && query.isSuccess && applications.length === 0 && <p>No applications on this page.</p>}
    {applications.map(application => <article className="record-card" key={application.id}>
      <h2>{application.name}</h2><p>{application.city} · {application.status}</p><p>{application.description}</p>
      {application.reason && <p>Review note: {application.reason}</p>}
      <small>Updated {new Date(application.updatedAt).toLocaleString()}</small>
      {admin && application.status !== 'REJECTED' && <button className="secondary-button" disabled={busy} onClick={() => edit(application)}>Review access</button>}
    </article>)}
    {admin && <div className="profile-actions"><button className="secondary-button" disabled={busy || page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary-button" disabled={busy || query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</button></div>}
    <FormDialog open={open} title={admin ? `Review ${selected?.name ?? 'shop'}` : 'Shop application'} busy={busy} onClose={() => setOpen(false)}>
      <form className="auth-form" onSubmit={submit}>
        {admin ? <>
          <label>Decision<select value={decision} disabled={busy} onChange={event => setDecision(event.target.value)}>
            {selected?.status === 'PENDING' && <><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option></>}
            {selected?.status === 'APPROVED' && <option value="SUSPENDED">Suspend</option>}
            {selected?.status === 'SUSPENDED' && <option value="APPROVED">Restore access</option>}
          </select></label>
          <label>Reason shown to applicant<textarea required minLength={3} maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>
        </> : <>
          <label>Shop name<input required minLength={2} maxLength={120} value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
          <label>City<input required minLength={2} maxLength={100} value={city} disabled={busy} onChange={event => setCity(event.target.value)} /></label>
          <label>What do you sell?<textarea required minLength={10} maxLength={2000} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} /></label>
          <p>Your shop name will appear in the shop directory after approval. Do not include bank details, passwords or identity documents in this application.</p>
        </>}
        {error && <p role="alert">{error}</p>}
        <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : admin ? 'Confirm decision' : 'Submit application'}</button>
      </form>
    </FormDialog>
  </section>
}
