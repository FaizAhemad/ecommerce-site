import MuiFormControl from '@mui/material/FormControl'
import { styled } from '@mui/material/styles'

/** Gadgify FormControl: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiFormControl)(() => ({
  minWidth: 0,
}))

export const FormControl = Root as typeof MuiFormControl
