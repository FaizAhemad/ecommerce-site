import MuiDialogTitle from '@mui/material/DialogTitle'
import { styled } from '@mui/material/styles'

/** Gadgify DialogTitle: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDialogTitle)(({ theme }) => ({
  padding: '22px 24px 14px', color: theme.palette.text.primary, fontSize: '1.25rem', fontWeight: 700,
}))

export const DialogTitle = Root as typeof MuiDialogTitle
