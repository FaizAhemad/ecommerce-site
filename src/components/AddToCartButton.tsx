import { useNotification } from './NotificationProvider'
import { useRef, useState } from 'react'

export function AddToCartButton({ productId, onAdd, label, className }: {
  productId: string
  onAdd: (productId: string) => Promise<void>
  label: string
  className: string
}) {
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const notify = useNotification()
  return <>
    <button className={className} type="button" disabled={pending} aria-busy={pending} onClick={async (event) => {
      event.stopPropagation()
      if (locked.current) return
      locked.current = true
      setPending(true)
      try {
        await onAdd(productId)
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Unable to add to cart. Please try again.')
      } finally {
        locked.current = false
        setPending(false)
      }
    }}>{pending ? 'Adding…' : label} <span aria-hidden="true">+</span></button>
  </>
}
