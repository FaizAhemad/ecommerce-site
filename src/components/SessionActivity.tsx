import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api/http'
import { sessionGeneration, sessionSignal } from '../api/sessionScope'
import { createSessionRefreshCoordinator } from '../api/sessionRefresh'
import './SessionActivity.css'
import { createPortal } from 'react-dom'
import { Button } from './mui/Button'
import { CircularProgress } from './mui/CircularProgress'

export function SessionActivity() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const [host, setHost] = useState<Element | null>(null)
  const continueSession = useRef<() => Promise<void>>(async () => {})
  const continuingRef = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    const updateHost = () => setHost(document.querySelector('dialog.form-dialog[open]'))
    updateHost()
    document.addEventListener('gadgify-dialog-change', updateHost)
    const generation = sessionGeneration()
    let deadline = 0, lastActivity = 0
    const current = () => !controller.signal.aborted && generation === sessionGeneration()
    async function performRefresh(activity: boolean) {
      if (!current()) return
      if (activity) lastActivity = Date.now()
      try {
        const response = await apiFetch(activity ? '/api/auth/session-activity' : '/api/auth/me', {
          method: activity ? 'POST' : 'GET', cache: 'no-store',
          signal: AbortSignal.any([controller.signal, sessionSignal()]),
        })
        if (!current()) return
        if (response.status === 401) { window.dispatchEvent(new Event('sessionexpired')); return }
        if (!response.ok) throw new Error('Session check unavailable')
        const body = await response.json() as { session?: { expiresAt: number; serverNow: number } }
        if (!current()) return
        if (!body.session || !Number.isFinite(body.session.expiresAt) || !Number.isFinite(body.session.serverNow)) throw new Error('Session metadata unavailable')
        deadline = Date.now() + Math.max(0, body.session.expiresAt - body.session.serverNow)
        setUnavailable(false)
        setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
      } catch {
        if (current()) {
          setUnavailable(true)
          // Do not retain private UI beyond a known expired deadline when offline.
          if (deadline && Date.now() >= deadline) window.dispatchEvent(new Event('sessionexpired'))
        }
      }
    }
    const refresh = createSessionRefreshCoordinator(performRefresh, current)
    const activity = (event: Event) => {
      if (!event.isTrusted || document.visibilityState !== 'visible') return
      if (Date.now() - lastActivity >= 60_000) void refresh(true)
    }
    continueSession.current = async () => {
      if (continuingRef.current || !current()) return
      continuingRef.current = true
      setContinuing(true)
      try {
        await refresh(true)
      } finally {
        continuingRef.current = false
        if (current()) setContinuing(false)
      }
    }
    const timer = window.setInterval(() => {
      if (!deadline || !current()) return
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(seconds)
      // A read checks activity in another tab but never renews the session.
      if (!seconds) void refresh(false)
    }, 1000)
    for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(event, activity, { passive: true })
    void refresh(false)
    return () => {
      controller.abort()
      document.removeEventListener('gadgify-dialog-change', updateHost)
      window.clearInterval(timer)
      for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.removeEventListener(event, activity)
    }
  }, [])
  if (!unavailable && (remaining === null || remaining > 60)) return null
  return createPortal(<aside className="session-warning" aria-label="Session expiry warning">
    <p role="status">{unavailable ? 'Unable to verify your session. Your login has not been extended.' : 'Your session expires within one minute. Continue to stay signed in, unless the maximum login time has been reached.'}</p>
    <Button type="button" variant="outlined" className="session-continue" aria-busy={continuing} disabled={continuing} onClick={() => void continueSession.current()}>
      {continuing && <CircularProgress size={16} aria-label="Extending session" sx={{ mr: 1 }} />}
      {continuing ? 'Extending session…' : 'Continue session'}
    </Button>
  </aside>, host ?? document.body)
}
