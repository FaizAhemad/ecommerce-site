import MuiTableHead from '@mui/material/TableHead'
import { styled } from '@mui/material/styles'

/** Gadgify TableHead: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTableHead)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}))

export const TableHead = Root as typeof MuiTableHead
