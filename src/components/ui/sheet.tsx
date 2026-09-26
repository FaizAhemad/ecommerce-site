import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '../../lib/utils'

export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger
export const SheetClose = Dialog.Close

export const SheetTitle = forwardRef<
  ElementRef<typeof Dialog.Title>,
  ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn('font-[var(--font-display)] text-2xl leading-tight text-[var(--ink)]', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

export const SheetDescription = forwardRef<
  ElementRef<typeof Dialog.Description>,
  ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn('text-sm leading-6 text-[var(--muted)]', className)}
    {...props}
  />
))
SheetDescription.displayName = 'SheetDescription'

type SheetContentProps = ComponentPropsWithoutRef<typeof Dialog.Content> & {
  closeLabel?: string
}

export const SheetContent = forwardRef<ElementRef<typeof Dialog.Content>, SheetContentProps>(
  ({ className, children, closeLabel = 'Close panel', ...props }, ref) => (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(24,31,36,0.48)] transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(22rem,calc(100vw-1.5rem))] flex-col border-r border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)] shadow-2xl outline-none transition-transform data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-[var(--line)] text-[var(--ink)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
          aria-label={closeLabel}
        >
          <X aria-hidden="true" className="size-5" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  ),
)
SheetContent.displayName = 'SheetContent'
