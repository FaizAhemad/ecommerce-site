import MuiCardHeader from '@mui/material/CardHeader'
import { styled } from '@mui/material/styles'

/** Gadgify CardHeader: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiCardHeader)(({ theme }) => ({
  padding: '18px 20px 12px', '& .MuiCardHeader-title': { fontWeight: 700, color: theme.palette.text.primary }, '& .MuiCardHeader-subheader': { color: theme.palette.text.secondary },
}))

export const CardHeader = Root as typeof MuiCardHeader
