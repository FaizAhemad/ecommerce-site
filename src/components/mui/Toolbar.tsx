import MuiToolbar from '@mui/material/Toolbar'
import { styled } from '@mui/material/styles'

/** Gadgify Toolbar: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiToolbar)(() => ({
  minHeight: '56px !important', paddingInline: 'clamp(16px, 3vw, 28px)',
}))

export const Toolbar = Root as typeof MuiToolbar
