import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Tone = 'error' | 'success' | 'info'
type Notification = { message: string; tone: Tone }
export const SNACKBAR_DURATION_MS = 5_000
const NotificationContext = createContext<(message: string, tone?: Tone) => void>(() => undefined)
export const useNotification = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notification[]>([])
  const notify = useCallback((message: string, tone: Tone = 'error') => {
    setQueue((current) => current.some((item) => item.message === message && item.tone === tone) ? current : [...current, { message, tone }])
  }, [])
  const notification = queue[0]
  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setQueue((current) => current[0] === notification ? current.slice(1) : current), SNACKBAR_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [notification])
  return <NotificationContext.Provider value={notify}>
    {children}
    <div className="notification-region">
      <div role="alert" aria-atomic="true">{notification?.tone === 'error' && <span className="notification-announcement">{notification.message}</span>}</div>
      <div role="status" aria-atomic="true">{notification && notification.tone !== 'error' && <span className="notification-announcement">{notification.message}</span>}</div>
      {notification && <div className={`error-snackbar snackbar-${notification.tone}`}>
        <p>{notification.message}</p>
        <button type="button" onClick={() => setQueue((current) => current.slice(1))} aria-label="Dismiss notification">Dismiss</button>
      </div>}
    </div>
  </NotificationContext.Provider>
}
