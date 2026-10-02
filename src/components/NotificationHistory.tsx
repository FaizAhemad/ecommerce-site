import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { Chip } from './mui/Chip'
import { CircularProgress } from './mui/CircularProgress'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'
type Item = { id: string; orderId: string; kind: string; status: string; updatedAt: string; attempts?: number; availableAt?: string; legacy: boolean }
const labels: Record<string, string> = { ACCEPTED: 'Provider accepted', PENDING: 'Queued', PROCESSING: 'Processing', RETRY: 'Waiting to retry', FAILED: 'Provider rejected', UNCONFIRMED: 'Unconfirmed — investigate before taking action', SKIPPED: 'Skipped — verified recipient unavailable', BLOCKED: 'Blocked — configuration requires investigation' }
export function NotificationHistory() {
  const lock = useRef(false)
  const active = useRef<AbortController | null>(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => () => active.current?.abort(), [])
  const query = useInfiniteQuery({ queryKey: privateKey('admin', 'notifications'), initialPageParam: 0, retry: false,
    queryFn: async ({ signal, pageParam }) => {
      const response = await apiFetch('/api/admin/notifications?page=' + pageParam, { signal })
      const body = await response.json() as { notifications: Item[]; nextPage: number | null; configured: boolean; supportConfigured?: boolean }
      if (!response.ok || !Array.isArray(body.notifications)) throw new Error('Unable to load notification history.')
      return body
    }, getNextPageParam: (page) => page.nextPage ?? undefined,
  })
  const items = [...new Map((query.data?.pages.flatMap((page) => page.notifications) ?? []).map((item) => [item.id, item])).values()]
  async function processDue() {
    if (lock.current) return
    lock.current = true
    const generation = sessionGeneration()
    const controller = new AbortController()
    active.current = controller
    setProcessing(true)
    setMessage('')
    try {
      const response = await apiFetch('/api/admin/notifications', { method: 'POST', signal: AbortSignal.any([controller.signal, sessionSignal()]) })
      if (!response.ok) throw new Error('Processing outcome is uncertain. Refresh history before taking further action.')
      if (generation !== sessionGeneration() || controller.signal.aborted) return
      setMessage('Due batch processed. Check individual statuses; acceptance does not confirm delivery.')
      await query.refetch({ cancelRefetch: false })
    } catch {
      if (generation === sessionGeneration() && !controller.signal.aborted) setMessage('Unable to confirm processing. Refresh notification history.')
    } finally {
      lock.current = false
      if (generation === sessionGeneration() && !controller.signal.aborted) setProcessing(false)
    }
  }
  return <Stack spacing={2}>
    <Alert severity="info">Order, shop shipment, return and dispute emails. Accepted does not confirm inbox delivery. Queued messages support bounded retries; legacy and unconfirmed attempts are never replayed automatically.</Alert>
    {query.data?.pages[0]?.supportConfigured === false && <Alert severity="warning">The private support inbox is not configured. Staff dispute notifications will wait; saved conversations remain available.</Alert>}
    {query.data?.pages[0]?.configured === false && <Alert severity="warning">Email provider configuration is missing. Queued messages wait for configuration.</Alert>}
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button variant="contained" disabled={processing || !query.data?.pages[0]?.configured} onClick={() => void processDue()}>{processing ? 'Processing…' : 'Process due notifications'}</Button>
      <Button variant="outlined" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Refresh notification history</Button>
    </Stack>
    {message && <Alert severity="info" role="status">{message}</Alert>}
    {query.isPending && <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading notifications…</Typography></Stack>}
    {query.isError && <Alert severity="error" role="alert">Notification history is unavailable.</Alert>}
    {!query.isPending && !query.isError && !items.length && <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No notification records</Typography></Paper>}
    {items.map((item) => <Card variant="outlined" component="article" key={item.id} sx={{ p: { xs: 2, sm: 2.5 } }}><Stack spacing={1}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}><Typography component="h2" variant="h6">{item.kind.replaceAll('_', ' ')}</Typography><Chip size="small" label={labels[item.status] ?? 'Unknown status'} color={item.status === 'ACCEPTED' ? 'success' : ['FAILED', 'BLOCKED'].includes(item.status) ? 'error' : 'default'} /></Stack><Typography variant="body2">Order ID: {item.orderId}</Typography>{item.legacy && <Alert severity="warning">Legacy attempt; it will not be replayed.</Alert>}{item.attempts !== undefined && <Typography variant="body2">Attempts: {item.attempts} / 5</Typography>}{item.status === 'RETRY' && item.availableAt && <Typography variant="body2">Eligible after: {new Date(item.availableAt).toLocaleString()}</Typography>}<Typography variant="caption" color="text.secondary">Updated {new Date(item.updatedAt).toLocaleString()}</Typography></Stack></Card>)}
    {query.hasNextPage && <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={query.isFetching} onClick={() => void query.fetchNextPage({ cancelRefetch: false })}>Load more notifications</Button>}
  </Stack>
}
