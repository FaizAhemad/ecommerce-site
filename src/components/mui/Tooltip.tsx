import MuiTooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'

/** Gadgify Tooltip: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': { padding: '7px 11px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, fontSize: 12, lineHeight: 1.4 },
}))

export const Tooltip = Root as typeof MuiTooltip
