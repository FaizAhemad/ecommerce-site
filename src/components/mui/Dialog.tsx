import MuiDialog from '@mui/material/Dialog'
import { styled } from '@mui/material/styles'

/** Gadgify Dialog: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDialog)(({ theme }) => ({
  '& .MuiDialog-paper': { border: '1px solid', borderColor: theme.palette.divider, borderRadius: 16, backgroundColor: theme.palette.background.paper, backgroundImage: 'none', boxShadow: '0 24px 64px rgba(37,40,33,.2)' },
}))

export const Dialog = Root as typeof MuiDialog
