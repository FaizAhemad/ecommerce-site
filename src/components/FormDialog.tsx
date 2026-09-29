import { useEffect, useId, type ReactNode } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { CircularProgress } from './mui/CircularProgress'
import { Dialog } from './mui/Dialog'
import { DialogContent } from './mui/DialogContent'
import { DialogTitle } from './mui/DialogTitle'
import { IconButton } from './mui/IconButton'
import { Stack } from './mui/Stack'
import { Typography } from './mui/Typography'

/** Shared, right-side MUI editor drawer with focus trapping and pending dismissal protection. */
export function FormDialog({ open, title, busy = false, onClose, children }: {
  open: boolean; title: string; busy?: boolean; onClose: () => void; children: ReactNode
}) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    document.dispatchEvent(new Event('gadgify-dialog-change'))
    return () => { document.dispatchEvent(new Event('gadgify-dialog-change')) }
  }, [open])
  return <Dialog open={open} aria-labelledby={titleId} aria-busy={busy} fullWidth maxWidth={false}
    onClose={(_, reason) => { if (!busy && (reason === 'backdropClick' || reason === 'escapeKeyDown')) onClose() }}
    sx={{ '& .MuiDialog-container': { justifyContent: 'flex-end', alignItems: 'stretch' }, '& .MuiDialog-paper': { m: 0, width: 'min(640px, 100%)', maxWidth: '100%', height: '100dvh', maxHeight: '100dvh', borderRadius: 0, overflowY: 'auto', overscrollBehavior: 'contain' } }}>
    <DialogTitle id={titleId} sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', pr: 9 }}>
      <Typography variant="caption" color="text.secondary">Gadgify</Typography>
      <Typography component="h2" variant="h5" sx={{ mt: 0.25 }}>{title}</Typography>
      <IconButton type="button" aria-label={`Close ${title}`} disabled={busy} onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, border: 1, borderColor: 'divider', borderRadius: '50%' }}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: { xs: 2.5, sm: 3 }, pb: 'max(32px, env(safe-area-inset-bottom))' }}>{children}</DialogContent>
    {busy && <Stack role="status" aria-live="polite" direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 3, py: 1.5, borderTop: 1, borderColor: 'divider' }}><CircularProgress size={20} /><Typography variant="body2">Saving changes. Please wait…</Typography></Stack>}
  </Dialog>
}
