import MuiTableRow from '@mui/material/TableRow'
import { styled } from '@mui/material/styles'

/** Gadgify TableRow: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTableRow)(({ theme }) => ({
  transition: 'background-color 140ms ease', '&:hover': { backgroundColor: theme.palette.action.hover }, '&.Mui-selected': { backgroundColor: theme.palette.action.selected },
}))

export const TableRow = Root as typeof MuiTableRow
