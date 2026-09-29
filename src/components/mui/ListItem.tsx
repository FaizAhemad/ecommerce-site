import MuiListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'

/** Gadgify ListItem: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiListItem)(() => ({
  borderRadius: 10,
}))

export const ListItem = Root as typeof MuiListItem
