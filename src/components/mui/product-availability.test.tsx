import { describe, expect, it } from 'vitest'
import { productAvailability } from '../productAvailability'

describe('productAvailability', () => {
  it('marks products with no stock unavailable', () => {
    expect(productAvailability(0)).toEqual({ label: 'Out of stock', color: 'error' })
    expect(productAvailability(-1)).toEqual({ label: 'Out of stock', color: 'error' })
  })

  it('marks one to five remaining units as limited stock', () => {
    expect(productAvailability(1)).toEqual({ label: 'Limited stock', color: 'warning' })
    expect(productAvailability(5)).toEqual({ label: 'Limited stock', color: 'warning' })
  })

  it('marks larger inventory as available', () => {
    expect(productAvailability(6)).toEqual({ label: 'Available', color: 'success' })
  })
})
