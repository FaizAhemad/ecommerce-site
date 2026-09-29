import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { Alert } from './mui/Alert'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { MenuItem } from './mui/MenuItem'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

type ReturnItem = { id: string; reason: string; status: string; resolution: string | null; createdAt: string; order: { orderNumber: string }; user: { name: string | null; email: string | null } }
export function ReturnRequests() {
  const notify = useNotification(), lock = useRef(false), controller = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  const query = useQuery({ queryKey: privateKey('admin', 'returns'), queryFn: async ({ signal }) => {
    const response = await apiFetch('/api/admin/returns', { signal })
    if (!response.ok) throw new Error('Unable to load return requests.')
    return await response.json() as { returns: ReturnItem[] }
  }, retry: false })
  useEffect(() => () => controller.current?.abort(), [])
  async function review(item: ReturnItem, form: HTMLFormElement) {
    if (lock.current) return false
    lock.current = true; setPending(true)
    const data = new FormData(form), abort = new AbortController(); controller.current = abort
    try {
      const response = await apiFetch('/api/admin/returns', { method: 'PATCH', signal: abort.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnId: item.id, expectedStatus: item.status, status: data.get('status'), resolution: data.get('resolution') }) })
      const body = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to save the decision.')
      if (!abort.signal.aborted) { notify('Return decision recorded. No refund or stock change was made.', 'success'); void query.refetch({ cancelRefetch: false }); return true }
    } catch (error) { if (!abort.signal.aborted) notify(error instanceof Error ? error : new Error('Unable to save the decision.')) }
    finally { lock.current = false; if (!abort.signal.aborted) setPending(false) }
    return false
  }
  if (query.isPending) return <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading return requests…</Typography></Stack>
  if (query.isError) return <Alert severity="error" action={<Button variant="outlined" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load return requests.</Alert>
  if (!query.data?.returns.length) return <Card variant="outlined" sx={{ p: 3 }}><Typography color="text.secondary">No return requests recorded.</Typography></Card>
  return <Stack spacing={2}><Typography color="text.secondary">Latest 100 requests. Review each request against the approved policy. Approval does not refund money or restock items.</Typography>{query.data.returns.map((item) => <ReturnReview key={item.id + item.status} item={item} disabled={pending} review={review} />)}</Stack>
}
function ReturnReview({ item, disabled, review }: { item: ReturnItem; disabled: boolean; review: (item: ReturnItem, form: HTMLFormElement) => Promise<boolean> }) {
  const [saved, setSaved] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await review(item, event.currentTarget)) setSaved(true) }
  return <Card component="article" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
    <Typography component="h3" variant="h6">Order {item.order.orderNumber}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.user.name ?? 'Customer'}{item.user.email ? ` · ${item.user.email}` : ''}</Typography>
    <Typography sx={{ mt: 1.5 }}>{item.reason}</Typography>
    <Typography variant="body2" sx={{ mt: 1 }}>Status: {item.status}</Typography>
    {item.resolution && <Typography variant="body2" sx={{ mt: 0.5 }}>Decision: {item.resolution}</Typography>}
    {item.status === 'REQUESTED' && !saved && <Stack component="form" spacing={2} onSubmit={(event) => void submit(event)} sx={{ mt: 2 }}>
      <TextField select name="status" label="Decision" required disabled={disabled} defaultValue=""><MenuItem value="" disabled>Choose a decision</MenuItem><MenuItem value="APPROVED">Approve</MenuItem><MenuItem value="REJECTED">Reject</MenuItem></TextField>
      <TextField name="resolution" label="Reason" multiline minRows={3} maxRows={8} slotProps={{ htmlInput: { maxLength: 2000 } }} required disabled={disabled} />
      <Box><Button variant="contained" type="submit" disabled={disabled}>{disabled ? 'Saving…' : 'Record decision'}</Button></Box>
    </Stack>}
    {saved && <Alert severity="success" role="status" sx={{ mt: 2 }}>Decision saved.</Alert>}
  </Card>
}
