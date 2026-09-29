import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

/** Shared Gadgify theme for the MUI component library and application migration. */
export const gadgifyTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#28313b', contrastText: '#fffefa' },
    secondary: { main: '#c7d866', contrastText: '#252821' },
    background: { default: '#f7f4ed', paper: '#fffefa' },
    text: { primary: '#252821', secondary: '#5f675f' },
    divider: '#d3cec3',
    error: { main: '#b42318' },
    success: { main: '#287548' },
    warning: { main: '#946200' },
    info: { main: '#315f8c' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
    body1: { lineHeight: 1.5 },
    body2: { lineHeight: 1.5 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 10,
          paddingInline: 18,
          '&.MuiButton-containedSecondary': { color: '#252821' },
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'medium' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#fffefa' },
        notchedOutline: { borderColor: '#d3cec3' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderColor: '#d3cec3', borderRadius: 14, backgroundImage: 'none' },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
    MuiDialog: { styleOverrides: { paper: { border: '1px solid #d3cec3' } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, color: '#5f675f' } } },
    MuiDataGrid: {
      styleOverrides: {
        root: { borderColor: '#d3cec3', borderRadius: 12, backgroundColor: '#fffefa' },
        columnHeaders: { backgroundColor: '#faf8f2' },
        cell: { borderColor: '#e6e1d7' },
      },
    },
  },
})
