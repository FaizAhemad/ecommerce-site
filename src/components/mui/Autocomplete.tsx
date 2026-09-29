import MuiAutocomplete from '@mui/material/Autocomplete'
import { styled } from '@mui/material/styles'

/** Gadgify Autocomplete: themed, accessible MUI component with tuned brand states and spacing. */
const Root = styled(MuiAutocomplete)(({ theme }) => ({
  '& .MuiOutlinedInput-root': { borderRadius: 10, backgroundColor: theme.palette.background.paper }, '& .MuiAutocomplete-paper': { border: '1px solid', borderColor: theme.palette.divider, borderRadius: 12, boxShadow: '0 14px 36px rgba(37,40,33,.12)' }, '& .MuiAutocomplete-option[aria-selected="true"]': { backgroundColor: theme.palette.action.selected },
}))

export const Autocomplete = Root as typeof MuiAutocomplete
