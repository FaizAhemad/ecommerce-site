import MuiAlert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'

/** Gadgify Alert: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAlert)(({ theme }) => ({
  border: '1px solid', borderColor: theme.palette.divider, alignItems: 'flex-start', '& .MuiAlert-icon': { paddingTop: '3px' },
}))

export const Alert = Root as typeof MuiAlert
