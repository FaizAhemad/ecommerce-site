import MuiChip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'

/** Gadgify Chip: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiChip)(({ theme }) => ({
  fontWeight: 600, borderRadius: 999, '&.MuiChip-filledSecondary': { color: theme.palette.text.primary }, '&.MuiChip-outlined': { borderColor: theme.palette.divider },
}))

export const Chip = Root as typeof MuiChip
