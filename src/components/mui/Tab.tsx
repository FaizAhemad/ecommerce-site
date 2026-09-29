import MuiTab from '@mui/material/Tab'
import { styled } from '@mui/material/styles'

/** Gadgify Tab: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTab)(({ theme }) => ({
  minHeight: 48, minWidth: 72, paddingInline: 16, textTransform: 'none', fontWeight: 600, '&.Mui-selected': { color: theme.palette.primary.main }, '&:focus-visible': { outline: '2px solid', outlineColor: theme.palette.secondary.dark, outlineOffset: -3 },
}))

export const Tab = Root as typeof MuiTab
