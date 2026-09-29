import MuiTableContainer from '@mui/material/TableContainer'
import { styled } from '@mui/material/styles'

/** Gadgify TableContainer: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTableContainer)(({ theme }) => ({
  border: '1px solid', borderColor: theme.palette.divider, borderRadius: 12, backgroundColor: theme.palette.background.paper,
}))

export const TableContainer = Root as typeof MuiTableContainer
