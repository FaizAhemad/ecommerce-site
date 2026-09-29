import MuiRadio, { type RadioProps as MuiRadioProps } from '@mui/material/Radio'
import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'

const Root = styled(MuiRadio)(({ theme }) => ({
  width: 44,
  height: 44,
  padding: 10,
  '&:hover': { backgroundColor: theme.palette.action.hover },
  '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
}))

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 20,
        height: 20,
        display: 'grid',
        placeItems: 'center',
        border: '2px solid',
        borderColor: 'currentColor',
        borderRadius: '50%',
        bgcolor: 'background.paper',
        transition: 'border-color 120ms ease',
      }}
    >
      {checked ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'currentColor' }} /> : null}
    </Box>
  )
}

export type RadioProps = MuiRadioProps

/** Brand radio with a primary-color selected center and a 44px touch target. */
export function Radio(props: RadioProps) {
  return <Root disableRipple icon={<RadioMark checked={false} />} checkedIcon={<RadioMark checked />} {...props} />
}
