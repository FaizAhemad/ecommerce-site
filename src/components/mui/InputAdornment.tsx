import MuiInputAdornment from '@mui/material/InputAdornment'
import { styled } from '@mui/material/styles'

/** Gadgify InputAdornment: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiInputAdornment)(({ theme }) => ({
  color: theme.palette.text.secondary,
}))

export const InputAdornment = Root as typeof MuiInputAdornment
