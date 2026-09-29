export type ProductAvailability = {
  label: 'Out of stock' | 'Limited stock' | 'Available'
  color: 'error' | 'warning' | 'success'
}

export function productAvailability(stock: number): ProductAvailability {
  if (stock <= 0) return { label: 'Out of stock', color: 'error' }
  if (stock <= 5) return { label: 'Limited stock', color: 'warning' }
  return { label: 'Available', color: 'success' }
}
