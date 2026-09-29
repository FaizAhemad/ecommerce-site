import MuiButtonGroup from '@mui/material/ButtonGroup'
import { styled } from '@mui/material/styles'

/** Gadgify ButtonGroup: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiButtonGroup)(() => ({
  borderRadius: 10, '& .MuiButton-root': { minHeight: 44, borderRadius: 0 }, '& .MuiButton-root:first-of-type': { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }, '& .MuiButton-root:last-of-type': { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
}))

export const ButtonGroup = Root as typeof MuiButtonGroup
