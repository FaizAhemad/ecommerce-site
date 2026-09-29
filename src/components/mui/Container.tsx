import MuiContainer from '@mui/material/Container'
import { styled } from '@mui/material/styles'

/** Gadgify Container: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiContainer)(() => ({
  boxSizing: 'border-box', paddingInline: 'clamp(16px, 3vw, 32px)',
}))

export const Container = Root as typeof MuiContainer
