export function ratingBands(value: string | undefined) {
  if (!value) return []
  if (!/^[1-5](,[1-5]){0,4}$/.test(value)) return null
  return [...new Set(value.split(',').map(Number))]
}
