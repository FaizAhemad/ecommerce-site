import MuiTablePagination from '@mui/material/TablePagination'
import { styled } from '@mui/material/styles'

/** Gadgify TablePagination: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTablePagination)(() => ({
  '& .MuiTablePagination-toolbar': { minHeight: 56, paddingInline: 16, flexWrap: 'wrap' }, '& .MuiTablePagination-select': { borderRadius: 8 },
}))

export const TablePagination = Root as typeof MuiTablePagination
