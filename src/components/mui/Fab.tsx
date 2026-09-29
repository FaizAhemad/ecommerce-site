import MuiFab from '@mui/material/Fab'
import { styled } from '@mui/material/styles'

/** Gadgify Fab: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiFab)(({ theme }) => ({
  boxShadow: '0 8px 18px rgba(37,40,33,.18)', '&:focus-visible': { outline: '3px solid', outlineColor: theme.palette.secondary.main, outlineOffset: 3 },
}))

export const Fab = Root as typeof MuiFab
