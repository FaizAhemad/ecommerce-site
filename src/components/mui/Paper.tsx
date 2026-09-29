import MuiPaper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'

/** Gadgify Paper: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiPaper)(({ theme }) => ({
  border: '1px solid', borderColor: theme.palette.divider, backgroundImage: 'none',
}))

export const Paper = Root as typeof MuiPaper
