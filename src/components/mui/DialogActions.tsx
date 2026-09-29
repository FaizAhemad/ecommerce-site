import MuiDialogActions from '@mui/material/DialogActions'
import { styled } from '@mui/material/styles'

/** Gadgify DialogActions: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDialogActions)(() => ({
  padding: '12px 24px 20px', gap: 10, flexWrap: 'wrap',
}))

export const DialogActions = Root as typeof MuiDialogActions
