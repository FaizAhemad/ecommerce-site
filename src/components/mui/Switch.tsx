import MuiSwitch from '@mui/material/Switch'
import { styled } from '@mui/material/styles'

/** Gadgify Switch: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiSwitch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
}))

export const Switch = Root as typeof MuiSwitch
