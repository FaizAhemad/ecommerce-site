import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import {
  cleanResetUrl,
  passwordValidation,
  readResetToken,
  submitPasswordRecovery,
} from '../api/passwordRecovery'
import { useNotification } from '../components/NotificationProvider'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Stack } from '../components/mui/Stack'
import { TextField } from '../components/mui/TextField'

type Props = {
  mode: 'forgot' | 'reset'
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}

export function PasswordRecoveryPage({ mode, onNavigate }: Props) {
  const reset = mode === 'reset'
  const [token] = useState(() => (reset ? readResetToken(window.location.href) : ''))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const operation = useRef<AbortController | null>(null)
  const notify = useNotification()
  useEffect(() => {
    if (reset)
      window.history.replaceState(window.history.state, '', cleanResetUrl(window.location.href))
    return () => operation.current?.abort()
  }, [reset])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (operation.current || accepted) return
    setErrorMessage('')
    if (reset) {
      const error = passwordValidation(password, confirmation)
      if (error) {
        setErrorMessage(error)
        return
      }
      if (!token) {
        setErrorMessage('Open a valid reset link from your email.')
        return
      }
    }
    const controller = new AbortController()
    operation.current = controller
    setPending(true)
    try {
      await submitPasswordRecovery(mode, { email, token, password }, controller.signal)
      if (controller.signal.aborted) return
      setPassword('')
      setConfirmation('')
      setAccepted(true)
      if (reset) {
        // Full navigation discards private caches/drafts after server-confirmed revocation.
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('gadgify-session')
          channel.postMessage('changed')
          channel.close()
        }
        window.location.assign('/login?passwordReset=success')
      } else {
        notify('If an account uses that email, you will receive a password reset link.', 'success')
      }
    } catch (error) {
      if (!controller.signal.aborted) setErrorMessage(error instanceof Error ? error.message : 'Unable to complete this request.')
    } finally {
      operation.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <section className="page-section auth-page" aria-labelledby="recovery-title">
      <div className="auth-card">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1 id="recovery-title">{reset ? 'Reset your password' : 'Forgot your password?'}</h1>
        <p className="hero-text">
          {reset
            ? 'Choose a new password. You will need to sign in again on your devices.'
            : 'Enter your account email to request a reset link. Links expire after one hour.'}
        </p>
        {reset && !token ? (
          <div className="state-message">
            <p>This reset link is missing or invalid. Request a new link to continue.</p>
            <a href="/forgot-password" onClick={onNavigate('/forgot-password')}>
              Request a reset link
            </a>
          </div>
        ) : accepted && !reset ? (
          <div role="status" className="state-message">
            <p>
              If an account uses that email, you will receive a reset link. Check your inbox and
              spam folder.
            </p>
            <Button variant="outlined" onClick={() => setAccepted(false)}>
              Use another email or request again
            </Button>
          </div>
        ) : (
          <Stack component="form" className="auth-form" spacing={2} onSubmit={submit} aria-busy={pending}>
            {errorMessage && <Alert severity="error" role="alert">{errorMessage}</Alert>}
            {reset ? (
              <>
                <TextField name="password" label="New password" type="password" autoComplete="new-password" required slotProps={{ htmlInput: { minLength: 8, maxLength: 128, 'aria-describedby': 'password-help' } }} value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} fullWidth />
                <p id="password-help">Use 8–128 characters. A long, unique password is best.</p>
                <TextField name="confirmation" label="Confirm new password" type="password" autoComplete="new-password" required slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} fullWidth />
              </>
            ) : (
              <TextField name="email" label="Email address" type="email" autoComplete="email" required slotProps={{ htmlInput: { maxLength: 254 } }} value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} fullWidth />
            )}
            <Button className="auth-submit" variant="contained" type="submit" disabled={pending || accepted}>
              {pending
                ? reset
                  ? 'Resetting password…'
                  : 'Sending request…'
                : reset
                  ? 'Reset password'
                  : 'Send reset link'}
            </Button>
          </Stack>
        )}
        <p className="auth-switch">
          <a href="/login" onClick={onNavigate('/login')}>
            Back to sign in
          </a>
        </p>
        {reset && token && !accepted && (
          <p className="auth-switch">
            <a href="/forgot-password" onClick={onNavigate('/forgot-password')}>
              Request a new reset link
            </a>
          </p>
        )}
      </div>
    </section>
  )
}
