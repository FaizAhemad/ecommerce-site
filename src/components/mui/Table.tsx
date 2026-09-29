import MuiTable from '@mui/material/Table'
import { styled } from '@mui/material/styles'

/** Gadgify Table: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTable)(() => ({
  borderCollapse: 'separate', borderSpacing: 0,
}))

export const Table = Root as typeof MuiTable
