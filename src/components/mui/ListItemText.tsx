import MuiListItemText from '@mui/material/ListItemText'
import { styled } from '@mui/material/styles'

/** Gadgify ListItemText: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiListItemText)(({ theme }) => ({
  minWidth: 0, '& .MuiListItemText-primary': { color: theme.palette.text.primary }, '& .MuiListItemText-secondary': { color: theme.palette.text.secondary },
}))

export const ListItemText = Root as typeof MuiListItemText
