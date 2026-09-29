import MuiDivider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'

/** Gadgify Divider: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDivider)(({ theme }) => ({
  borderColor: theme.palette.divider,
}))

export const Divider = Root as typeof MuiDivider
