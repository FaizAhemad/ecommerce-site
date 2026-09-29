import MuiTypography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

/** Gadgify Typography: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTypography)(({ theme }) => ({
  color: 'inherit', '&.MuiTypography-colorTextSecondary': { color: theme.palette.text.secondary },
}))

export const Typography = Root as typeof MuiTypography
