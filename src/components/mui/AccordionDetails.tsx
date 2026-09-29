import MuiAccordionDetails from '@mui/material/AccordionDetails'
import { styled } from '@mui/material/styles'

/** Gadgify AccordionDetails: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: '8px 20px 20px', color: theme.palette.text.secondary,
}))

export const AccordionDetails = Root as typeof MuiAccordionDetails
