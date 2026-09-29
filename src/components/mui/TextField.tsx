import MuiTextField from '@mui/material/TextField'
import { styled } from '@mui/material/styles'

/** Gadgify TextField: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: theme.palette.background.paper,
    '& fieldset': { borderColor: theme.palette.divider },
    '&:hover fieldset': { borderColor: theme.palette.text.secondary },
    '&.Mui-focused fieldset': { borderWidth: 2, borderColor: theme.palette.primary.main },
    '&.Mui-error fieldset, &.Mui-error.Mui-focused fieldset': { borderColor: theme.palette.error.main },
    '&.Mui-disabled': { backgroundColor: theme.palette.action.hover },
    '&.Mui-disabled fieldset': { borderColor: theme.palette.action.disabledBackground },
  },
  '& .MuiInputLabel-root.Mui-focused:not(.Mui-error)': { color: theme.palette.primary.main },
}))

export const TextField = Root as typeof MuiTextField
