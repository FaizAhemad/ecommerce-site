import { DataGrid as MuiDataGrid } from '@mui/x-data-grid'
import { styled } from '@mui/material/styles'

/** Gadgify DataGrid: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiDataGrid)(({ theme }) => ({
  border: 0, borderRadius: 12, backgroundColor: theme.palette.background.paper, '& .MuiDataGrid-columnHeaders': { backgroundColor: theme.palette.action.hover, borderBottomColor: theme.palette.divider }, '& .MuiDataGrid-cell': { borderColor: theme.palette.divider }, '& .MuiDataGrid-row:hover': { backgroundColor: theme.palette.action.hover }, '& .MuiDataGrid-cell:focus': { outline: '2px solid', outlineColor: theme.palette.primary.main, outlineOffset: -2 }, '& .MuiDataGrid-columnHeader:focus': { outline: '2px solid', outlineColor: theme.palette.primary.main, outlineOffset: -2 },
}))

export const DataGrid = Root as typeof MuiDataGrid
