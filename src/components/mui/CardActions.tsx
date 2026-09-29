import MuiCardActions from '@mui/material/CardActions'
import { styled } from '@mui/material/styles'

/** Gadgify CardActions: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiCardActions)(() => ({
  padding: '12px 16px 16px', gap: 8, flexWrap: 'wrap',
}))

export const CardActions = Root as typeof MuiCardActions
