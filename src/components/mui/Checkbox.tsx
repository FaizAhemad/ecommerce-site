import MuiCheckbox, { type CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox'
import { Box } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { styled } from '@mui/material/styles'

const Root = styled(MuiCheckbox)(({ theme }) => ({
  width: 44,
  height: 44,
  padding: 10,
  color: theme.palette.text.secondary,
  '&:hover': { backgroundColor: 'rgba(199, 216, 102, 0.2)' },
  '&.Mui-checked': { color: theme.palette.primary.main },
  '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
}))

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 20,
        height: 20,
        display: 'grid',
        placeItems: 'center',
        border: '1.5px solid',
        borderColor: checked ? 'secondary.main' : '#96968e',
        borderRadius: '5px',
        bgcolor: checked ? 'secondary.main' : 'background.paper',
        color: 'text.primary',
        transition: 'background-color 120ms ease, border-color 120ms ease',
      }}
    >
      {checked ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : null}
    </Box>
  )
}

export type CheckboxProps = MuiCheckboxProps

/** Brand checkbox with a square citron selection mark and a 44px touch target. */
export function Checkbox(props: CheckboxProps) {
  return (
    <Root
      disableRipple
      icon={<CheckboxMark checked={false} />}
      checkedIcon={<CheckboxMark checked />}
      {...props}
    />
  )
}
