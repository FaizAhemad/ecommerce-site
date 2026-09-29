import MuiBackdrop, { type BackdropProps as MuiBackdropProps } from '@mui/material/Backdrop'
import { styled } from '@mui/material/styles'

const Root = styled(MuiBackdrop)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
  color: theme.palette.common.white,
  backgroundColor: 'rgba(37, 40, 33, 0.42)',
  backdropFilter: 'blur(3px)',
  transition: 'opacity 160ms ease, backdrop-filter 160ms ease',
}))

export type BackdropProps = MuiBackdropProps

/** Warm-tinted, lightly blurred overlay used by modal surfaces. */
export function Backdrop(props: BackdropProps) {
  return <Root {...props} />
}
