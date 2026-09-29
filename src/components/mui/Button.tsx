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
  '&.MuiButton-contained': { boxShadow: 'none', '&:hover': { boxShadow: '0 3px 10px rgba(23,43,58,.12)' } },
  '&.MuiButton-outlined': { '&:hover': { backgroundColor: theme.palette.action.hover } },
  '&.MuiButton-text': { '&:hover': { backgroundColor: theme.palette.action.hover } },
  '&.Mui-disabled': { opacity: 0.48, boxShadow: 'none' },
  '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
  [theme.breakpoints.down('sm')]: { minHeight: 48 },
}))

export type ButtonProps = MuiButtonProps

/** Brand button: semantic MUI colors, consistent touch targets and accessible focus. */
export const Button = Root as unknown as typeof MuiButton
