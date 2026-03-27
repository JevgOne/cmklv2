import { describe, it, expect } from 'vitest'
import { getSubdomain } from '@/lib/subdomain'

describe('getSubdomain', () => {
  describe('dev prostředí (localhost)', () => {
    it('localhost:3000 → "main"', () => {
      expect(getSubdomain('localhost:3000')).toBe('main')
    })

    it('inzerce.localhost:3000 → "inzerce"', () => {
      expect(getSubdomain('inzerce.localhost:3000')).toBe('inzerce')
    })

    it('shop.localhost:3000 → "shop"', () => {
      expect(getSubdomain('shop.localhost:3000')).toBe('shop')
    })

    it('marketplace.localhost:3000 → "marketplace"', () => {
      expect(getSubdomain('marketplace.localhost:3000')).toBe('marketplace')
    })

    it('neznámá subdoména → fallback "main"', () => {
      expect(getSubdomain('unknown.localhost:3000')).toBe('main')
    })
  })

  describe('produkční prostředí (carmakler.cz)', () => {
    it('www.carmakler.cz → "main"', () => {
      expect(getSubdomain('www.carmakler.cz')).toBe('main')
    })

    it('inzerce.carmakler.cz → "inzerce"', () => {
      expect(getSubdomain('inzerce.carmakler.cz')).toBe('inzerce')
    })

    it('carmakler.cz (bez subdomény) → "main"', () => {
      expect(getSubdomain('carmakler.cz')).toBe('main')
    })

    it('shop.carmakler.cz → "shop"', () => {
      expect(getSubdomain('shop.carmakler.cz')).toBe('shop')
    })

    it('marketplace.carmakler.cz → "marketplace"', () => {
      expect(getSubdomain('marketplace.carmakler.cz')).toBe('marketplace')
    })
  })

  describe('edge cases', () => {
    it('prázdný string → "main"', () => {
      expect(getSubdomain('')).toBe('main')
    })

    it('jen port → "main"', () => {
      expect(getSubdomain(':3000')).toBe('main')
    })
  })
})
