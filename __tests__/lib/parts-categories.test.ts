import { describe, it, expect } from 'vitest'
import { getCategoryLabel, getConditionLabel, PART_CATEGORIES, PART_CONDITIONS } from '@/lib/parts-categories'
import type { PartCategory, PartCondition } from '@/types/parts'

describe('getCategoryLabel', () => {
  it('"ENGINE" → "Motor"', () => {
    expect(getCategoryLabel('ENGINE')).toBe('Motor')
  })

  it('"BRAKES" → "Brzdy"', () => {
    expect(getCategoryLabel('BRAKES')).toBe('Brzdy')
  })

  it('"BODY" → "Karoserie"', () => {
    expect(getCategoryLabel('BODY')).toBe('Karoserie')
  })

  it('fallback pro neznámou kategorii vrací hodnotu samotnou', () => {
    expect(getCategoryLabel('UNKNOWN' as PartCategory)).toBe('UNKNOWN')
  })
})

describe('getConditionLabel', () => {
  it('"NEW" → "Nový"', () => {
    expect(getConditionLabel('NEW')).toBe('Nový')
  })

  it('"USED_GOOD" → "Použitý — velmi dobrý"', () => {
    expect(getConditionLabel('USED_GOOD')).toBe('Použitý — velmi dobrý')
  })

  it('"REFURBISHED" → "Repasovaný"', () => {
    expect(getConditionLabel('REFURBISHED')).toBe('Repasovaný')
  })

  it('fallback pro neznámý stav', () => {
    expect(getConditionLabel('UNKNOWN' as PartCondition)).toBe('UNKNOWN')
  })
})

describe('konstanty', () => {
  it('PART_CATEGORIES obsahuje 12 kategorií', () => {
    expect(PART_CATEGORIES).toHaveLength(12)
  })

  it('PART_CONDITIONS obsahuje 5 stavů', () => {
    expect(PART_CONDITIONS).toHaveLength(5)
  })
})
