import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

/** Shared Gadgify theme for the MUI component library and application migration. */
export const gadgifyTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#006D77', dark: '#00545D', light: '#E5F3F2', contrastText: '#FFFFFF' },
    secondary: { main: '#D7E86B', contrastText: '#172B3A' },
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    text: { primary: '#172B3A', secondary: '#536474' },
    divider: '#CBD5E1',
    action: { hover: 'rgba(0,109,119,.045)', selected: 'rgba(0,109,119,.09)', focus: 'rgba(0,109,119,.16)' },
    error: { main: '#b42318' },
    success: { main: '#287548' },
    warning: { main: '#946200' },
    info: { main: '#315f8c' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-.035em' },
    h2: { fontSize: '2rem', fontWeight: 650, lineHeight: 1.2, letterSpacing: '-.025em' },
    h3: { fontSize: '1.75rem', fontWeight: 650, lineHeight: 1.25 },
    h4: { fontSize: '1.5rem', fontWeight: 650 },
    h5: { fontSize: '1.25rem', fontWeight: 650 },
    h6: { fontSize: '1.125rem', fontWeight: 650 },
    caption: { fontSize: '.75rem', lineHeight: 1.5 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.5 },
  },
  components: {
    MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': { outline: '2px solid #006D77', outlineOffset: 2 }, '@media (prefers-reduced-motion: reduce)': { transition: 'none' } } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44, fontSize: 14 } } },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 0, marginTop: 6, lineHeight: 1.5 } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, padding: '8px 12px', borderRadius: 8 } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 10,
          paddingInline: 18,
          '&.MuiButton-containedSecondary': { color: '#172B3A' },
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'medium' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#FFFFFF', minHeight: 48, '&.MuiInputBase-sizeSmall': { minHeight: 44 }, '&.MuiInputBase-multiline': { height: 'auto' } },
        input: { padding: '12px 14px', fontSize: 16, '&.MuiInputBase-inputSizeSmall': { padding: '10px 12px' } },
        notchedOutline: { borderColor: '#CBD5E1' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderColor: '#CBD5E1', borderRadius: 14, backgroundImage: 'none' },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
    MuiDialog: { styleOverrides: { paper: { border: '1px solid #CBD5E1' } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, color: '#536474' } } },
    MuiDataGrid: {
      styleOverrides: {
        root: { borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#FFFFFF' },
        columnHeaders: { backgroundColor: '#F1F5F9' },
        cell: { borderColor: '#E2E8F0' },
      },
    },
  },
})
