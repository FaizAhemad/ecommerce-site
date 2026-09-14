import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProfile, profileRequest, type ProfileData } from '../api/profile'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from '../components/NotificationProvider'
import { ProfileForms } from '../components/ProfileForms'

export function ProfilePage({
  onNavigate,
}: {
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const key = privateKey('profile')
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => getProfile(signal) })
  const operation = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const notify = useNotification()
  useEffect(() => () => operation.current?.abort(), [])
  const save = async (path: 'profile' | 'addresses', method: string, body: unknown) => {
    if (operation.current) return false
    const controller = new AbortController()
    operation.current = controller
    setPending(true)
    setError('')
    try {
      await queryClient.cancelQueries({ queryKey: key })
      const result = await profileRequest(path, method, body, controller.signal)
      await queryClient.cancelQueries({ queryKey: key })
      if (controller.signal.aborted) return false
      queryClient.setQueryData<ProfileData>(key, (previous) =>
        'profile' in result
          ? result
          : previous
            ? { ...previous, addresses: result.addresses }
            : previous,
      )
      notify('Your changes were saved.', 'success')
      return true
    } catch (failure) {
      if (!controller.signal.aborted) {
        const message =
          failure instanceof Error ? failure.message : 'Unable to save. Please try again.'
        setError(message)
        notify(failure instanceof Error ? failure : message)
      }
      return false
    } finally {
      operation.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <section className="page-section auth-page" aria-labelledby="profile-title">
      <div className="auth-card">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1 id="profile-title">Profile</h1>
        {error && (
          <p className="state-message" role="alert">
            {error}
          </p>
        )}
        {query.isPending ? (
          <p role="status">Loading your profile…</p>
        ) : query.isError && !query.data ? (
          <div className="state-message">
            <p>Unable to load your profile.</p>
            <button
              className="secondary-button"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Retry
            </button>
          </div>
        ) : (
          query.data && (
            <>
              <p>
                {query.data.profile.email || 'No email address on this account.'}
                {query.data.profile.email
                  ? ` · ${query.data.profile.emailVerified ? 'Verified' : 'Not verified'}`
                  : ''}
              </p>
              <div className="profile-actions">
                <a href="/verify-email" onClick={onNavigate('/verify-email')}>
                  Email verification
                </a>
                {query.data.profile.email && (
                  <a href="/forgot-password" onClick={onNavigate('/forgot-password')}>
                    Reset password
                  </a>
                )}
              </div>
              <ProfileForms data={query.data} pending={pending} save={save} />
            </>
          )
        )}
      </div>
    </section>
  )
}
