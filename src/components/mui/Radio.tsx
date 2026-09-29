import MuiRadio, { type RadioProps as MuiRadioProps } from '@mui/material/Radio'
import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'

const Root = styled(MuiRadio)(({ theme }) => ({
  width: 44,
  height: 44,
  padding: 10,
  color: '#96968e',
  '&:hover': { backgroundColor: 'rgba(199, 216, 102, 0.2)' },
  '&.Mui-checked': { color: theme.palette.primary.main },
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
        borderColor: checked ? 'primary.main' : '#96968e',
        borderRadius: '50%',
        bgcolor: 'background.paper',
        transition: 'border-color 120ms ease',
      }}
    >
      {checked ? <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'secondary.main' }} /> : null}
    </Box>
  )
}

export type RadioProps = MuiRadioProps

/** Brand radio with a citron selected center and a 44px touch target. */
export function Radio(props: RadioProps) {
  return <Root disableRipple icon={<RadioMark checked={false} />} checkedIcon={<RadioMark checked />} {...props} />
}
