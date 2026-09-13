import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { privateKey } from '../api/sessionScope'
import { getEmailStatus, submitEmailVerification } from '../api/emailVerification'
import { cleanResetUrl, readResetToken } from '../api/passwordRecovery'
import { useNotification } from '../components/NotificationProvider'

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
          <p role="status" className="state-message">
            {result === 'verified'
              ? 'The email linked to this verification request is now verified.'
              : 'Check your inbox and spam folder. Use the newest link within 24 hours.'}
          </p>
        )}
        {error && (
          <p role="alert" className="state-message">
            {error}
          </p>
        )}
        {token && (
          <div className="auth-form">
            <p>Confirm the email associated with the link you opened.</p>
            <button
              className="primary-button auth-submit"
              disabled={pending}
              aria-busy={pending}
              onClick={() => void submit(true)}
            >
              {pending ? 'Please wait…' : 'Verify email'}
            </button>
          </div>
        )}
        {isAuthenticated ? (
          status.isPending ? (
            <p role="status">Loading your email status…</p>
          ) : status.isError ? (
            <div className="state-message">
              <p>Unable to load your email status.</p>
              <button
                className="secondary-button"
                disabled={status.isFetching}
                onClick={() => void status.refetch()}
              >
                Retry status
              </button>
            </div>
          ) : (
            status.data && (
              <div className="auth-form">
                <p>
                  {status.data.email
                    ? `Account email: ${status.data.email}`
                    : 'This account has no email address. Email verification is unavailable.'}
                </p>
                {status.data.email && (
                  <>
                    <p>{status.data.emailVerified ? 'Verified' : 'Not verified'}</p>
                    {!status.data.emailVerified && (
                      <button
                        className="secondary-button"
                        disabled={pending}
                        aria-busy={pending}
                        onClick={() => void submit(false)}
                      >
                        {pending ? 'Please wait…' : 'Send a new verification link'}
                      </button>
                    )}
                  </>
                )}
              </div>
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
