import { describe, it, expect } from 'vitest'
import { urls } from '@/lib/urls'

describe('urls', () => {
  it('urls.main("/katalog") vrací správnou URL', () => {
    const result = urls.main('/katalog')
    expect(result).toContain('/katalog')
    expect(result).toMatch(/^https?:\/\//)
  })

  it('urls.inzerce("/katalog") vrací správnou URL', () => {
    const result = urls.inzerce('/katalog')
    expect(result).toContain('/katalog')
    expect(result).toMatch(/inzerce/)
  })

  it('urls.shop("/katalog") vrací správnou URL', () => {
    const result = urls.shop('/katalog')
    expect(result).toContain('/katalog')
    expect(result).toMatch(/dily/)
  })

  it('urls.marketplace("/") vrací správnou URL', () => {
    const result = urls.marketplace('/')
    expect(result).toMatch(/marketplace/)
    expect(result).toContain('/')
  })

  it('cesta bez lomítka se normalizuje', () => {
    const result = urls.main('katalog')
    expect(result).toContain('/katalog')
  })

  it('výchozí cesta je "/"', () => {
    const result = urls.main()
    expect(result).toMatch(/\/$/)
  })
})
