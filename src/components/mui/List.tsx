import MuiList from '@mui/material/List'
import { styled } from '@mui/material/styles'

/** Gadgify List: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiList)(() => ({
  paddingBlock: 6,
}))

export const List = Root as typeof MuiList
