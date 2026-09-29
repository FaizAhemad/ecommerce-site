import MuiTabs from '@mui/material/Tabs'
import { styled } from '@mui/material/styles'

/** Gadgify Tabs: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTabs)(({ theme }) => ({
  minHeight: 48, '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: theme.palette.primary.main }, '& .MuiTabs-scrollButtons': { minWidth: 44 },
}))

export const Tabs = Root as typeof MuiTabs
