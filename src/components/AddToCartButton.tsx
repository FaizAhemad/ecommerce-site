import { useNotification } from './NotificationProvider'
import { useRef, useState, type MouseEvent } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'

export function AddToCartButton({
  productId,
  onAdd,
  label,
  className,
  iconClassName,
  unavailableReason,
  quantity,
  isCartLoading = false,
  isUpdating = false,
  pendingAction,
  onDecrease,
}: {
  productId: string
  onAdd: (productId: string) => Promise<void>
  label: string
  className: string
  iconClassName?: string
  unavailableReason?: string
  quantity?: number
  isCartLoading?: boolean
  isUpdating?: boolean
  pendingAction?: 'adding' | 'removing' | 'updating'
  onDecrease?: () => Promise<void>
}) {
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const notify = useNotification()
  const pendingLabel =
    pendingAction === 'removing'
      ? 'Removing…'
      : pendingAction === 'updating'
        ? 'Updating…'
        : 'Adding…'
  const runAction = async (event: MouseEvent<HTMLButtonElement>, action: () => Promise<void>) => {
    event.stopPropagation()
    if (locked.current || pending || isUpdating) return
    locked.current = true
    setPending(true)
    try {
      await action()
    } catch (error) {
      notify(error instanceof Error ? error : 'Unable to update your cart. Please try again.')
    } finally {
      locked.current = false
      setPending(false)
    }
  }

  if (quantity && quantity > 0 && onDecrease) {
    const actionDisabled = pending || isUpdating
    return (
      <div
        className="mx-2 mt-auto mb-2 flex min-h-11 w-[calc(100%-1rem)] items-center justify-between overflow-hidden rounded-md bg-[var(--ink)] text-white"
        role="group"
        aria-label="Cart quantity controls"
        aria-busy={actionDisabled}
      >
        <button
          className="grid size-11 shrink-0 cursor-pointer place-items-center transition-colors hover:bg-white/10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--yellow)] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={actionDisabled}
          aria-label={quantity === 1 ? 'Remove item from cart' : 'Decrease quantity'}
          onClick={(event) => void runAction(event, onDecrease)}
        >
          {quantity === 1 ? (
            <Trash2 aria-hidden="true" className="size-4" />
          ) : (
            <Minus aria-hidden="true" className="size-4" />
          )}
        </button>
        <span
          key={quantity}
          className="min-w-8 text-center font-sans text-sm font-bold tabular-nums animate-cart-count-roll motion-reduce:animate-none"
          aria-live="polite"
          aria-label={`Quantity ${quantity}`}
        >
          {quantity}
        </span>
        <button
          className="grid size-11 shrink-0 cursor-pointer place-items-center transition-colors hover:bg-white/10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yellow)] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={actionDisabled || !!unavailableReason}
          aria-label="Increase quantity"
          onClick={(event) => void runAction(event, () => onAdd(productId))}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      className={className}
      type="button"
      disabled={pending || isUpdating || isCartLoading || !!unavailableReason}
      aria-busy={pending || isUpdating || isCartLoading}
      onClick={(event) => void runAction(event, () => onAdd(productId))}
    >
      {unavailableReason ??
        (isCartLoading ? 'Checking cart…' : pending || isUpdating ? pendingLabel : label)}{' '}
      {!unavailableReason && !isCartLoading && !pending && !isUpdating && (
        <span className={iconClassName} aria-hidden="true">
          +
        </span>
      )}
    </button>
  )
}
