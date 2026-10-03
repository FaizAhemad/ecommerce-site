import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { privateKey } from '../api/sessionScope'
import { getEmailStatus, submitEmailVerification } from '../api/emailVerification'
import { cleanResetUrl, readResetToken } from '../api/passwordRecovery'
import { useNotification } from '../components/NotificationProvider'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

export function EmailVerificationPage({
  isAuthenticated,
  onNavigate,
}: {
  isAuthenticated: boolean
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const [token, setToken] = useState(() => readResetToken(window.location.href))
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<'sent' | 'verified' | null>(null)
  const [error, setError] = useState('')
  const operation = useRef<AbortController | null>(null)
  const notify = useNotification()
  const status = useQuery({
    queryKey: privateKey('email-status'),
    queryFn: ({ signal }) => getEmailStatus(signal),
    enabled: isAuthenticated,
    staleTime: 0,
  })
  useEffect(() => {
    window.history.replaceState(window.history.state, '', cleanResetUrl(window.location.href))
    return () => operation.current?.abort()
  }, [])
  const submit = async (verify: boolean) => {
    if (operation.current || (verify && !token)) return
    const controller = new AbortController()
    operation.current = controller
    setPending(true)
    setError('')
    try {
      const outcome = await submitEmailVerification(verify ? token : null, controller.signal)
      if (controller.signal.aborted) return
      setResult(outcome)
      if (verify) setToken('')
      if (isAuthenticated) void status.refetch()
      notify(
        outcome === 'verified'
          ? 'Email verification completed.'
          : 'Verification email requested. Check your inbox and spam folder.',
        'success',
      )
    } catch (failure) {
      if (!controller.signal.aborted) {
        const message =
          failure instanceof Error ? failure.message : 'Unable to complete verification.'
        setError(message)
        notify(failure instanceof Error ? failure : message)
      }
    } finally {
      operation.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <section className="page-section auth-page" aria-labelledby="verification-title">
      <div className="auth-card">
        <p className="eyebrow">ACCOUNT EMAIL</p>
        <h1 id="verification-title">Email verification</h1>
        {result && (
          <Alert role="status" severity={result === 'verified' ? 'success' : 'info'}>
            {result === 'verified'
              ? 'The email linked to this verification request is now verified.'
              : 'Check your inbox and spam folder. Use the newest link within 24 hours.'}
          </Alert>
        )}
        {error && (
          <Alert role="alert" severity="error">
            {error}
          </Alert>
        )}
        {token && (
          <Stack spacing={2}>
            <Typography>Confirm the email associated with the link you opened.</Typography>
            <Button variant="contained" disabled={pending} aria-busy={pending} onClick={() => void submit(true)}>
              {pending ? 'Verifying email…' : 'Verify email'}
            </Button>
          </Stack>
        )}
        {isAuthenticated ? (
          status.isPending ? (
            <Alert role="status" severity="info">Loading your email status…</Alert>
          ) : status.isError ? (
            <Alert severity="error" action={
              <Button
                color="inherit"
                disabled={status.isFetching}
                onClick={() => void status.refetch()}
              >
                Retry status
              </Button>
            }>Unable to load your email status.</Alert>
          ) : (
            status.data && (
              <Stack spacing={1.5}>
                <Typography>
                  {status.data.email
                    ? `Account email: ${status.data.email}`
                    : 'This account has no email address. Email verification is unavailable.'}
                </Typography>
                {status.data.email && (
                  <>
                    <Alert severity={status.data.emailVerified ? 'success' : 'warning'}>
                      {status.data.emailVerified ? 'Email verified' : 'Email not verified'}
                    </Alert>
                    {!status.data.emailVerified && (
                      <Button
                        variant="outlined"
                        disabled={pending}
                        aria-busy={pending}
                        onClick={() => void submit(false)}
                      >
                        {pending ? 'Requesting link…' : 'Send a new verification link'}
                      </Button>
                    )}
                  </>
                )}
              </Stack>
            )
          )
        ) : (
          <p className="auth-switch">
            <a href="/login" onClick={onNavigate('/login')}>
              Sign in to view your email status or request a new link
            </a>
          </p>
        )}
        {!token && !result && (
          <p>Open the verification link from your email, or sign in and request a new one.</p>
        )}
        <p className="auth-switch">
          <a href="/" onClick={onNavigate('/')}>
            Back to home
          </a>
        </p>
      </div>
    </section>
  )
}
