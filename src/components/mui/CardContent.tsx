import MuiCardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'

/** Gadgify CardContent: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiCardContent)(() => ({
  padding: 20, '&:last-child': { paddingBottom: 20 },
}))

export const CardContent = Root as typeof MuiCardContent
