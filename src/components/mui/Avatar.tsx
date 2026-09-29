import MuiAvatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

/** Gadgify Avatar: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAvatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontWeight: 700,
}))

export const Avatar = Root as typeof MuiAvatar
