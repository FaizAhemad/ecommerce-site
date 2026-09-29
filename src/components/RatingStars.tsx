import { Rating } from './mui/Rating'

type RatingStarsProps = {
  rating: number
  size?: 'small' | 'medium'
  label?: string
}

export function RatingStars({ rating, size = 'small', label }: RatingStarsProps) {
  const value = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0

  return (
    <Rating
      value={value}
      precision={0.1}
      readOnly
      size={size}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      sx={{
        display: 'inline-flex',
        flexShrink: 0,
        gap: '1px',
        verticalAlign: 'middle',
        fontSize: size === 'medium' ? 17 : 13,
        '& .MuiRating-iconEmpty': { color: '#ddd9ce' },
      }}
    />
  )
}
