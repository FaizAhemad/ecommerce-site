import MuiFormControlLabel from '@mui/material/FormControlLabel'
import { styled } from '@mui/material/styles'

/** Gadgify FormControlLabel: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiFormControlLabel)(({ theme }) => ({
  marginInline: 0, gap: 4, '& .MuiFormControlLabel-label': { color: theme.palette.text.primary, lineHeight: 1.4 },
}))

export const FormControlLabel = Root as typeof MuiFormControlLabel
