import { useState, type FormEvent, type MouseEvent } from 'react'
import type { StorefrontApiResponse } from '../api/storefront'

type Props = { mode: 'login' | 'signup'; storefront: StorefrontApiResponse; onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void; onLogin: () => void }

export function AuthPage({ mode, storefront, onNavigate, onLogin }: Props) {
  const signup = mode === 'signup'
  const copy = storefront.content.auth
  const [method, setMethod] = useState<'email' | 'mobile'>('email')
  const [message, setMessage] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const contact = String(values.get('contact') ?? '')
    const password = String(values.get('password') ?? '')
    const payload = signup ? { name: values.get('name'), password, verificationMethod: method, ...(method === 'mobile' ? { phone: contact } : { email: contact }) } : { identifier: contact, password }
    try {
      const result = await fetch(signup ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!result.ok) throw new Error('Unable to complete authentication')
      onLogin()
      setMessage(signup ? copy.signupSuccess : copy.loginSuccess)
    } catch { setMessage('Unable to complete authentication. Please try again.') }
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
        <label>{copy.passwordLabel}<input name="password" required type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder={copy.passwordPlaceholder} /></label>
        <button className="primary-button auth-submit" type="submit">{signup ? copy.signupAction : copy.loginAction} <span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-consent">{copy.consentPrefix}{' '}<a href="/terms" onClick={onNavigate('/terms')}>{copy.termsLabel}</a>{' '} {copy.consentAnd}{' '}<a href="/privacy" onClick={onNavigate('/privacy')}>{copy.privacyLabel}</a></p>
      {message && <p className="auth-message" role="status">{message}</p>}
      <p className="auth-switch">{signup ? copy.signupSwitch : copy.loginSwitch}{' '}<a href={signup ? '/login' : '/signup'} onClick={onNavigate(signup ? '/login' : '/signup')}>{signup ? copy.loginLink : copy.signupLink}</a></p>
      <p className="auth-security">{copy.securityNote}</p>
    </div>
  </section>
}
