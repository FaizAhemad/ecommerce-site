import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import { styled } from '@mui/material/styles'

/** Gadgify Breadcrumbs: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiBreadcrumbs)(({ theme }) => ({
  color: theme.palette.text.secondary, '& .MuiBreadcrumbs-separator': { color: theme.palette.text.disabled, marginInline: 10 },
}))

export const Breadcrumbs = Root as typeof MuiBreadcrumbs
