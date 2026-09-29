import MuiCardMedia from '@mui/material/CardMedia'
import { styled } from '@mui/material/styles'

/** Gadgify CardMedia: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiCardMedia)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover, objectFit: 'cover',
}))

export const CardMedia = Root as typeof MuiCardMedia
