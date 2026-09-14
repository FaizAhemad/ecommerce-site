import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminPolicy, type PolicyKind, type PolicyState } from '../api/policies'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from './NotificationProvider'

export function PolicyEditor() {
  const [kind, setKind] = useState<PolicyKind>('privacy'), [locale, setLocale] = useState('en')
  const query = useQuery({ queryKey: privateKey('admin', 'policy', kind, locale), queryFn: ({ signal }) => adminPolicy(kind, locale, signal), retry: false })
  return <>
    <div className="profile-actions"><label>Policy<select value={kind} onChange={event => setKind(event.target.value as PolicyKind)}>{['privacy','returns','refund','terms','shipping','cancellation','cookies'].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>Language<select value={locale} onChange={event => setLocale(event.target.value)}><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option></select></label></div>
    {query.isPending ? <p role="status">Loading policy…</p> : query.isError ? <div role="alert"><p>Unable to load the policy.</p><button className="secondary-button" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</button></div> : query.data && <PolicyForm key={`${kind}:${locale}:${query.data.version}`} kind={kind} locale={locale} state={query.data} />}
  </>
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
  return <form className="payment-form" onSubmit={event => { event.preventDefault(); void save('draft', event.currentTarget) }}>
    <p>{state.published ? `Published version ${state.published.version}` : 'No approved policy is published in this language.'} Draft changes remain private until publication.</p>
    <label>Policy title<input name="title" defaultValue={state.draft?.title ?? ''} maxLength={120} required disabled={pending}/></label>
    <label>Approved source text<textarea name="text" defaultValue={state.draft?.text ?? ''} rows={16} maxLength={50000} required disabled={pending}/></label>
    <label><input name="approved" type="checkbox" disabled={pending}/> I confirm the saved text is approved for publication for this business and language.</label>
    <div className="profile-actions"><button className="secondary-button" disabled={pending}>{pending ? 'Saving…' : 'Save draft'}</button><button className="primary-button" type="button" disabled={pending || !state.draft} onClick={event => { if (event.currentTarget.form) void save('publish', event.currentTarget.form) }}>Publish saved draft</button></div>
    <p>Enter approved policy content. This editor does not supply legal advice or generate policy rules.</p>
  </form>
}
