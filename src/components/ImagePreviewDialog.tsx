import { X } from 'lucide-react'
import { Button } from './mui/Button'
import { Dialog } from './mui/Dialog'
import { DialogContent } from './mui/DialogContent'
import { DialogTitle } from './mui/DialogTitle'

export function ImagePreviewDialog({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  return (
    <Dialog
      open
      aria-labelledby="product-image-preview-title"
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': { m: 0, p: 2, width: '100vw', height: '100dvh', maxWidth: 'none', maxHeight: 'none', bgcolor: 'transparent', color: 'common.white', boxShadow: 'none', placeItems: 'center' },
        '& .MuiBackdrop-root': { bgcolor: 'rgba(15, 18, 22, 0.88)' },
      }}
    >
      <DialogTitle id="product-image-preview-title" sx={{ position: 'absolute', width: 1, height: 1, p: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Product image preview</DialogTitle>
      <DialogContent sx={{ display: 'grid', placeItems: 'center', overflow: 'visible' }}>
      <Button
        variant="outlined"
        color="inherit"
        type="button"
        aria-label="Close image preview"
        onClick={onClose}
        sx={{ position: 'absolute', top: 2, right: 2, zIndex: 1, minWidth: 44, width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(0,0,0,.45)', borderColor: 'rgba(255,255,255,.3)', '&:hover': { bgcolor: 'rgba(0,0,0,.7)' } }}
      >
        <X aria-hidden="true" size={20} />
      </Button>
      <img
        src={src}
        alt={alt}
        style={{ maxHeight: '88dvh', maxWidth: 'min(92vw, 1100px)', borderRadius: 12, objectFit: 'contain', boxShadow: '0 24px 64px rgba(0,0,0,.32)' }}
      />
      </DialogContent>
    </Dialog>
  )
}
