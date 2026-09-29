import MuiDialogContent from '@mui/material/DialogContent'
import { styled } from '@mui/material/styles'

/** Gadgify DialogContent: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDialogContent)(({ theme }) => ({
  padding: '20px 24px', borderColor: theme.palette.divider,
}))

export const DialogContent = Root as typeof MuiDialogContent
