import MuiStack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'

/** Gadgify Stack: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiStack)(() => ({
  boxSizing: 'border-box',
}))

export const Stack = Root as typeof MuiStack
