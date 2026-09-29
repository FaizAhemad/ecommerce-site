import MuiSwitch from '@mui/material/Switch'
import { styled } from '@mui/material/styles'

/** Gadgify Switch: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiSwitch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: theme.palette.secondary.dark, opacity: 1 },
}))

export const Switch = Root as typeof MuiSwitch
