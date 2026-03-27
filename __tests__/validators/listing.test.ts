import { describe, it, expect } from 'vitest'
import { createListingSchema } from '@/lib/validators/listing'

describe('createListingSchema', () => {
  const validListing = {
    listingType: 'PRIVATE' as const,
    brand: 'Škoda',
    model: 'Octavia',
    year: 2020,
    mileage: 50000,
    fuelType: 'PETROL' as const,
    transmission: 'MANUAL' as const,
    condition: 'GOOD' as const,
    price: 350000,
    contactName: 'Jan Novák',
    contactPhone: '777123456',
    city: 'Praha',
  }

  it('platný input projde', () => {
    const result = createListingSchema.safeParse(validListing)
    expect(result.success).toBe(true)
  })

  it('chybějící brand selže', () => {
    const { brand, ...without } = validListing
    const result = createListingSchema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it('chybějící model selže', () => {
    const { model, ...without } = validListing
    const result = createListingSchema.safeParse(without)
    expect(result.success).toBe(false)
  })

  it('rok mimo rozsah selže (příliš nízký)', () => {
    const result = createListingSchema.safeParse({ ...validListing, year: 1800 })
    expect(result.success).toBe(false)
  })

  it('rok mimo rozsah selže (příliš vysoký)', () => {
    const result = createListingSchema.safeParse({ ...validListing, year: 2200 })
    expect(result.success).toBe(false)
  })

  it('negativní kilometry selžou', () => {
    const result = createListingSchema.safeParse({ ...validListing, mileage: -100 })
    expect(result.success).toBe(false)
  })

  it('nulové kilometry projdou', () => {
    const result = createListingSchema.safeParse({ ...validListing, mileage: 0 })
    expect(result.success).toBe(true)
  })

  it('neplatný listingType selže', () => {
    const result = createListingSchema.safeParse({ ...validListing, listingType: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('neplatný fuelType selže', () => {
    const result = createListingSchema.safeParse({ ...validListing, fuelType: 'NUCLEAR' })
    expect(result.success).toBe(false)
  })
})
