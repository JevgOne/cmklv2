import { describe, it, expect } from 'vitest'
import { calculateCommission } from '@/lib/commission-calculator'

describe('calculateCommission', () => {
  it('5% z ceny 1 000 000 → celková provize 50 000', () => {
    const result = calculateCommission(1_000_000)
    expect(result.total).toBe(50_000)
  })

  it('minimální provize 25 000 Kč pro nízkou cenu', () => {
    const result = calculateCommission(100_000)
    // 5% ze 100 000 = 5 000, ale minimum je 25 000
    expect(result.total).toBe(25_000)
  })

  it('hraniční cena 500 000 — přesně 25 000', () => {
    const result = calculateCommission(500_000)
    // 5% z 500 000 = 25 000 = minimum
    expect(result.total).toBe(25_000)
  })

  it('broker dostane 50% celkové provize', () => {
    const result = calculateCommission(1_000_000)
    expect(result.brokerShare).toBe(25_000)
  })

  it('firma dostane 50% minus manažerský bonus', () => {
    const result = calculateCommission(1_000_000)
    // 50% z 50 000 = 25 000 - 2 500 = 22 500
    expect(result.companyShare).toBe(22_500)
  })

  it('manažerský bonus je 2 500 Kč', () => {
    const result = calculateCommission(1_000_000)
    expect(result.managerBonus).toBe(2_500)
  })

  it('rozložení sedí — broker + firma + manažer = total', () => {
    const result = calculateCommission(800_000)
    expect(result.brokerShare + result.companyShare + result.managerBonus).toBe(result.total)
  })
})
