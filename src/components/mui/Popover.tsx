import MuiPopover from '@mui/material/Popover'
import { styled } from '@mui/material/styles'

/** Gadgify Popover: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiPopover)(({ theme }) => ({
  '& .MuiPaper-root': { border: '1px solid', borderColor: theme.palette.divider, borderRadius: 12, boxShadow: '0 14px 36px rgba(37,40,33,.14)' },
}))

export const Popover = Root as typeof MuiPopover
