import MuiListItemButton from '@mui/material/ListItemButton'
import { styled } from '@mui/material/styles'

/** Gadgify ListItemButton: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiListItemButton)(({ theme }) => ({
  minHeight: 44, borderRadius: 10, '&.Mui-selected': { backgroundColor: theme.palette.action.selected, color: theme.palette.text.primary }, '&:focus-visible': { outline: '2px solid', outlineColor: theme.palette.secondary.dark, outlineOffset: -2 },
}))

export const ListItemButton = Root as typeof MuiListItemButton
