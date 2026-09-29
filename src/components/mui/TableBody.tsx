import MuiTableBody from '@mui/material/TableBody'
import { styled } from '@mui/material/styles'

/** Gadgify TableBody: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTableBody)(() => ({
  '& .MuiTableRow-root:last-child .MuiTableCell-root': { borderBottom: 0 },
}))

export const TableBody = Root as typeof MuiTableBody
