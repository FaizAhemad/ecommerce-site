import { useRef, useState, type FocusEvent } from 'react'
import { Share2 } from 'lucide-react'
import { canonicalOrigin } from '../../server/api/_lib/seo'
import { useNotification } from './NotificationProvider'
import { Button } from './mui/Button'
import { Dialog } from './mui/Dialog'
import { DialogActions } from './mui/DialogActions'
import { DialogContent } from './mui/DialogContent'
import { DialogTitle } from './mui/DialogTitle'
import { TextField } from './mui/TextField'

export function ShareProductButton({ productId, productName }: { productId: string; productName: string }) {
  const notify = useNotification()
  const busy = useRef(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [copyPending, setCopyPending] = useState(false)
  const origin = canonicalOrigin(import.meta.env.VITE_SITE_URL)
  const productUrl = origin ? new URL(`/product/${encodeURIComponent(productId)}`, origin).toString() : ''

  async function copyLink() {
    if (!productUrl) {
      setManualOpen(true)
      return
    }
    setCopyPending(true)
    try {
      await navigator.clipboard.writeText(productUrl)
      notify('Product link copied.', 'success')
      setManualOpen(false)
    } catch {
      setManualOpen(true)
    } finally {
      setCopyPending(false)
    }
  }

  async function shareProduct() {
    if (busy.current || !productUrl) return
    busy.current = true
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: productName, text: productName, url: productUrl })
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return
        }
      }
      await copyLink()
    } finally {
      busy.current = false
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Share2 aria-hidden="true" size={17} />}
        disabled={!productUrl}
        title={!productUrl ? 'Sharing is unavailable until the public site URL is configured.' : undefined}
        aria-label={`Share ${productName}`}
        onClick={() => void shareProduct()}
        sx={{ minHeight: 44, flexShrink: 0 }}
      >
        Share
      </Button>
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} fullWidth maxWidth="xs" aria-labelledby="share-product-dialog-title">
        <DialogTitle id="share-product-dialog-title">Share product link</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Product link"
            value={productUrl || 'Configure the public site URL to create a share link.'}
            slotProps={{ htmlInput: { readOnly: true, onFocus: (event: FocusEvent<HTMLInputElement>) => event.currentTarget.select() } }}
            helperText="Select the link to copy it manually if the Copy link button is unavailable."
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setManualOpen(false)}>Close</Button>
          <Button variant="contained" disabled={!productUrl || copyPending} onClick={() => void copyLink()}>
            {copyPending ? 'Copying…' : 'Copy link'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
