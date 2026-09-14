import { useEffect, useState } from 'react'
import { useNotification } from './NotificationProvider'

/** Browser connectivity is a signal, not a guarantee that an API/provider is reachable. */
export function ConnectionStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine)
  const notify = useNotification()
  useEffect(() => {
    const offlineNow = () => setOffline(true)
    const onlineNow = () => {
      setOffline(false)
      notify('You are back online.', 'success')
    }
    window.addEventListener('offline', offlineNow)
    window.addEventListener('online', onlineNow)
    return () => {
      window.removeEventListener('offline', offlineNow)
      window.removeEventListener('online', onlineNow)
    }
  }, [notify])
  return offline ? (
    <p className="state-message" role="status">
      You are offline. Changes may not reach the server. Reconnect before trying again.
    </p>
  ) : null
}
