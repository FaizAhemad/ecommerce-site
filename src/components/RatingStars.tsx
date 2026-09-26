import { useId } from 'react'

type RatingStarsProps = {
  rating: number
  size?: 'small' | 'medium'
  label?: string
}

const starPath = 'M12 2.5 14.9 8.7l6.8.9-4.9 4.8 1.2 6.8L12 18l-6 3.2 1.1-6.8-4.9-4.8 6.8-.9L12 2.5z'

export function RatingStars({ rating, size = 'small', label }: RatingStarsProps) {
  const instanceId = useId().replace(/:/g, '')
  const value = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0

  return (
    <span
      className={`rating-stars rating-stars--${size}`}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, value - index))
        const clipId = `${instanceId}-star-${index}`
        return (
          <svg key={index} viewBox="0 0 24 24" focusable="false">
            <defs>
              <clipPath id={clipId}>
                <rect width={24 * fill} height="24" />
              </clipPath>
            </defs>
            <path className="rating-star-empty" d={starPath} />
            {fill > 0 && (
              <path className="rating-star-filled" d={starPath} clipPath={`url(#${clipId})`} />
            )}
          </svg>
        )
      })}
    </span>
  )
}
