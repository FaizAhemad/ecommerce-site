import MuiAccordion from '@mui/material/Accordion'
import { styled } from '@mui/material/styles'

/** Gadgify Accordion: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAccordion)(({ theme }) => ({
  border: '1px solid', borderColor: theme.palette.divider, borderRadius: '12px !important', backgroundColor: theme.palette.background.paper, boxShadow: 'none', '&:before': { display: 'none' }, '&.Mui-expanded': { margin: '8px 0' },
}))

export const Accordion = Root as typeof MuiAccordion
