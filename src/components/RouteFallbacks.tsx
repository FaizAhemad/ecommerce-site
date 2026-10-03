import type { MouseEvent } from 'react'
import { Button } from './mui/Button'
import { Container } from './mui/Container'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'

const navigate = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function NotFoundPage() {
  return <Container component="main" maxWidth="sm" sx={{ py: { xs: 6, sm: 10 }, textAlign: 'center' }}>
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <Typography variant="overline" color="text.secondary">404</Typography>
      <Typography component="h1" variant="h3">Page not found</Typography>
      <Typography color="text.secondary">This link is unavailable. Check the address or return to the storefront.</Typography>
      <Button component="a" href="/" onClick={navigate('/')} variant="contained">Back to home</Button>
    </Stack>
  </Container>
}

export function AdminAccessRequired({ isAuthenticated, onNavigate }: {
  isAuthenticated: boolean
  onNavigate: (path: string) => (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  return <Container component="main" maxWidth="sm" sx={{ py: { xs: 5, sm: 8 } }}>
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary">Protected workspace</Typography>
      <Typography component="h1" id="admin-access-title" variant="h4">{isAuthenticated ? 'Administrator access required' : 'Sign in to continue'}</Typography>
      <Typography color="text.secondary">{isAuthenticated ? 'This area is available only to authorized administrators.' : 'Sign in with an administrator account to open this page.'}</Typography>
      <Button component="a" variant="contained" href={isAuthenticated ? '/' : '/login'} onClick={onNavigate(isAuthenticated ? '/' : '/login')} sx={{ alignSelf: 'flex-start' }}>
        {isAuthenticated ? 'Return to the storefront' : 'Sign in'}
      </Button>
    </Stack>
  </Container>
}
