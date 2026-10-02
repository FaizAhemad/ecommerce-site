import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { privateKey, sessionGeneration, sessionSignal } from '../api/sessionScope'
import { useNotification } from './NotificationProvider'
import { FormDialog } from './FormDialog'
import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CircularProgress } from './mui/CircularProgress'
import { Paper } from './mui/Paper'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'
type Message = {
  id: string
  recipientEmail: string
  subject: string
  body: string
  status: string
  createdAt: string
}
export function CustomerMessages() {
  const notify = useNotification(),
    lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    attempt = useRef<string | null>(null)
  const [pending, setPending] = useState(false),
    [saved, setSaved] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [sendError, setSendError] = useState('')
  const [outcome, setOutcome] = useState('')
  const [cursors, setCursors] = useState<string[]>([])
  const cursor = cursors.at(-1)
  const query = useQuery({
    queryKey: privateKey('admin', 'messages', cursor ?? ''),
    queryFn: async ({ signal }) => {
      const response = await apiFetch(`/api/admin/messages${cursor ? `?before=${encodeURIComponent(cursor)}` : ''}`, { signal })
      if (!response.ok) throw new Error('Unable to load message history.')
      return (await response.json()) as { messages: Message[]; nextCursor: string | null }
    },
    retry: false,
  })
  useEffect(() => () => controller.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || saved) return
    const data = new FormData(event.currentTarget)
    attempt.current ??= crypto.randomUUID()
    lock.current = true
    setPending(true)
    setSendError('')
    const abort = new AbortController(), generation = sessionGeneration()
    controller.current = abort
    try {
      const response = await apiFetch('/api/admin/messages', {
        method: 'POST',
        signal: AbortSignal.any([abort.signal, sessionSignal()]),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: attempt.current,
          recipientEmail: data.get('email'),
          subject: data.get('subject'),
          body: data.get('body'),
        }),
      })
      const body = (await response.json()) as {
        message?: { status: string }
        error?: { message?: string }
      }
      if (!response.ok || !body.message)
        throw new Error(
          body.error?.message ?? 'Unable to confirm the message. Check history before retrying.',
        )
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        setSaved(true)
        setOutcome(body.message.status === 'ACCEPTED' ? 'Email accepted by the provider. Delivery is not confirmed.' : 'Message saved; email acceptance is unconfirmed. Check history before sending another message.')
        notify(
          body.message.status === 'ACCEPTED'
            ? 'Email accepted by the provider.'
            : 'Message saved; email acceptance is unconfirmed.',
          body.message.status === 'ACCEPTED' ? 'success' : 'info',
        )
        if (cursors.length) setCursors([])
        else void query.refetch({ cancelRefetch: false })
      }
    } catch (error) {
      if (!abort.signal.aborted && generation === sessionGeneration()) {
        const failure = error instanceof Error ? error : new Error('Unable to confirm message acceptance.')
        setSendError(failure.message)
        notify(failure)
      }
    } finally {
      lock.current = false
      if (!abort.signal.aborted && generation === sessionGeneration()) setPending(false)
    }
  }
  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button type="button" variant="contained" onClick={() => setComposerOpen(true)}>
          {saved ? 'View recorded message' : hasDraft ? 'Continue message draft' : 'Write a customer message'}
        </Button>
      </Stack>
      <FormDialog open={composerOpen} title="Customer message" busy={pending} onClose={() => { if (!lock.current) setComposerOpen(false) }}>
      <Stack component="form" spacing={2} onChange={() => setHasDraft(true)} onSubmit={(event) => void submit(event)}>
        <TextField name="email" label="Verified customer email" type="email" slotProps={{ htmlInput: { maxLength: 254 } }} required disabled={pending || saved} />
        <TextField name="subject" label="Subject" slotProps={{ htmlInput: { maxLength: 120 } }} required disabled={pending || saved} />
        <TextField name="body" label="Message" multiline minRows={6} slotProps={{ htmlInput: { maxLength: 4000 } }} required disabled={pending || saved} />
        <Button variant="contained" disabled={pending || saved}>
          {pending ? 'Sending…' : saved ? 'Message recorded' : 'Send message'}
        </Button>
        {saved && (
          <Button
            type="reset"
            variant="outlined"
            onClick={() => {
              attempt.current = null
              setSaved(false)
              setHasDraft(false)
              setSendError('')
              setOutcome('')
            }}
          >
            Write another message
          </Button>
        )}
        {sendError && <Alert severity="error" role="alert">{sendError}</Alert>}
        {outcome && <Alert severity="info" role="status">{outcome}</Alert>}
        <Typography variant="body2" color="text.secondary">
          Provider acceptance does not confirm inbox delivery. After an interrupted request, check
          history before sending again.
        </Typography>
        {!saved && <Typography variant="caption" color="text.secondary">Closing this drawer keeps the draft while this panel remains open.</Typography>}
      </Stack>
      </FormDialog>
      <Typography component="h2" variant="h6">Message history</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" disabled={pending || query.isFetching || cursors.length === 0} onClick={() => setCursors(values => values.slice(0, -1))}>Newer messages</Button>
        <Button variant="outlined" disabled={pending || query.isFetching || query.isError || !query.data?.nextCursor} onClick={() => { if (query.data?.nextCursor) setCursors(values => [...values, query.data.nextCursor!]) }}>Older messages</Button>
        <Button variant="outlined" disabled={pending || query.isFetching} onClick={() => { setCursors([]); if (!cursors.length) void query.refetch() }}>Refresh latest</Button>
      </Stack>
      {query.isPending ? (
        <Stack role="status" direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary">Loading messages…</Typography></Stack>
      ) : query.isError ? (
        <Alert severity="error" role="alert" action={<Button color="inherit" disabled={query.isFetching} onClick={() => void query.refetch({ cancelRefetch: false })}>Retry</Button>}>Unable to load history.</Alert>
      ) : !query.data?.messages.length ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No messages recorded</Typography></Paper>
      ) : (
        <Stack spacing={1.5}>{query.data.messages.map((message) => (
          <Card variant="outlined" component="article" sx={{ p: 2.5 }} key={message.id}>
            <Stack spacing={1}><Typography component="h3" variant="h6">{message.subject}</Typography>
            <Typography variant="body2" color="text.secondary">{message.recipientEmail}</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</Typography>
            <Typography variant="caption" color="text.secondary">
              {['ACCEPTED', 'SENT'].includes(message.status)
                ? 'Provider accepted (delivery unverified)'
                : 'Email acceptance unconfirmed'}{' '}
              · {new Date(message.createdAt).toLocaleString()}
            </Typography></Stack>
          </Card>
        ))}</Stack>
      )}
    </>
  )
}
