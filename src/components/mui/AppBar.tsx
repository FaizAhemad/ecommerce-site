import MuiAppBar from '@mui/material/AppBar'
import { styled } from '@mui/material/styles'

/** Gadgify AppBar: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, borderBottom: '1px solid', borderColor: theme.palette.divider, boxShadow: '0 8px 24px rgba(37,40,33,.06)',
}))

export const AppBar = Root as typeof MuiAppBar
