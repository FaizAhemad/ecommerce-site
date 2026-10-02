import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'
import { useNotification } from './NotificationProvider'

type Feedback = { rating: number; comment: string; createdAt: string; orderNumber?: string }
type State = { eligible: boolean; orderNumber: string | null; feedback: Feedback | null }
async function read<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await apiFetch(path, { signal })
  if (!response.ok) throw new Error('Feedback is temporarily unavailable.')
  return response.json() as Promise<T>
}
export function PurchaseFeedback() {
  const notify = useNotification()
  const lock = useRef(false), controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false), [saved, setSaved] = useState(false)
  const query = useQuery({ queryKey: privateKey('purchase-feedback'), queryFn: ({ signal }) => read<State>('/api/feedback', signal), retry: false })
  useEffect(() => () => controller.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || saved) return
    const fields = new FormData(event.currentTarget)
    lock.current = true; setPending(true)
    const abort = new AbortController(); controller.current = abort
    try {
      const response = await apiFetch('/api/feedback', { method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: Number(fields.get('rating')), comment: fields.get('comment') }) })
      const body = await response.json() as { feedback?: Feedback; error?: { message?: string } }
      if (!response.ok || !body.feedback) throw new Error(body.error?.message ?? 'Unable to confirm feedback. Check before trying again.')
      if (!abort.signal.aborted) { setSaved(true); notify('Thank you. Your feedback has been recorded.', 'success'); void query.refetch({ cancelRefetch: false }) }
    } catch (error) { if (!abort.signal.aborted) notify(error instanceof Error ? error : new Error('Unable to save feedback.')) }
    finally { lock.current = false; if (!abort.signal.aborted) setPending(false) }
  }
  if (query.isPending) return <p className="m-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]" role="status">Checking purchase feedback…</p>
  if (query.isError) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert"><p className="mb-3">Purchase feedback is temporarily unavailable. Your order is unaffected.</p><button className="secondary-button" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry feedback</button></div>
  if (saved || query.data?.feedback) return <p className="m-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--ink)]" role="status">Thank you for sharing your purchase experience.</p>
  if (!query.data?.eligible) return null
  return <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6" aria-labelledby="feedback-title">
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">Private order feedback</p>
    <h2 id="feedback-title" className="!mb-2 !mt-0 !text-2xl !font-normal !leading-tight !tracking-tight text-[var(--ink)] sm:!text-3xl">How was your purchase?</h2>
    <p className="mb-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">Share feedback about order <span className="font-mono text-xs">{query.data.orderNumber}</span>. It is visible to Gadgify administrators and is not a product review.</p>
    <form className="grid max-w-2xl gap-4" onSubmit={event => void submit(event)}>
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Your experience<select className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-base text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-60" name="rating" required defaultValue="" disabled={pending}><option value="" disabled>Choose a rating</option>{[1,2,3,4,5].map(rating => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]"><span>Comments <span className="font-normal text-[var(--muted)]">(optional)</span></span><textarea className="min-h-28 w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-base leading-6 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-60" name="comment" maxLength={2000} rows={4} disabled={pending} /></label>
      <button className="primary-button w-fit" disabled={pending}>{pending ? 'Saving feedback…' : 'Share feedback'}</button>
    </form>
  </section>
}
export function AdminFeedback() {
  const query = useQuery({ queryKey: privateKey('admin', 'feedback'), queryFn: ({ signal }) => read<{ feedback: Feedback[] }>('/api/admin/feedback', signal), retry: false })
  if (query.isPending) return <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading purchase feedback…</Typography></Stack>
  if (query.isError) return <Alert severity="error" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load feedback.</Alert>
  if (!query.data?.feedback.length) return <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No purchase feedback recorded</Typography></Paper>
  return <Stack spacing={2}><Typography color="text.secondary">Latest 100 first-purchase responses. This customer feedback is private.</Typography>{query.data.feedback.map(item => <Card variant="outlined" component="article" key={item.orderNumber} sx={{ p: { xs: 2, sm: 2.5 } }}><Stack spacing={1}><Typography component="h2" variant="h6">Order {item.orderNumber}</Typography><Typography>Experience: {item.rating} / 5</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.comment || 'No written comment.'}</Typography><Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString()}</Typography></Stack></Card>)}</Stack>
}
