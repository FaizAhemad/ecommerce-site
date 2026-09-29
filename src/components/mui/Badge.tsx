import MuiBadge from '@mui/material/Badge'
import { styled } from '@mui/material/styles'

/** Gadgify Badge: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiBadge)(({ theme }) => ({
  '& .MuiBadge-badge': { backgroundColor: theme.palette.secondary.main, color: theme.palette.text.primary, fontWeight: 700, border: '2px solid', borderColor: theme.palette.background.paper },
}))

export const Badge = Root as typeof MuiBadge
