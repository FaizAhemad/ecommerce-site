import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminPolicy, type PolicyKind, type PolicyState } from '../api/policies'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Checkbox } from './mui/Checkbox'
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

export function PolicyEditor() {
  const [kind, setKind] = useState<PolicyKind>('privacy'), [locale, setLocale] = useState('en')
  const query = useQuery({ queryKey: privateKey('admin', 'policy', kind, locale), queryFn: ({ signal }) => adminPolicy(kind, locale, signal), retry: false })
  return <Stack spacing={2.5}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <FormControl fullWidth><InputLabel id="policy-kind-label">Policy</InputLabel><Select labelId="policy-kind-label" label="Policy" value={kind} onChange={event => setKind(event.target.value as PolicyKind)}>{['privacy','returns','refund','terms','shipping','cancellation','cookies'].map(value => <MenuItem key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</MenuItem>)}</Select></FormControl>
      <FormControl fullWidth><InputLabel id="policy-locale-label">Language</InputLabel><Select labelId="policy-locale-label" label="Language" value={locale} onChange={event => setLocale(String(event.target.value))}><MenuItem value="en">English</MenuItem><MenuItem value="hi">Hindi</MenuItem><MenuItem value="mr">Marathi</MenuItem></Select></FormControl>
    </Stack>
    {query.isPending ? <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading policy…</Typography></Stack> : query.isError ? <Alert severity="error" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load the policy.</Alert> : query.data && <PolicyForm key={`${kind}:${locale}:${query.data.version}`} kind={kind} locale={locale} state={query.data} />}
  </Stack>
}
function PolicyForm({ kind, locale, state }: { kind: PolicyKind; locale: string; state: PolicyState }) {
  const notify = useNotification(), lock = useRef(false), controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  useEffect(() => () => controller.current?.abort(), [])
  async function save(action: 'draft' | 'publish', form: HTMLFormElement) {
    if (lock.current || !form.reportValidity()) return
    const fields = new FormData(form), title = String(fields.get('title') ?? '').trim(), text = String(fields.get('text') ?? '').trim()
    if (action === 'publish' && (title !== state.draft?.title || text !== state.draft?.text)) { notify('Save the current draft before publishing it.'); return }
    lock.current = true; setPending(true)
    const abort = new AbortController(); controller.current = abort
    try {
      const next = await adminPolicy(kind, locale, abort.signal, { action, title, text, expectedVersion: state.version, approved: fields.get('approved') === 'on' })
      if (!abort.signal.aborted) {
        queryClient.setQueryData(privateKey('admin', 'policy', kind, locale), next)
        void queryClient.invalidateQueries({ queryKey: ['policy', kind, locale] })
        notify(action === 'publish' ? 'Policy published.' : 'Draft saved. Published text is unchanged.', 'success')
      }
    } catch (error) { if (!abort.signal.aborted) notify(error instanceof Error ? error : new Error('Unable to save the policy.')) }
    finally { lock.current = false; if (!abort.signal.aborted) setPending(false) }
  }
  return <Paper component="form" variant="outlined" onSubmit={event => { event.preventDefault(); void save('draft', event.currentTarget) }} sx={{ p: { xs: 2, sm: 3 } }}>
    <Stack spacing={2}>
      <Alert severity={state.published ? 'success' : 'info'}>{state.published ? `Published version ${state.published.version}` : 'No approved policy is published in this language.'} Draft changes remain private until publication.</Alert>
      <TextField name="title" label="Policy title" defaultValue={state.draft?.title ?? ''} slotProps={{ htmlInput: { maxLength: 120 } }} required disabled={pending} />
      <TextField name="text" label="Approved source text" defaultValue={state.draft?.text ?? ''} multiline minRows={12} slotProps={{ htmlInput: { maxLength: 50000 } }} required disabled={pending} />
      <FormControlLabel control={<Checkbox name="approved" disabled={pending} />} label="I confirm the saved text is approved for publication for this business and language." />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><Button variant="outlined" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save draft'}</Button><Button variant="contained" type="button" disabled={pending || !state.draft} onClick={event => { if (event.currentTarget.form) void save('publish', event.currentTarget.form) }}>Publish saved draft</Button></Stack>
      <Typography variant="caption" color="text.secondary">Enter approved policy content. This editor does not supply legal advice or generate policy rules.</Typography>
    </Stack>
  </Paper>
}
