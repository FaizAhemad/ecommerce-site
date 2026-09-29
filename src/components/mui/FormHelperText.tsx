import MuiFormHelperText from '@mui/material/FormHelperText'
import { styled } from '@mui/material/styles'

/** Gadgify FormHelperText: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiFormHelperText)(() => ({
  marginInline: 2, marginTop: 6, lineHeight: 1.4,
}))

export const FormHelperText = Root as typeof MuiFormHelperText
