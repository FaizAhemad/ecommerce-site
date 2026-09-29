import MuiTableCell from '@mui/material/TableCell'
import { styled } from '@mui/material/styles'

/** Gadgify TableCell: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTableCell)(({ theme }) => ({
  padding: '14px 16px', borderColor: theme.palette.divider, '&.MuiTableCell-head': { backgroundColor: '#faf8f2', color: theme.palette.text.secondary, fontWeight: 700, whiteSpace: 'nowrap' },
}))

export const TableCell = Root as typeof MuiTableCell
