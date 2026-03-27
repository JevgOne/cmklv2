import { describe, it, expect } from 'vitest'
import { formatPrice, formatMileage, slugify, cn } from '@/lib/utils'

describe('formatPrice', () => {
  it('formátuje cenu s mezerou a měnou', () => {
    const result = formatPrice(100000)
    // Intl může použít různé formáty mezer, kontrolujeme obsah
    expect(result).toContain('100')
    expect(result).toContain('000')
    expect(result).toContain('Kč')
  })

  it('formátuje nulovou cenu', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
    expect(result).toContain('Kč')
  })

  it('formátuje velkou cenu', () => {
    const result = formatPrice(1500000)
    expect(result).toContain('Kč')
  })
})

describe('formatMileage', () => {
  it('formátuje kilometry', () => {
    const result = formatMileage(150000)
    expect(result).toContain('150')
    expect(result).toContain('000')
    expect(result).toContain('km')
  })

  it('formátuje nulové kilometry', () => {
    const result = formatMileage(0)
    expect(result).toBe('0 km')
  })
})

describe('slugify', () => {
  it('převede český text na slug', () => {
    expect(slugify('Škoda Octavia RS')).toBe('skoda-octavia-rs')
  })

  it('prázdný string vrací prázdný string', () => {
    expect(slugify('')).toBe('')
  })

  it('odstraní diakritiku', () => {
    expect(slugify('Příliš žluťoučký')).toBe('prilis-zlutoucky')
  })

  it('nahradí speciální znaky', () => {
    expect(slugify('BMW 3 Series (E90)')).toBe('bmw-3-series-e90')
  })
})

describe('cn', () => {
  it('merguje Tailwind classes', () => {
    const result = cn('px-4 py-2', 'px-6')
    expect(result).toContain('px-6')
    expect(result).not.toContain('px-4')
    expect(result).toContain('py-2')
  })

  it('zvládne prázdné vstupy', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('zvládne podmíněné třídy', () => {
    const result = cn('base', false && 'hidden', 'visible')
    expect(result).toContain('base')
    expect(result).toContain('visible')
    expect(result).not.toContain('hidden')
  })
})
