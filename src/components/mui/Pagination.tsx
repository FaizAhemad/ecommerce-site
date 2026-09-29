import MuiPagination from '@mui/material/Pagination'
import { styled } from '@mui/material/styles'

/** Gadgify Pagination: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiPagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': { minWidth: 40, minHeight: 40, borderRadius: 10, '&.Mui-selected': { backgroundColor: theme.palette.secondary.main, color: theme.palette.text.primary, fontWeight: 700 }, '&:focus-visible': { outline: '2px solid', outlineColor: theme.palette.secondary.dark } },
}))

export const Pagination = Root as typeof MuiPagination
