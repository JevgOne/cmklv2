import { describe, it, expect } from 'vitest'
import {
  getQuickFilterBySlug,
  quickFilterToWhere,
  QUICK_FILTERS,
} from '@/lib/listing-quick-filters'

describe('getQuickFilterBySlug', () => {
  it('najde "suv-do-500k"', () => {
    const filter = getQuickFilterBySlug('suv-do-500k')
    expect(filter).toBeDefined()
    expect(filter!.label).toBe('SUV do 500k')
    expect(filter!.params.bodyType).toBe('SUV')
    expect(filter!.params.maxPrice).toBe(500000)
  })

  it('najde "elektro"', () => {
    const filter = getQuickFilterBySlug('elektro')
    expect(filter).toBeDefined()
    expect(filter!.params.fuelType).toBe('ELECTRIC')
  })

  it('neexistující slug vrací undefined', () => {
    const filter = getQuickFilterBySlug('nonexistent')
    expect(filter).toBeUndefined()
  })
})

describe('quickFilterToWhere', () => {
  it('SUV do 500k → správný Prisma where', () => {
    const filter = QUICK_FILTERS.find((f) => f.slug === 'suv-do-500k')!
    const where = quickFilterToWhere(filter)

    expect(where.bodyType).toBe('SUV')
    expect(where.price).toEqual({ lte: 500000 })
  })

  it('elektro → fuelType filter', () => {
    const filter = QUICK_FILTERS.find((f) => f.slug === 'elektro')!
    const where = quickFilterToWhere(filter)

    expect(where.fuelType).toBe('ELECTRIC')
    expect(where.price).toBeUndefined()
  })

  it('pro-rodinu → bodyType + year filter', () => {
    const filter = QUICK_FILTERS.find((f) => f.slug === 'pro-rodinu')!
    const where = quickFilterToWhere(filter)

    expect(where.bodyType).toBe('COMBI')
    expect(where.year).toEqual({ gte: 2015 })
  })

  it('prvni-auto-do-200k → price + year filter', () => {
    const filter = QUICK_FILTERS.find((f) => f.slug === 'prvni-auto-do-200k')!
    const where = quickFilterToWhere(filter)

    expect(where.price).toEqual({ lte: 200000 })
    expect(where.year).toEqual({ gte: 2010 })
  })
})
