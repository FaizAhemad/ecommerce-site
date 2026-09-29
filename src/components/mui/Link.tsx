import MuiLink from '@mui/material/Link'
import { styled } from '@mui/material/styles'

/** Gadgify Link: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiLink)(({ theme }) => ({
  color: theme.palette.primary.main, textUnderlineOffset: '3px', '&:focus-visible': { outline: '2px solid', outlineColor: theme.palette.secondary.dark, outlineOffset: 3, borderRadius: 2 },
}))

export const Link = Root as typeof MuiLink
