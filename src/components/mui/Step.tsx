import MuiStep from '@mui/material/Step'
import { styled } from '@mui/material/styles'

/** Gadgify Step: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiStep)(() => ({
  minWidth: 0,
}))

export const Step = Root as typeof MuiStep
