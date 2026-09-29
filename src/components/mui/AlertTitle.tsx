import MuiAlertTitle from '@mui/material/AlertTitle'
import { styled } from '@mui/material/styles'

/** Gadgify AlertTitle: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAlertTitle)(({ theme }) => ({
  fontWeight: 700, color: theme.palette.text.primary, marginBottom: 4,
}))

export const AlertTitle = Root as typeof MuiAlertTitle
