import MuiTablePagination from '@mui/material/TablePagination'
import { styled } from '@mui/material/styles'

/** Standard MUI pagination with a wrapping phone layout and one range label. */
const Root = styled(MuiTablePagination)(({ theme }) => ({
  overflow: 'visible',
  '& .MuiTablePagination-toolbar': { minHeight: 72, padding: '12px 16px', gap: 12, flexWrap: 'wrap' },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { margin: 0, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: theme.palette.text.secondary },
  '& .MuiTablePagination-input': { margin: 0, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, minHeight: 44, alignItems: 'center' },
  '& .MuiTablePagination-select': { paddingBlock: 10 },
  '& .MuiTablePagination-spacer': { flex: '1 1 auto' },
  [theme.breakpoints.down('sm')]: {
    '& .MuiTablePagination-toolbar': { justifyContent: 'center', gap: 8 },
    '& .MuiTablePagination-spacer': { display: 'none' },
    '& .MuiTablePagination-displayedRows': { marginLeft: 'auto' },
    '& .MuiTablePagination-toolbar > .MuiStack-root': { flexBasis: '100%', justifyContent: 'center' },
  },
}))

export const TablePagination = Root as typeof MuiTablePagination
