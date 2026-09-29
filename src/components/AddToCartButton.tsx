import { useNotification } from './NotificationProvider'
import { useRef, useState, type MouseEvent } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { SxProps, Theme } from '@mui/material/styles'
import { Box } from './mui/Box'
import { Button } from './mui/Button'
import { IconButton } from './mui/IconButton'

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
  sx,
  quantityControlSx,
  fullWidth = false,
}: {
  productId: string
  onAdd: (productId: string) => Promise<void>
  label: string
  className?: string
  iconClassName?: string
  unavailableReason?: string
  quantity?: number
  isCartLoading?: boolean
  isUpdating?: boolean
  pendingAction?: 'adding' | 'removing' | 'updating'
  onDecrease?: () => Promise<void>
  quantityControlClassName?: string
  sx?: SxProps<Theme>
  quantityControlSx?: SxProps<Theme>
  fullWidth?: boolean
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
  const actionBusy = pending || isUpdating
  const runAction = async (event: MouseEvent<HTMLButtonElement>, action: () => Promise<void>) => {
    event.stopPropagation()
    if (locked.current || actionBusy) return
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
    return (
      <Box
        className={quantityControlClassName}
        role="group"
        aria-label="Cart quantity controls"
        aria-busy={actionBusy}
        sx={[
          {
            display: 'flex',
            minHeight: 48,
            width: 136,
            alignItems: 'stretch',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'background.paper',
            boxShadow: '0 2px 8px rgba(37,40,33,.06)',
          },
          ...(Array.isArray(quantityControlSx) ? quantityControlSx : quantityControlSx ? [quantityControlSx] : []),
        ]}
      >
        <IconButton
          type="button"
          disabled={actionBusy}
          aria-label={quantity === 1 ? 'Remove item from cart' : 'Decrease quantity'}
          onClick={(event) => void runAction(event, onDecrease)}
          sx={{
            width: 44,
            minWidth: 44,
            minHeight: 44,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            borderRadius: 0,
            color: quantity === 1 ? 'error.main' : 'text.secondary',
            '&:hover': { color: quantity === 1 ? 'error.dark' : 'text.primary', backgroundColor: quantity === 1 ? 'rgba(180,35,24,.06)' : 'action.hover' },
          }}
        >
          {quantity === 1 ? <Trash2 aria-hidden="true" size={18} /> : <Minus aria-hidden="true" size={18} />}
        </IconButton>
        <Box
          component="span"
          key={quantity}
          aria-live="polite"
          aria-label={`Quantity ${quantity}`}
          sx={{ display: 'grid', minWidth: 44, flex: 1, placeItems: 'center', backgroundColor: 'rgba(215,225,208,.42)', color: 'text.primary', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
        >
          {quantity}
        </Box>
        <IconButton
          type="button"
          disabled={actionBusy || !!unavailableReason}
          aria-label="Increase quantity"
          onClick={(event) => void runAction(event, () => onAdd(productId))}
          sx={{
            width: 44,
            minWidth: 44,
            minHeight: 44,
            flexShrink: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
            borderRadius: 0,
            backgroundColor: 'rgba(215,225,208,.55)',
            '&:hover': { backgroundColor: 'rgba(215,225,208,.82)' },
          }}
        >
          <Plus aria-hidden="true" size={18} />
        </IconButton>
      </Box>
    )
  }

  const buttonSx: SxProps<Theme> = [
    { minHeight: 48, justifyContent: 'space-between', borderRadius: 2, px: 2, textAlign: 'left' },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ]
  return (
    <Button
      className={className}
      variant="contained"
      color="secondary"
      fullWidth={fullWidth}
      disabled={pending || isUpdating || isCartLoading || !!unavailableReason}
      aria-busy={pending || isUpdating || isCartLoading}
      onClick={(event) => void runAction(event, () => onAdd(productId))}
      endIcon={!unavailableReason && !isCartLoading && !pending && !isUpdating ? (
        <Box component="span" className={iconClassName} aria-hidden="true" sx={{ display: 'grid', width: 28, height: 28, placeItems: 'center', borderRadius: '50%', backgroundColor: 'rgba(37,40,33,.09)' }}>
          <Plus size={16} strokeWidth={2.2} />
        </Box>
      ) : undefined}
      sx={buttonSx}
    >
      {unavailableReason ?? (isCartLoading ? 'Checking cart…' : pending || isUpdating ? pendingLabel : label)}
    </Button>
  )
}
