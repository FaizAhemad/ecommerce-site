import { useNotification } from './NotificationProvider'
import { useRef, useState } from 'react'

export function AddToCartButton({
  productId,
  onAdd,
  label,
  className,
  unavailableReason,
}: {
  productId: string
  onAdd: (productId: string) => Promise<void>
  label: string
  className: string
  unavailableReason?: string
}) {
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const notify = useNotification()
  return (
    <>
      <button
        className={className}
        type="button"
        disabled={pending || !!unavailableReason}
        aria-busy={pending}
        onClick={async (event) => {
          event.stopPropagation()
          if (locked.current || unavailableReason) return
          locked.current = true
          setPending(true)
          try {
            await onAdd(productId)
          } catch (error) {
            notify(error instanceof Error ? error : 'Unable to add to cart. Please try again.')
          } finally {
            locked.current = false
            setPending(false)
          }
        }}
      >
        {unavailableReason ?? (pending ? 'Adding…' : label)} {!unavailableReason && <span aria-hidden="true">+</span>}
      </button>
    </>
  )
}
