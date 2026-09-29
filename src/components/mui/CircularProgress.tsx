import MuiCircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'

/** Gadgify CircularProgress: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiCircularProgress)(({ theme }) => ({
  color: 'inherit', '&.MuiCircularProgress-colorPrimary': { color: theme.palette.primary.main }, '&.MuiCircularProgress-colorSecondary': { color: theme.palette.secondary.dark },
}))

export const CircularProgress = Root as typeof MuiCircularProgress
