import MuiSkeleton, { type SkeletonProps as MuiSkeletonProps } from '@mui/material/Skeleton'
import { styled } from '@mui/material/styles'

const Root = styled(MuiSkeleton)(({ theme }) => ({
  backgroundColor: '#e6e3da',
  borderRadius: 8,
  '&::after': {
    background: `linear-gradient(90deg, transparent, ${theme.palette.background.paper} 48%, transparent)`,
    opacity: 0.68,
  },
}))

export type SkeletonProps = MuiSkeletonProps

/** Warm, low-contrast loading placeholder that keeps the layout stable. */
export function Skeleton(props: SkeletonProps) {
  return <Root animation="wave" aria-hidden={props['aria-hidden'] ?? true} {...props} />
}
