import MuiStepLabel from '@mui/material/StepLabel'
import { styled } from '@mui/material/styles'

/** Gadgify StepLabel: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiStepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': { color: theme.palette.text.secondary }, '& .MuiStepLabel-label.Mui-active': { color: theme.palette.text.primary, fontWeight: 700 }, '& .MuiStepLabel-label.Mui-completed': { color: theme.palette.success.main },
}))

export const StepLabel = Root as unknown as typeof MuiStepLabel
