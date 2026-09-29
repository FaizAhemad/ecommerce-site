import MuiDrawer from '@mui/material/Drawer'
import { styled } from '@mui/material/styles'

/** Gadgify Drawer: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': { backgroundColor: theme.palette.background.paper, backgroundImage: 'none', borderColor: theme.palette.divider, boxShadow: '-16px 0 48px rgba(37,40,33,.12)' },
}))

export const Drawer = Root as typeof MuiDrawer
