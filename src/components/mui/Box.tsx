import MuiBox from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'
import type { ComponentPropsWithRef, ElementType } from 'react'

type GadgifyBoxProps<C extends ElementType> = {
  component?: C
} & Omit<BoxProps<'div'>, 'component'> &
  Omit<ComponentPropsWithRef<C>, keyof BoxProps<'div'> | 'component'>

/** Gadgify Box: polymorphic MUI layout primitive with consistent box sizing. */
export function Box<C extends ElementType = 'div'>(props: GadgifyBoxProps<C>) {
  const baseSx = { boxSizing: 'border-box' } as const
  const sx = Array.isArray(props.sx) ? [baseSx, ...props.sx] : [baseSx, props.sx]
  return <MuiBox {...props} sx={sx} />
}
