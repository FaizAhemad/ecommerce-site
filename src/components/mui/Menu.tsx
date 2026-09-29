import MuiMenu from '@mui/material/Menu'
import { styled } from '@mui/material/styles'

/** Gadgify Menu: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiMenu)(({ theme }) => ({
  '& .MuiPaper-root': { marginTop: 6, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 12, boxShadow: '0 14px 36px rgba(37,40,33,.14)' },
}))

export const Menu = Root as typeof MuiMenu
