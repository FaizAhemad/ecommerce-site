import MuiRating from '@mui/material/Rating'
import { styled } from '@mui/material/styles'

/** Gadgify Rating: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiRating)(({ theme }) => ({
  color: theme.palette.secondary.dark, '& .MuiRating-iconEmpty': { color: theme.palette.divider },
}))

export const Rating = Root as typeof MuiRating
