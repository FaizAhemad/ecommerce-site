import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProfile, profileRequest, type ProfileData } from '../api/profile'
import { privateKey } from '../api/sessionScope'
import { queryClient } from '../api/queryClient'
import { useNotification } from '../components/NotificationProvider'
import { ProfileForms } from '../components/ProfileForms'
import { Alert } from '../components/mui/Alert'
import { Button } from '../components/mui/Button'
import { Chip } from '../components/mui/Chip'
import { CircularProgress } from '../components/mui/CircularProgress'
import { Container } from '../components/mui/Container'
import { Stack } from '../components/mui/Stack'
import { Typography } from '../components/mui/Typography'

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
    <Container maxWidth="lg" component="section" aria-labelledby="profile-title" sx={{ py: { xs: 3, sm: 5 } }}>
        <header className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div className="min-w-0">
            <Typography variant="overline" color="text.secondary">YOUR ACCOUNT</Typography>
            <Typography id="profile-title" component="h1" variant="h3" sx={{ mb: 1 }}>Profile</Typography>
            {query.data && (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{query.data.profile.email || 'No email address on this account.'}</Typography>
                {query.data.profile.email && <Chip size="small" color={query.data.profile.emailVerified ? 'success' : 'warning'} label={query.data.profile.emailVerified ? 'Verified' : 'Not verified'} />}
              </Stack>
            )}
          </div>
          {query.data && (
            <Stack component="nav" direction={{ xs: 'column', sm: 'row' }} spacing={1} aria-label="Account security">
              <Button component="a" href="/verify-email" onClick={onNavigate('/verify-email')} variant="outlined">Email verification</Button>
              {query.data.profile.email && <Button component="a" href="/forgot-password" onClick={onNavigate('/forgot-password')} variant="text">Reset password</Button>}
            </Stack>
          )}
        </header>
        {query.isPending ? (
          <Stack role="status" spacing={1.5} sx={{ minHeight: 224, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', p: 3 }}>
            <CircularProgress size={30} /><Typography color="text.secondary">Loading your account details…</Typography>
          </Stack>
        ) : query.isError && !query.data ? (
          <Stack spacing={1.5} sx={{ minHeight: 224, maxWidth: 600, mx: 'auto', p: 3, textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
            <Alert severity="error" role="alert">Unable to load your profile. Your account details have not been changed.</Alert>
            <Button
              variant="outlined"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </Stack>
        ) : (
          query.data && (
            <ProfileForms data={query.data} pending={pending} error={error} clearError={() => setError('')} save={save} />
          )
        )}
    </Container>
  )
}
