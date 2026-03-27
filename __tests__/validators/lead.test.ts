import { describe, it, expect } from 'vitest'
import { externalLeadSchema, manualLeadSchema } from '@/lib/validators/lead'

describe('externalLeadSchema', () => {
  it('platný minimální input (name+phone) projde', () => {
    const result = externalLeadSchema.safeParse({
      name: 'Jan Novák',
      phone: '777123456',
    })
    expect(result.success).toBe(true)
  })

  it('platný plný input projde', () => {
    const result = externalLeadSchema.safeParse({
      name: 'Jan Novák',
      phone: '777123456',
      email: 'jan@example.com',
      brand: 'Škoda',
      model: 'Octavia',
      year: 2020,
      mileage: 50000,
      expectedPrice: 350000,
      city: 'Praha',
    })
    expect(result.success).toBe(true)
  })

  it('neplatný email selže', () => {
    const result = externalLeadSchema.safeParse({
      name: 'Jan Novák',
      phone: '777123456',
      email: 'not-valid',
    })
    expect(result.success).toBe(false)
  })

  it('chybějící jméno selže', () => {
    const result = externalLeadSchema.safeParse({
      phone: '777123456',
    })
    expect(result.success).toBe(false)
  })

  it('chybějící telefon selže', () => {
    const result = externalLeadSchema.safeParse({
      name: 'Jan Novák',
    })
    expect(result.success).toBe(false)
  })

  it('negativní kilometry selžou', () => {
    const result = externalLeadSchema.safeParse({
      name: 'Jan Novák',
      phone: '777123456',
      mileage: -100,
    })
    expect(result.success).toBe(false)
  })
})

describe('manualLeadSchema', () => {
  it('platný input projde', () => {
    const result = manualLeadSchema.safeParse({
      name: 'Jan Novák',
      phone: '777123456',
      source: 'MANUAL',
    })
    expect(result.success).toBe(true)
  })

  it('neplatný source selže', () => {
    const result = manualLeadSchema.safeParse({
      name: 'Jan Novák',
      phone: '777123456',
      source: 'WEB_FORM',
    })
    expect(result.success).toBe(false)
  })
})
