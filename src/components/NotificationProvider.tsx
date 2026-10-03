import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiRateLimitError } from '../api/http'
import { createPortal } from 'react-dom'
const NotificationToast = lazy(() => import('./NotificationToast').then(module => ({ default: module.NotificationToast })))

type Tone = 'error' | 'success' | 'info'
type Notification = { message: string; tone: Tone; action?: 'sign-in' }
export const SNACKBAR_DURATION_MS = 5_000
const NotificationContext = createContext<(message: string | Error, tone?: Tone) => void>(
  () => undefined,
)
export const useNotification = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const [queue, setQueue] = useState<Notification[]>([])
  const [notificationHost, setNotificationHost] = useState<Element | null>(null)
  useEffect(() => {
    const updateHost = () => setNotificationHost(document.querySelector('dialog.form-dialog[open]'))
    updateHost()
    document.addEventListener('gadgify-dialog-change', updateHost)
    return () => document.removeEventListener('gadgify-dialog-change', updateHost)
  }, [])
  const notify = useCallback(
    (input: string | Error, tone: Tone = 'error') => {
      const message =
        input instanceof ApiRateLimitError
          ? t('rateLimited', { seconds: input.retryAfterSeconds })
          : input instanceof Error
            ? input.message
            : input
      setQueue((current) =>
        current.some((item) => item.message === message && item.tone === tone)
          ? current
          : [...current, { message, tone, action: /sign in/i.test(message) ? 'sign-in' : undefined }],
      )
    },
    [t],
  )
  const notification = queue[0]
  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(
      () => setQueue((current) => (current[0] === notification ? current.slice(1) : current)),
      SNACKBAR_DURATION_MS,
    )
    return () => window.clearTimeout(timer)
  }, [notification])
  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {createPortal(<div className="notification-region">
        <div role="alert" aria-atomic="true">
          {notification?.tone === 'error' && (
            <span className="notification-announcement">{notification.message}</span>
          )}
        </div>
        <div role="status" aria-atomic="true">
          {notification && notification.tone !== 'error' && (
            <span className="notification-announcement">{notification.message}</span>
          )}
        </div>
        {notification && <Suspense fallback={null}><NotificationToast
          message={notification.message}
          tone={notification.tone}
          action={notification.action}
          onSignIn={() => {
            const returnTo = `${window.location.pathname}${window.location.search}`
            window.history.pushState({}, '', `/login?returnTo=${encodeURIComponent(returnTo)}`)
            window.dispatchEvent(new PopStateEvent('popstate'))
            setQueue((current) => current.slice(1))
          }}
          onDismiss={() => setQueue((current) => current.slice(1))}
        /></Suspense>}
      </div>, notificationHost ?? document.body)}
    </NotificationContext.Provider>
  )
}
