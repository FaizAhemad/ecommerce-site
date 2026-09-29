import MuiInputLabel from '@mui/material/InputLabel'
import { styled } from '@mui/material/styles'

/** Gadgify InputLabel: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiInputLabel)(({ theme }) => ({
  color: theme.palette.text.secondary, '&.Mui-focused': { color: theme.palette.primary.main }, '&.Mui-error': { color: theme.palette.error.main },
}))

export const InputLabel = Root as typeof MuiInputLabel
