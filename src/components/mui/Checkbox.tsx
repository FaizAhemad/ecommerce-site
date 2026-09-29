import MuiCheckbox, { type CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox'
import { Box } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { styled } from '@mui/material/styles'

const Root = styled(MuiCheckbox)(({ theme }) => ({
  width: 44,
  height: 44,
  padding: 10,
  '&:hover': { backgroundColor: theme.palette.action.hover },
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
        borderColor: 'currentColor',
        borderRadius: '5px',
        bgcolor: checked ? 'currentColor' : 'transparent',
        transition: 'background-color 120ms ease, border-color 120ms ease',
      }}
    >
      {checked ? <CheckRoundedIcon sx={{ fontSize: 16, color: 'background.paper' }} /> : null}
    </Box>
  )
}

export type CheckboxProps = MuiCheckboxProps

/** Brand checkbox with a square primary-color selection mark and a 44px touch target. */
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
