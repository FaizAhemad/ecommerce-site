import MuiIconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

/** Gadgify IconButton: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiIconButton)(({ theme }) => ({
  minWidth: 44, minHeight: 44, borderRadius: 999, '&:hover': { backgroundColor: theme.palette.action.hover }, '&:focus-visible': { outline: '3px solid', outlineColor: theme.palette.primary.main, outlineOffset: 2 },
}))

export const IconButton = Root as typeof MuiIconButton
