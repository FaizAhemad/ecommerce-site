import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import { styled } from '@mui/material/styles'

const Root = styled(MuiButton)(({ theme }) => ({
  minHeight: 44,
  borderRadius: 10,
  paddingInline: 18,
  fontWeight: 650,
  letterSpacing: 0,
  textTransform: 'none',
  transition: 'background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
  '&.MuiButton-contained': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': { backgroundColor: '#1d252d', boxShadow: '0 4px 12px rgba(37, 40, 33, 0.16)' },
  },
  '&.MuiButton-containedSecondary': {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    '&:hover': { backgroundColor: '#b8ca54', boxShadow: '0 4px 12px rgba(37, 40, 33, 0.12)' },
  },
  '&.MuiButton-outlined': {
    borderColor: theme.palette.divider,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    '&:hover': { borderColor: theme.palette.text.secondary, backgroundColor: '#f4f1e9' },
  },
  '&.MuiButton-text': {
    color: theme.palette.text.primary,
    '&:hover': { backgroundColor: 'rgba(40, 49, 59, 0.06)' },
  },
  '&.Mui-disabled': { opacity: 0.48, boxShadow: 'none' },
  '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
  [theme.breakpoints.down('sm')]: { minHeight: 48 },
}))

export type ButtonProps = MuiButtonProps

/** Brand button: ink primary, citron secondary, quiet outlined, accessible focus. */
export const Button = Root as unknown as typeof MuiButton
