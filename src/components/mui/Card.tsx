import MuiCard from '@mui/material/Card'
import { styled } from '@mui/material/styles'

/** Gadgify Card: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiCard)(({ theme }) => ({
  border: '1px solid', borderColor: theme.palette.divider, borderRadius: 14, backgroundColor: theme.palette.background.paper, backgroundImage: 'none', boxShadow: '0 8px 24px rgba(37,40,33,.05)',
}))

export const Card = Root as typeof MuiCard
