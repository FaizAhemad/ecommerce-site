import MuiLinearProgress from '@mui/material/LinearProgress'
import { styled } from '@mui/material/styles'

/** Gadgify LinearProgress: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiLinearProgress)(({ theme }) => ({
  height: 4, borderRadius: 999, backgroundColor: theme.palette.action.hover, '& .MuiLinearProgress-bar': { borderRadius: 999 },
}))

export const LinearProgress = Root as typeof MuiLinearProgress
