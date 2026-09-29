import MuiTableSortLabel from '@mui/material/TableSortLabel'
import { styled } from '@mui/material/styles'

/** Keyboard-operable sort control; the containing cell exposes aria-sort. */
export const TableSortLabel = styled(MuiTableSortLabel)(({ theme }) => ({
  minHeight: 44,
  fontSize: 13,
  fontWeight: 650,
  gap: 4,
  color: theme.palette.text.secondary,
  '&.Mui-active': { color: theme.palette.primary.main },
  '& .MuiTableSortLabel-icon': { fontSize: 18 },
}))
