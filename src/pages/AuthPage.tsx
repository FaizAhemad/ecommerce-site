import type { SessionUser } from '../api/sessionScope'
import { useNotification } from '../components/NotificationProvider'
import { apiFetch as fetch, ApiRateLimitError } from '../api/http'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { ButtonGroup } from '../components/mui/ButtonGroup'
import { Stack } from '../components/mui/Stack'
import { TextField } from '../components/mui/TextField'

type Props = {
  mode: 'login' | 'signup'
  storefront: StorefrontApiResponse
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
  onLogin: (user: SessionUser) => void
}

export function AuthPage({ mode, storefront, onNavigate, onLogin }: Props) {
  const submitLock = useRef(false)
  const signup = mode === 'signup'
  const copy = storefront.content.auth
  const [method, setMethod] = useState<'email' | 'mobile'>('email')
  const notify = useNotification()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    setPassword('')
    setErrorMessage('')
  }, [mode, method])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    setErrorMessage('')
    const formElement = event.currentTarget
    const values = new FormData(formElement)
    const contact = String(values.get('contact') ?? '')
    const enteredPassword = String(values.get('password') ?? '')
    const payload = signup
      ? {
          name: values.get('name'),
          password: enteredPassword,
          verificationMethod: method,
          ...(method === 'mobile' ? { phone: contact } : { email: contact }),
        }
      : { identifier: contact, password: enteredPassword }
    try {
      const result = await fetch(signup ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const resultBody = (await result.json().catch(() => null)) as
        | { user?: SessionUser; error?: { message?: string } }
        | null
      if (!result.ok)
        throw new Error(
          typeof resultBody?.error?.message === 'string'
            ? resultBody.error.message
            : 'Unable to complete authentication. Please try again.',
        )
      const authenticatedUser = resultBody?.user
      if (!authenticatedUser?.id) throw new Error('Invalid session response')
      formElement.reset()
      setPassword('')
      onLogin(authenticatedUser)
      notify(signup ? copy.signupSuccess : copy.loginSuccess, 'success')
    } catch (error) {
      setErrorMessage(error instanceof ApiRateLimitError || error instanceof Error
        ? error.message
        : 'Unable to complete authentication. Please try again.')
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }
  return (
    <section className="page-section auth-page" aria-labelledby="auth-title">
      <div className="auth-card">
        <p className="eyebrow">{signup ? copy.signupEyebrow : copy.loginEyebrow}</p>
        <h1 id="auth-title">{signup ? copy.signupTitle : copy.loginTitle}</h1>
        <p className="hero-text">{signup ? copy.signupDescription : copy.loginDescription}</p>
        {!signup &&
          new URLSearchParams(window.location.search).get('passwordReset') === 'success' && (
            <p role="status">Your password has been reset. Sign in with your new password.</p>
          )}
        <ButtonGroup aria-label="Sign-in contact method" fullWidth variant="outlined" sx={{ mb: 2 }}>
          <Button type="button" aria-pressed={method === 'email'} variant={method === 'email' ? 'contained' : 'outlined'} onClick={() => setMethod('email')}>Email</Button>
          <Button type="button" aria-pressed={method === 'mobile'} variant={method === 'mobile' ? 'contained' : 'outlined'} onClick={() => setMethod('mobile')}>Mobile</Button>
        </ButtonGroup>
        <Stack component="form" className="auth-form" spacing={2} onSubmit={submit} aria-busy={submitting}>
          {errorMessage && <Alert severity="error" role="alert">{errorMessage}</Alert>}
          {signup && (
            <TextField name="name" label={copy.fullNameLabel} required autoComplete="name" slotProps={{ htmlInput: { minLength: 2, maxLength: 100 } }} fullWidth />
          )}
          {method === 'mobile' ? (
            <TextField name="contact" label={copy.mobileLabel} required type="tel" autoComplete="tel" placeholder="+91 00000 00000" fullWidth />
          ) : (
            <TextField name="contact" label={copy.emailLabel} required type="email" autoComplete="email" placeholder="you@example.com" fullWidth />
          )}

          <TextField name="password" label={copy.passwordLabel} required type="password" autoComplete={signup ? 'new-password' : 'current-password'} slotProps={{ htmlInput: signup ? { minLength: 8, maxLength: 128 } : {} }} placeholder={copy.passwordPlaceholder} value={password} onChange={(event) => setPassword(event.target.value)} fullWidth />
          <Button className="auth-submit" type="submit" variant="contained" disabled={submitting}>
            {submitting ? (signup ? 'Creating account…' : 'Signing in…') : signup ? copy.signupAction : copy.loginAction}
          </Button>
        </Stack>
        {!signup && (
          <p className="auth-switch">
            <a href="/forgot-password" onClick={onNavigate('/forgot-password')}>
              Forgot password?
            </a>
          </p>
        )}
        <p className="auth-consent">
          {copy.consentPrefix}{' '}
          <a href="/terms" onClick={onNavigate('/terms')}>
            {copy.termsLabel}
          </a>{' '}
          {copy.consentAnd}{' '}
          <a href="/privacy" onClick={onNavigate('/privacy')}>
            {copy.privacyLabel}
          </a>
        </p>
        <p className="auth-switch">
          {signup ? copy.signupSwitch : copy.loginSwitch}{' '}
          <a
            href={signup ? '/login' : '/signup'}
            onClick={onNavigate(signup ? '/login' : '/signup')}
          >
            {signup ? copy.loginLink : copy.signupLink}
          </a>
        </p>
        <p className="auth-security">{copy.securityNote}</p>
      </div>
    </section>
  )
}
