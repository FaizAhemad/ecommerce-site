import MuiFormLabel from '@mui/material/FormLabel'
import { styled } from '@mui/material/styles'

/** Gadgify FormLabel: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiFormLabel)(({ theme }) => ({
  color: theme.palette.text.primary, fontWeight: 600, '&.Mui-focused': { color: theme.palette.primary.main },
}))

export const FormLabel = Root as typeof MuiFormLabel
