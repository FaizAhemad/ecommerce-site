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
  quantityControlClassName,
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
  quantityControlClassName?: string
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
        className={`flex min-h-12 items-stretch overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[0_2px_8px_rgba(37,40,33,0.06)] ${quantityControlClassName ?? 'mx-auto mt-auto mb-2 w-[136px]'}`}
        role="group"
        aria-label="Cart quantity controls"
        aria-busy={actionDisabled}
      >
        <button
          className={`grid size-11 shrink-0 cursor-pointer appearance-none place-items-center border-0 border-r border-solid border-[var(--line)] bg-transparent transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 ${quantity === 1 ? 'text-[#a33a37] hover:bg-[#fce8e5] hover:text-[#842b28]' : 'text-[var(--muted)] hover:bg-[rgba(215,225,208,0.55)] hover:text-[var(--ink)]'}`}
          type="button"
          disabled={actionDisabled}
          aria-label={quantity === 1 ? 'Remove item from cart' : 'Decrease quantity'}
          onClick={(event) => void runAction(event, onDecrease)}
        >
          {quantity === 1 ? (
            <Trash2 aria-hidden="true" className="size-[18px]" strokeWidth={1.9} />
          ) : (
            <Minus aria-hidden="true" className="size-[18px]" strokeWidth={2.1} />
          )}
        </button>
        <span
          key={quantity}
          className="grid min-w-11 flex-1 place-items-center bg-[var(--surface-raised)] text-center font-sans text-base font-bold tabular-nums text-[var(--ink)] animate-cart-count-roll motion-reduce:animate-none"
          aria-live="polite"
          aria-label={`Quantity ${quantity}`}
        >
          {quantity}
        </span>
        <button
          className="grid size-11 shrink-0 cursor-pointer appearance-none place-items-center border-0 border-l border-solid border-[var(--line)] bg-[rgba(215,225,208,0.5)] text-[var(--ink)] transition-colors hover:bg-[rgba(215,225,208,0.82)] active:bg-[rgba(215,225,208,0.95)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={actionDisabled || !!unavailableReason}
          aria-label="Increase quantity"
          onClick={(event) => void runAction(event, () => onAdd(productId))}
        >
          <Plus aria-hidden="true" className="size-[18px]" strokeWidth={2.2} />
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
        <span
          className={`ml-auto grid size-7 place-items-center rounded-full bg-[rgba(37,40,33,0.08)] ${iconClassName ?? ''}`}
          aria-hidden="true"
        >
          <Plus className="size-4" strokeWidth={2.2} />
        </span>
      )}
    </button>
  )
}
