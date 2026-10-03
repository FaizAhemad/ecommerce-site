import { Alert } from './mui/Alert'
import { Button } from './mui/Button'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'

export function NotificationToast({ message, tone, action, onSignIn, onDismiss }: {
  message: string
  tone: 'error' | 'success' | 'info'
  action?: 'sign-in'
  onSignIn: () => void
  onDismiss: () => void
}) {
  return <Alert severity={tone} role="presentation" sx={{ width: '100%', maxWidth: 560, alignItems: 'center', pointerEvents: 'auto', boxShadow: 6 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%', alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{message}</Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, flexShrink: 0 }}>
        {action === 'sign-in' && <Button color="inherit" size="small" onClick={onSignIn}>Sign in</Button>}
        <Button color="inherit" size="small" aria-label="Dismiss notification" onClick={onDismiss}>Dismiss</Button>
      </Stack>
    </Stack>
  </Alert>
}
