import MuiSelect from '@mui/material/Select'
import { styled } from '@mui/material/styles'

/** Gadgify Select: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiSelect)(({ theme }) => ({
  borderRadius: 10,
  backgroundColor: theme.palette.background.paper,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: theme.palette.primary.main },
  '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.error.main },
  '&.Mui-disabled': { backgroundColor: theme.palette.action.hover },
  '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.action.disabledBackground },
}))

export const Select = Root as unknown as typeof MuiSelect
