import MuiStepper from '@mui/material/Stepper'
import { styled } from '@mui/material/styles'

/** Gadgify Stepper: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiStepper)(({ theme }) => ({
  '& .MuiStepConnector-line': { borderColor: theme.palette.divider }, '& .MuiStepIcon-root.Mui-active': { color: theme.palette.primary.main }, '& .MuiStepIcon-root.Mui-completed': { color: theme.palette.success.main },
}))

export const Stepper = Root as typeof MuiStepper
