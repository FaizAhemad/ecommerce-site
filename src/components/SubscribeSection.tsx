import { useNotification } from './NotificationProvider'
import { subscribeToNewsletter } from '../api/newsletter'
import { useRef, useState, type FormEvent } from 'react'
import { Alert } from './mui/Alert'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { Card } from './mui/Card'
import { CardContent } from './mui/CardContent'
import { Stack } from './mui/Stack'
import { TextField } from './mui/TextField'
import { Typography } from './mui/Typography'

export function SubscribeSection() {
  const notify = useNotification()
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [confirmationFailed, setConfirmationFailed] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || status === 'success') return
    submitting.current = true
    setStatus('loading')
    try {
      const result = await subscribeToNewsletter(email)
      setStatus('success')
      setAlreadySubscribed(result.alreadySubscribed === true)
      setConfirmationFailed(result.confirmationFailed === true)
      if (!result.alreadySubscribed) setEmail('')
      notify(
        result.alreadySubscribed
          ? 'This email is already subscribed.'
          : result.confirmationFailed
            ? 'You are subscribed, but we could not confirm the email was sent. No need to subscribe again.'
            : result.emailSent
              ? 'You are subscribed. A confirmation email is on its way.'
              : 'You are subscribed.',
        result.alreadySubscribed ? 'error' : result.confirmationFailed ? 'info' : 'success',
      )
    } catch (error) {
      setStatus('error')
      notify(error instanceof Error ? error : 'We could not subscribe you right now. Please try again.')
    } finally {
      submitting.current = false
    }
  }

  return (
    <Card component="section" aria-labelledby="subscribe-title" sx={{ background: 'linear-gradient(115deg, #eef0e6, #fffefa 78%)', boxShadow: 'none' }}>
      <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr minmax(300px, .85fr)' }, alignItems: 'center', gap: { xs: 3, md: 6 }, p: { xs: 2.5, md: 4 }, '&:last-child': { pb: { xs: 2.5, md: 4 } } }}>
        <Box>
          <Typography component="p" sx={{ mb: 1, color: 'success.dark', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Stay in the loop
          </Typography>
          <Typography component="h2" id="subscribe-title" sx={{ mb: 1.25, fontSize: 'clamp(1.7rem, 3vw, 2.35rem)', fontWeight: 500, lineHeight: 1.12, letterSpacing: '-.04em' }}>
            Good things, occasionally.
          </Typography>
          <Typography sx={{ maxWidth: 520, color: 'text.secondary' }}>
            New arrivals, thoughtful edits, and useful ideas delivered to your inbox.
          </Typography>
        </Box>
        <Stack component="form" spacing={1.5} onSubmit={submit}>
          {(alreadySubscribed || confirmationFailed) && <Alert severity="info">{confirmationFailed ? 'Your subscription was saved, but we could not confirm that the welcome email was sent. You do not need to sign up again. You can enter a different email below.' : 'This email is already subscribed. You can edit the address to try another.'}</Alert>}
          {status === 'error' && <Alert severity="error">We couldn’t subscribe you right now. Please try again.</Alert>}
          <TextField
            id="subscribe-email"
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setStatus('idle')
              setAlreadySubscribed(false)
              setConfirmationFailed(false)
            }}
            placeholder="you@example.com"
            disabled={status === 'loading' || (status === 'success' && !alreadySubscribed && !confirmationFailed)}
            autoComplete="email"
          />
          <Button
            type={alreadySubscribed || confirmationFailed ? 'button' : 'submit'}
            variant="contained"
            disabled={status === 'loading' || (status === 'success' && !alreadySubscribed && !confirmationFailed)}
            aria-busy={status === 'loading'}
            onClick={alreadySubscribed || confirmationFailed ? () => {
              setEmail('')
              setStatus('idle')
              setAlreadySubscribed(false)
              setConfirmationFailed(false)
            } : undefined}
            endIcon={<Box component="span" aria-hidden="true" sx={{ fontSize: 18 }}>→</Box>}
            sx={{ minHeight: 48, alignSelf: { sm: 'flex-end' }, px: 2.5 }}
          >
            {status === 'loading' ? 'Joining…' : alreadySubscribed || confirmationFailed ? 'Try another email' : status === 'success' ? 'Subscribed' : 'Subscribe'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
