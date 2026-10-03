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
import { TextField } from './mui/TextField'
import { MenuItem } from './mui/MenuItem'
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
  if (query.isPending) return <Alert severity="info" role="status"><CircularProgress size={16} sx={{ mr: 1 }} />Checking purchase feedback…</Alert>
  if (query.isError) return <Alert severity="warning" role="alert" action={<Button color="inherit" size="small" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry feedback</Button>}>Purchase feedback is temporarily unavailable. Your order is unaffected.</Alert>
  if (saved || query.data?.feedback) return <Alert severity="success" role="status">Thank you for sharing your purchase experience.</Alert>
  if (!query.data?.eligible) return null
  return <Card component="section" variant="outlined" aria-labelledby="feedback-title" sx={{ p: { xs: 2, sm: 3 } }}>
    <Stack spacing={1.5}>
      <Typography variant="overline" color="text.secondary">Private order feedback</Typography>
      <Typography component="h2" id="feedback-title" variant="h4">How was your purchase?</Typography>
      <Typography variant="body2" color="text.secondary">Share feedback about order <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>{query.data.orderNumber}</Typography>. It is visible to Gadgify administrators and is not a product review.</Typography>
      <Stack component="form" spacing={2} sx={{ maxWidth: 640 }} onSubmit={event => void submit(event)}>
        <TextField select name="rating" label="Your experience" required defaultValue="" disabled={pending}>
          <MenuItem value="" disabled>Choose a rating</MenuItem>{[1,2,3,4,5].map(rating => <MenuItem key={rating} value={rating}>{rating} / 5</MenuItem>)}
        </TextField>
        <TextField name="comment" label="Comments (optional)" helperText="Feedback is private and is not shown as a product review." multiline minRows={4} maxRows={8} slotProps={{ htmlInput: { maxLength: 2000 } }} disabled={pending} />
        <Button variant="contained" type="submit" disabled={pending} sx={{ alignSelf: 'flex-start' }}>{pending && <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />}{pending ? 'Saving feedback…' : 'Share feedback'}</Button>
      </Stack>
    </Stack>
  </Card>
}
export function AdminFeedback() {
  const query = useQuery({ queryKey: privateKey('admin', 'feedback'), queryFn: ({ signal }) => read<{ feedback: Feedback[] }>('/api/admin/feedback', signal), retry: false })
  if (query.isPending) return <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading purchase feedback…</Typography></Stack>
  if (query.isError) return <Alert severity="error" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load feedback.</Alert>
  if (!query.data?.feedback.length) return <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No purchase feedback recorded</Typography></Paper>
  return <Stack spacing={2}><Typography color="text.secondary">Latest 100 first-purchase responses. This customer feedback is private.</Typography>{query.data.feedback.map(item => <Card variant="outlined" component="article" key={item.orderNumber} sx={{ p: { xs: 2, sm: 2.5 } }}><Stack spacing={1}><Typography component="h2" variant="h6">Order {item.orderNumber}</Typography><Typography>Experience: {item.rating} / 5</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.comment || 'No written comment.'}</Typography><Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString()}</Typography></Stack></Card>)}</Stack>
}
