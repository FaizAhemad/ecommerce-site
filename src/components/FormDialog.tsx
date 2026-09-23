import { useEffect, useId, useRef, type ReactNode } from 'react'
import './FormDialog.css'

/** Native modal supplies background inertness, Escape handling and a focus trap. */
export function FormDialog({ open, title, busy = false, onClose, children }: {
  open: boolean; title: string; busy?: boolean; onClose: () => void; children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    if (!dialog) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.dispatchEvent(new Event('gadgify-dialog-change'))
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.dispatchEvent(new Event('gadgify-dialog-change'))
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open])
  return <dialog ref={ref} className="form-dialog" aria-labelledby={titleId} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header className="form-dialog-header">
      <div><p className="form-dialog-eyebrow">Gadgify</p><h2 id={titleId}>{title}</h2></div>
      <button type="button" className="form-dialog-close" disabled={busy} aria-label={`Close ${title}`} onClick={onClose}>×</button>
    </header>
    <div className="form-dialog-body">{children}</div>
    {busy && <p className="form-dialog-progress" role="status">Saving changes. Please wait…</p>}
  </dialog>
}
