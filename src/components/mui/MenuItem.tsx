import MuiMenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'

/** Gadgify MenuItem: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiMenuItem)(({ theme }) => ({
  minHeight: 44, margin: '3px 5px', borderRadius: 8, '&.Mui-selected': { backgroundColor: theme.palette.action.selected }, '&:focus-visible': { outline: '2px solid', outlineColor: theme.palette.secondary.dark, outlineOffset: -2 },
}))

export const MenuItem = Root as typeof MuiMenuItem
