import MuiRadioGroup from '@mui/material/RadioGroup'
import { styled } from '@mui/material/styles'

/** Gadgify RadioGroup: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiRadioGroup)(() => ({
  gap: 2,
}))

export const RadioGroup = Root as typeof MuiRadioGroup
