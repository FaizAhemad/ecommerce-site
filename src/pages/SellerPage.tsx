import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { FormDialog } from '../components/FormDialog'
import { SellerNavigation } from '../components/SellerNavigation'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Chip } from '../components/mui/Chip'
import { Paper } from '../components/mui/Paper'
import { Stack } from '../components/mui/Stack'
import { TextField } from '../components/mui/TextField'
import { Typography } from '../components/mui/Typography'

type Application = { id: string; userId?: string; name: string; city: string; address: string; phone: string; description: string; gstRegistered?: boolean; gstin?: string; gstNotRegisteredReason?: string; gstOtherReason?: string; gstEnrolmentId?: string; gstReviewStatus?: string; status: string; reason: string; version: number; updatedAt: string }
type Result = { application?: Application | null; applications?: Application[]; nextPage?: number | null }
const gstReasonLabel: Record<string, string> = { BELOW_THRESHOLD: 'Turnover believed below registration threshold', EXEMPT_SUPPLIES: 'Only exempt goods', REGISTRATION_IN_PROGRESS: 'Registration or enrolment in progress', OTHER: 'Other reason' }
export function SellerPage({ admin = false }: { admin?: boolean }) {
  const notify = useNotification()
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState(false), [selected, setSelected] = useState<Application | null>(null)
  const [formMode, setFormMode] = useState<'APPLICATION' | 'GST_UPDATE'>('APPLICATION')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [name, setName] = useState(''), [city, setCity] = useState(''), [address, setAddress] = useState(''), [phone, setPhone] = useState(''), [description, setDescription] = useState('')
  const [gstRegistration, setGstRegistration] = useState('YES'), [gstin, setGstin] = useState(''), [gstNotRegisteredReason, setGstNotRegisteredReason] = useState(''), [gstOtherReason, setGstOtherReason] = useState(''), [gstEnrolmentId, setGstEnrolmentId] = useState('')
  const [reason, setReason] = useState(''), [decision, setDecision] = useState('APPROVED'), [gstDecision, setGstDecision] = useState('')
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
    if (admin && !decision) {
      setError('Choose a review decision before saving.')
      return
    }
    lock.current = true
    setBusy(true)
    setError('')
    const generation = sessionGeneration(), abort = new AbortController()
    controller.current = abort
    requestId.current ??= crypto.randomUUID()
    try {
      const response = await apiFetch(path, { method: admin ? 'PATCH' : 'POST', signal: AbortSignal.any([abort.signal, sessionSignal()]),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(admin ? {
          userId: selected?.userId, expectedVersion: selected?.version, status: decision, gstDecision, reason,
        } : formMode === 'GST_UPDATE' ? { action: 'update_gst', gstRegistered: gstRegistration === 'YES', gstin, gstNotRegisteredReason, gstOtherReason, gstEnrolmentId, expectedVersion: own?.version } : { id: requestId.current, name, city, address, phone, description, gstRegistered: gstRegistration === 'YES', gstin, gstNotRegisteredReason, gstOtherReason, gstEnrolmentId, expectedVersion: own?.version }),
      })
      const body = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to save. Refresh before retrying.')
      if (abort.signal.aborted || generation !== sessionGeneration()) return
      setOpen(false)
      requestId.current = null
      notify(admin ? 'Seller decision recorded. No products or payouts were enabled.' : formMode === 'GST_UPDATE' ? 'GST details updated and saved for admin review.' : 'Application recorded for review.', 'success')
      await query.refetch({ cancelRefetch: false })
    } catch (failure) {
      if (!abort.signal.aborted && generation === sessionGeneration()) setError(failure instanceof Error ? failure.message : 'Unable to save application.')
    } finally {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setBusy(false)
    }
  }
  function edit(application: Application | null, mode: 'APPLICATION' | 'GST_UPDATE' = 'APPLICATION') {
    setSelected(application)
    setFormMode(mode)
    setName(application?.name ?? '')
    setCity(application?.city ?? '')
    setAddress(application?.address ?? '')
    setPhone(application?.phone ?? '')
    setDescription(application?.description ?? '')
    setGstRegistration(application?.gstRegistered === false ? 'NO' : 'YES')
    setGstin(application?.gstin ?? '')
    setGstNotRegisteredReason(application?.gstNotRegisteredReason ?? '')
    setGstOtherReason(application?.gstOtherReason ?? '')
    setGstEnrolmentId(application?.gstEnrolmentId ?? '')
    setReason('')
    setDecision('')
    setGstDecision('')
    requestId.current = application?.status === 'REJECTED' ? crypto.randomUUID() : requestId.current
    setError('')
    setOpen(true)
  }
  return <Stack component="main" spacing={2.5} sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">Gadgify marketplace</Typography>
      <Typography component="h1" variant="h3">{admin ? 'Seller applications' : 'Sell with Gadgify'}</Typography>
      <Typography color="text.secondary">{admin ? 'Review shop applications and manage access. Shop approval is separate from each product’s content and fee approval.' : 'Tell us about your shop, business address and contact mobile. Applications are reviewed before seller access is granted.'}</Typography>
      <Typography variant="body2" color="text.secondary">For each product, Gadgify reviews the content and proposes either a fixed fee per unit sold or a percentage of the discounted item price. The product becomes orderable only after the shop accepts that exact offer.</Typography>
    </Stack>
    <SellerNavigation admin={admin} />
    <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh applications</Button>
    {query.isPending && <Paper variant="outlined" role="status" sx={{ p: 3 }}><Typography color="text.secondary">Loading applications…</Typography></Paper>}
    {query.isError && <Alert severity="error" role="alert" action={<Button color="inherit" size="small" disabled={busy || query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load applications.</Alert>}
    {!admin && query.isSuccess && (!own || own.status === 'REJECTED') && <Button variant="contained" disabled={busy} onClick={() => edit(own ?? null)}>{own ? 'Revise application' : 'Apply to sell'}</Button>}
    {!admin && <Typography variant="caption" color="text.secondary">Applying will not mark your account email as verified.</Typography>}
    {!admin && own?.status === 'APPROVED' && <Button variant="outlined" disabled={busy} onClick={() => edit(own, 'GST_UPDATE')}>Update GST details</Button>}
    {admin && query.isSuccess && applications.length === 0 && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No applications on this page</Typography></Paper>}
    <Stack spacing={1.5}>
    {applications.map(application => <Paper variant="outlined" component="article" key={application.id} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <Typography component="h2" variant="h6">{application.name}</Typography>
          <Chip size="small" label={application.status.replaceAll('_', ' ')} color={application.status === 'APPROVED' ? 'success' : application.status === 'REJECTED' ? 'error' : 'default'} />
        </Stack>
        <Typography variant="body2" color="text.secondary">{application.city}</Typography>
        <Typography variant="body2">Business contact: {application.phone || 'Not provided'} · {application.address || 'Address not provided'}</Typography>
        <Typography variant="body2">GST: {application.gstRegistered === true ? `Registered · ${application.gstin || 'GSTIN not provided'}` : application.gstRegistered === false ? `Not registered · ${gstReasonLabel[application.gstNotRegisteredReason ?? ''] ?? application.gstNotRegisteredReason ?? 'Reason not provided'}${application.gstOtherReason ? ` (${application.gstOtherReason})` : ''}${application.gstEnrolmentId ? ` · Enrolment ID ${application.gstEnrolmentId}` : ''}` : 'GST declaration not provided'}</Typography>
        <Typography variant="body2">GST review: {application.gstReviewStatus ?? 'PENDING'}</Typography>
        {!admin && application.gstRegistered === false && <Alert severity={application.gstReviewStatus === 'APPROVED' ? 'info' : 'warning'}>{application.gstReviewStatus === 'APPROVED' ? 'Your declared non-registration basis was reviewed for seller access. If your status changes or you receive a GSTIN, update your details promptly.' : 'Your reason is recorded, but it does not by itself confirm eligibility to sell through Gadgify. Marketplace ordering stays paused until an admin reviews the GST declaration. If your status changes or you receive a GSTIN, update your details promptly.'} Provide a GST Portal enrolment ID if applicable.</Alert>}
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{application.description}</Typography>
        {application.reason && <Alert severity="info">Review note: {application.reason}</Alert>}
        <Typography variant="caption" color="text.secondary">Updated {new Date(application.updatedAt).toLocaleString()}</Typography>
        {admin && <Button variant="outlined" disabled={busy} onClick={() => edit(application)}>{application.status === 'PENDING' ? 'Review application' : 'Edit review'}</Button>}
      </Stack>
    </Paper>)}
    </Stack>
    {admin && <Stack direction="row" spacing={1}><Button variant="outlined" disabled={busy || page === 0 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outlined" disabled={busy || query.data?.nextPage == null || query.isFetching} onClick={() => setPage(query.data?.nextPage ?? page)}>Next</Button></Stack>}
    <FormDialog open={open} title={admin ? `Review ${selected?.name ?? 'shop'}` : formMode === 'GST_UPDATE' ? 'Update GST details' : 'Shop application'} busy={busy} onClose={() => setOpen(false)}>
      <Stack component="form" spacing={2} onSubmit={submit}>
        {admin ? <>
          <TextField select required label="Review decision" value={decision} disabled={busy} onChange={event => setDecision(event.target.value)} slotProps={{ select: { native: true } }}>
            <option value="">Choose a decision</option>
            {selected?.status === 'PENDING' && <><option value="APPROVED">Approve application</option><option value="REJECTED">Reject application</option></>}
            {selected?.status === 'APPROVED' && <><option value="APPROVED">Keep approved and edit review</option><option value="REJECTED">Reject application</option><option value="SUSPENDED">Suspend shop access</option></>}
            {selected?.status === 'REJECTED' && <><option value="REJECTED">Keep rejected and edit review</option><option value="APPROVED">Approve application</option></>}
            {selected?.status === 'SUSPENDED' && <><option value="SUSPENDED">Keep suspended and edit review</option><option value="APPROVED">Restore shop access</option><option value="REJECTED">Reject application</option></>}
          </TextField>
          <TextField label="Review note shown to applicant" helperText="Required for every decision. You can edit this note later." required slotProps={{ htmlInput: { minLength: 3, maxLength: 1000 } }} multiline minRows={3} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} />
          <TextField select required label="GST declaration review" helperText="Shop approval requires explicit acceptance here. Review the seller’s GSTIN or stated non-registration basis; a reason alone does not establish eligibility." value={gstDecision} disabled={busy} onChange={event => setGstDecision(event.target.value)} slotProps={{ select: { native: true } }}>
            <option value="">Choose a GST review decision</option><option value="APPROVED">Accept for seller onboarding</option><option value="NEEDS_INFO">Request more information</option><option value="REJECTED">Do not accept this declaration</option>
          </TextField>
        </> : <>
          {formMode === 'APPLICATION' && <>
          <TextField label="Shop name" required slotProps={{ htmlInput: { minLength: 2, maxLength: 120 } }} value={name} disabled={busy} onChange={event => setName(event.target.value)} />
          <TextField label="City" required slotProps={{ htmlInput: { minLength: 2, maxLength: 100 } }} value={city} disabled={busy} onChange={event => setCity(event.target.value)} />
          <TextField label="Full business address" required slotProps={{ htmlInput: { minLength: 5, maxLength: 500 } }} multiline minRows={2} value={address} disabled={busy} onChange={event => setAddress(event.target.value)} />
          <TextField label="Business mobile number" type="tel" required slotProps={{ htmlInput: { minLength: 7, maxLength: 20, autoComplete: 'tel' } }} value={phone} disabled={busy} onChange={event => setPhone(event.target.value)} helperText="Include your country code for international numbers." />
          </>}
          <TextField select required label="Is your shop registered for GST?" value={gstRegistration} disabled={busy} onChange={event => { const value = event.target.value; setGstRegistration(value); if (value === 'YES') { setGstNotRegisteredReason(''); setGstOtherReason(''); setGstEnrolmentId('') } else setGstin('') }} slotProps={{ select: { native: true } }}>
            <option value="YES">Yes, I have a GSTIN</option><option value="NO">No, I am not registered</option>
          </TextField>
          {gstRegistration === 'YES' ? <TextField label="GSTIN" required value={gstin} disabled={busy} onChange={event => setGstin(event.target.value.toUpperCase())} slotProps={{ htmlInput: { maxLength: 15, autoCapitalize: 'characters' } }} helperText="Enter the 15-character GST identification number. We will review it; this form does not verify GST Portal status." /> : <>
            <TextField select required label="Why is the shop not GST-registered?" value={gstNotRegisteredReason} disabled={busy} onChange={event => setGstNotRegisteredReason(event.target.value)} slotProps={{ select: { native: true } }}>
              <option value="">Choose a reason</option><option value="BELOW_THRESHOLD">I believe my turnover is below the registration threshold</option><option value="EXEMPT_SUPPLIES">I sell only goods exempt from GST</option><option value="REGISTRATION_IN_PROGRESS">Registration or enrolment is in progress</option><option value="OTHER">Other reason</option>
            </TextField>
            {gstNotRegisteredReason === 'OTHER' && <TextField label="Please explain" required multiline minRows={2} slotProps={{ htmlInput: { minLength: 5, maxLength: 500 } }} value={gstOtherReason} disabled={busy} onChange={event => setGstOtherReason(event.target.value)} />}
            <TextField label="GST Portal enrolment ID (if available)" value={gstEnrolmentId} disabled={busy} onChange={event => setGstEnrolmentId(event.target.value.toUpperCase())} slotProps={{ htmlInput: { maxLength: 30, autoCapitalize: 'characters' } }} helperText="Some unregistered goods sellers using an e-commerce operator may need portal enrolment and must meet other conditions. Add the ID if you have one; Gadgify will review eligibility." />
            <Alert severity="info">Your reason will be recorded for review; it does not by itself confirm eligibility to sell. If your status changes or you receive a GSTIN, contact Gadgify support promptly to update your seller record. Provide a GST Portal enrolment ID if applicable. Eligibility remains subject to review.</Alert>
          </>}
          {formMode === 'APPLICATION' && <TextField label="What do you sell?" required slotProps={{ htmlInput: { minLength: 10, maxLength: 2000 } }} multiline minRows={4} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} />}
          <Typography variant="caption" color="text.secondary">Your shop name will appear in the shop directory after approval. Do not include bank details, passwords or identity documents in this application.</Typography>
        </>}
        {error && <Alert severity="error" role="alert">{error}</Alert>}
        <Button variant="contained" type="submit" disabled={busy || (admin && (!decision || !gstDecision || decision === 'APPROVED' && gstDecision !== 'APPROVED'))}>{busy ? 'Saving…' : admin ? 'Save review' : formMode === 'GST_UPDATE' ? 'Save GST details' : 'Submit application'}</Button>
      </Stack>
    </FormDialog>
  </Stack>
}
