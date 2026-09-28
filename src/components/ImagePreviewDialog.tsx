import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function ImagePreviewDialog({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="image-preview-dialog fixed inset-0 m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center border-0 bg-transparent p-4 text-white"
      aria-label="Product image preview"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full border border-white/30 bg-black/45 text-white hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Close image preview"
        onClick={onClose}
      >
        <X aria-hidden="true" className="size-5" />
      </button>
      <img
        className="max-h-[88dvh] max-w-[min(92vw,1100px)] rounded-xl object-contain shadow-2xl"
        src={src}
        alt={alt}
      />
    </dialog>
  )
}
