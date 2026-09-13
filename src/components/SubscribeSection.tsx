import { useNotification } from './NotificationProvider'
import { subscribeToNewsletter } from '../api/newsletter'
import { useRef, useState, type FormEvent } from 'react'
export function SubscribeSection() {
  const notify = useNotification()
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || status === 'success') return
    submitting.current = true
    setStatus('loading')
    try {
      const result = await subscribeToNewsletter(email)
      setStatus('success')
      setEmail('')
      notify(
        result?.emailSent
          ? 'You are subscribed. A confirmation email is on its way.'
          : 'You are subscribed.',
        'success',
      )
    } catch (error) {
      setStatus('error')
      notify(
        error instanceof Error ? error : 'We could not subscribe you right now. Please try again.',
      )
    } finally {
      submitting.current = false
    }
  }
  return (
    <section className="subscribe-section page-section" aria-labelledby="subscribe-title">
      <div>
        <p className="eyebrow">STAY IN THE LOOP</p>
        <h2 id="subscribe-title">Good things, occasionally.</h2>
        <p>New arrivals, thoughtful edits, and useful ideas delivered to your inbox.</p>
      </div>
      <form className="subscribe-form" onSubmit={submit}>
        <label htmlFor="subscribe-email">Email address</label>
        <div>
          <input
            id="subscribe-email"
            type="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setStatus('idle')
            }}
            placeholder="you@example.com"
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Joining…' : status === 'success' ? 'Subscribed' : 'Subscribe'}{' '}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </section>
  )
}
