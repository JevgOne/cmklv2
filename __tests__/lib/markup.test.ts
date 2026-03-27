import { describe, it, expect } from 'vitest'
import { calculateMarkup, calculatePrice } from '@/lib/markup'

describe('calculateMarkup', () => {
  it('globální default 25% bez feedConfig', () => {
    const result = calculateMarkup(1000, null)
    expect(result.retailPrice).toBe(1250)
    expect(result.markupPercent).toBe(25)
  })

  it('PERCENT markup z feedConfig', () => {
    const result = calculateMarkup(1000, {
      markupType: 'PERCENT',
      markupValue: 30,
      categoryMarkups: null,
    })
    expect(result.retailPrice).toBe(1300)
    expect(result.markupPercent).toBe(30)
  })

  it('FIXED markup z feedConfig', () => {
    const result = calculateMarkup(1000, {
      markupType: 'FIXED',
      markupValue: 200,
      categoryMarkups: null,
    })
    expect(result.retailPrice).toBe(1200)
    expect(result.markupPercent).toBe(0)
  })

  it('category-level override (PERCENT)', () => {
    const result = calculateMarkup(
      1000,
      {
        markupType: 'PERCENT',
        markupValue: 30,
        categoryMarkups: JSON.stringify({ BRAKES: 15, BODY: 35 }),
      },
      'BRAKES'
    )
    expect(result.retailPrice).toBe(1150)
    expect(result.markupPercent).toBe(15)
  })

  it('category-level override (FIXED)', () => {
    const result = calculateMarkup(
      1000,
      {
        markupType: 'FIXED',
        markupValue: 200,
        categoryMarkups: JSON.stringify({ BRAKES: 100 }),
      },
      'BRAKES'
    )
    expect(result.retailPrice).toBe(1100)
    expect(result.markupPercent).toBe(0)
  })

  it('kategorie není v categoryMarkups → fallback na dodavatelský markup', () => {
    const result = calculateMarkup(
      1000,
      {
        markupType: 'PERCENT',
        markupValue: 30,
        categoryMarkups: JSON.stringify({ BRAKES: 15 }),
      },
      'ENGINE'
    )
    expect(result.retailPrice).toBe(1300)
    expect(result.markupPercent).toBe(30)
  })

  it('neplatný JSON v categoryMarkups → fallback na dodavatelský markup', () => {
    const result = calculateMarkup(
      1000,
      {
        markupType: 'PERCENT',
        markupValue: 20,
        categoryMarkups: 'invalid-json',
      },
      'BRAKES'
    )
    expect(result.retailPrice).toBe(1200)
    expect(result.markupPercent).toBe(20)
  })
})

describe('calculatePrice', () => {
  it('vypočítá cenu s přirážkou', () => {
    expect(calculatePrice(1000, 25)).toBe(1250)
  })

  it('0% přirážka vrací nákupní cenu', () => {
    expect(calculatePrice(1000, 0)).toBe(1000)
  })
})
