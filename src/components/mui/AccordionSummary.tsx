import MuiAccordionSummary from '@mui/material/AccordionSummary'
import { styled } from '@mui/material/styles'

/** Gadgify AccordionSummary: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAccordionSummary)(({ theme }) => ({
  minHeight: 52, paddingInline: 18, borderRadius: 10, '&.Mui-expanded': { minHeight: 52 }, '& .MuiAccordionSummary-content': { marginBlock: 12 }, '&:focus-visible': { outline: '3px solid', outlineColor: theme.palette.secondary.main, outlineOffset: 2 },
}))

export const AccordionSummary = Root as typeof MuiAccordionSummary
