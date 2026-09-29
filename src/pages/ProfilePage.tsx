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
    <div className="w-full">
      <section className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12" aria-labelledby="profile-title">
        <header className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div className="min-w-0">
            <p className="eyebrow mb-2">YOUR ACCOUNT</p>
            <h1 id="profile-title" className="!mb-2 !max-w-none !text-4xl !leading-tight !tracking-tight sm:!text-5xl">Profile</h1>
            {query.data && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted)]">
                <span className="max-w-full break-all text-[var(--ink)]">{query.data.profile.email || 'No email address on this account.'}</span>
                {query.data.profile.email && <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-medium ${query.data.profile.emailVerified ? 'bg-[rgba(215,225,208,0.55)] text-[var(--ink)]' : 'bg-[var(--paper)] text-[var(--muted)]'}`}>{query.data.profile.emailVerified ? 'Verified' : 'Not verified'}</span>}
              </div>
            )}
          </div>
          {query.data && (
            <nav className="flex flex-wrap gap-2" aria-label="Account security">
              <a className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--paper)]" href="/verify-email" onClick={onNavigate('/verify-email')}>Email verification</a>
              {query.data.profile.email && <a className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--muted)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]" href="/forgot-password" onClick={onNavigate('/forgot-password')}>Reset password</a>}
            </nav>
          )}
        </header>
        {query.isPending ? (
          <div className="grid min-h-56 place-content-center justify-items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center" role="status">
            <span className="size-8 animate-pulse rounded-full bg-[rgba(215,225,208,0.65)] motion-reduce:animate-none" aria-hidden="true" />
            <p className="m-0 text-sm text-[var(--muted)]">Loading your account details…</p>
          </div>
        ) : query.isError && !query.data ? (
          <div className="mx-auto grid min-h-56 max-w-xl place-content-center justify-items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center" role="alert">
            <p className="m-0 text-sm text-[var(--ink)]">Unable to load your profile.</p>
            <p className="m-0 text-sm text-[var(--muted)]">Your account details have not been changed.</p>
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
            <ProfileForms data={query.data} pending={pending} error={error} clearError={() => setError('')} save={save} />
          )
        )}
      </section>
    </div>
  )
}
