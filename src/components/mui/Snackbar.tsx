import MuiSnackbar from '@mui/material/Snackbar'
import { styled } from '@mui/material/styles'

/** Gadgify Snackbar: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiSnackbar)(({ theme }) => ({
  '& .MuiSnackbarContent-root': { border: '1px solid', borderColor: theme.palette.divider, borderRadius: 12, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, boxShadow: '0 12px 32px rgba(37,40,33,.16)' },
}))

export const Snackbar = Root as typeof MuiSnackbar
