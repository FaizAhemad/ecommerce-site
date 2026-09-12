import { useNotification } from '../components/NotificationProvider'
import { apiFetch as fetch, ApiRateLimitError } from '../api/http'
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type Props = { mode: 'login' | 'signup'; storefront: StorefrontApiResponse; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void; onLogin: (role?: string) => void }

export function AuthPage({ mode, storefront, onNavigate, onLogin }: Props) {
  const signup = mode === 'signup'
  const copy = storefront.content.auth
  const [method, setMethod] = useState<'email' | 'mobile'>('email')
  const notify = useNotification()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    setPassword('')
  }, [mode, method])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const formElement = event.currentTarget
    const values = new FormData(formElement)
    const contact = String(values.get('contact') ?? '')
    const enteredPassword = String(values.get('password') ?? '')
    const payload = signup ? { name: values.get('name'), password: enteredPassword, verificationMethod: method, ...(method === 'mobile' ? { phone: contact } : { email: contact }) } : { identifier: contact, password: enteredPassword }
    try {
      const result = await fetch(signup ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!result.ok) throw new Error('Unable to complete authentication')
      const resultBody = await result.json() as { user?: { role?: string } }
      formElement.reset()
      setPassword('')
      onLogin(resultBody.user?.role)
      notify(signup ? copy.signupSuccess : copy.loginSuccess, 'success')
    } catch (error) { notify(error instanceof ApiRateLimitError ? error : 'Unable to complete authentication. Please try again.') } finally { setSubmitting(false) }
  }
  return <section className="page-section auth-page" aria-labelledby="auth-title">
    <div className="auth-card">
      <p className="eyebrow">{signup ? copy.signupEyebrow : copy.loginEyebrow}</p>
      <h1 id="auth-title">{signup ? copy.signupTitle : copy.loginTitle}</h1>
      <p className="hero-text">{signup ? copy.signupDescription : copy.loginDescription}</p>
      <div className="auth-verification-tabs" role="tablist" aria-label="Verification method">
        <button type="button" role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'is-active' : ''} onClick={() => setMethod('email')}>Email</button>
        <button type="button" role="tab" aria-selected={method === 'mobile'} className={method === 'mobile' ? 'is-active' : ''} onClick={() => setMethod('mobile')}>Mobile</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {signup && <label>{copy.fullNameLabel}<input name="name" required autoComplete="name" placeholder={copy.fullNameLabel} /></label>}
        {method === 'mobile' ? <label>{copy.mobileLabel}<input name="contact" required type="tel" autoComplete="tel" placeholder="+91 00000 00000" /></label> : <label>{copy.emailLabel}<input name="contact" required type="email" autoComplete="email" placeholder="you@example.com" /></label>}
        {signup && <label>{copy.addressLabel}<textarea required autoComplete="street-address" rows={3} placeholder={copy.addressLabel} /></label>}
        <label>{copy.passwordLabel}<input name="password" required type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder={copy.passwordPlaceholder} value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button className="primary-button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : signup ? copy.signupAction : copy.loginAction} <span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-consent">{copy.consentPrefix}{' '}<a href="/terms" onClick={onNavigate('/terms')}>{copy.termsLabel}</a>{' '} {copy.consentAnd}{' '}<a href="/privacy" onClick={onNavigate('/privacy')}>{copy.privacyLabel}</a></p>
      <p className="auth-switch">{signup ? copy.signupSwitch : copy.loginSwitch}{' '}<a href={signup ? '/login' : '/signup'} onClick={onNavigate(signup ? '/login' : '/signup')}>{signup ? copy.loginLink : copy.signupLink}</a></p>
      <p className="auth-security">{copy.securityNote}</p>
    </div>
  </section>
}
