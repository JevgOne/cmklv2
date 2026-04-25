import { describe, it, expect } from 'vitest'
import { calculateCommission } from '@/lib/commission-calculator'

describe('calculateCommission', () => {
  it('5% z ceny 1 000 000 → celková provize 50 000', () => {
    const result = calculateCommission(1_000_000, 'STAR_1')
    expect(result.total).toBe(50_000)
  })

  it('minimální provize 25 000 Kč pro nízkou cenu', () => {
    const result = calculateCommission(100_000, 'STAR_1')
    expect(result.total).toBe(25_000)
  })

  it('hraniční cena 500 000 — přesně 25 000', () => {
    const result = calculateCommission(500_000, 'STAR_1')
    expect(result.total).toBe(25_000)
  })

  it('⭐ dostane 30% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'STAR_1')
    expect(result.brokerShare).toBe(15_000)
    expect(result.brokerRate).toBe(0.30)
  })

  it('⭐⭐ dostane 40% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'STAR_2')
    expect(result.brokerShare).toBe(20_000)
    expect(result.brokerRate).toBe(0.40)
  })

  it('⭐⭐⭐ dostane 50% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'STAR_3')
    expect(result.brokerShare).toBe(25_000)
    expect(result.brokerRate).toBe(0.50)
  })

  it('⭐⭐⭐⭐ dostane 55% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'STAR_4')
    expect(result.brokerShare).toBe(27_500)
    expect(result.brokerRate).toBe(0.55)
  })

  it('⭐⭐⭐⭐⭐ dostane 60% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'STAR_5')
    expect(result.brokerShare).toBe(30_000)
    expect(result.brokerRate).toBe(0.60)
  })

  it('manažerský bonus je 2 500 Kč', () => {
    const result = calculateCommission(1_000_000, 'STAR_1')
    expect(result.managerBonus).toBe(2_500)
  })

  it('rozložení sedí — broker + firma + manažer = total', () => {
    const result = calculateCommission(800_000, 'STAR_2')
    expect(result.brokerShare + result.companyShare + result.managerBonus).toBe(result.total)
  })

  it('default level je STAR_1 (bez parametru)', () => {
    const result = calculateCommission(1_000_000)
    expect(result.brokerRate).toBe(0.30)
  })
})
