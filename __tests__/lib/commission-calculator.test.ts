import { describe, it, expect } from 'vitest'
import { calculateCommission } from '@/lib/commission-calculator'

describe('calculateCommission', () => {
  it('5% z ceny 1 000 000 → celková provize 50 000', () => {
    const result = calculateCommission(1_000_000, 'TIPAR')
    expect(result.total).toBe(50_000)
  })

  it('minimální provize 25 000 Kč pro nízkou cenu', () => {
    const result = calculateCommission(100_000, 'TIPAR')
    expect(result.total).toBe(25_000)
  })

  it('hraniční cena 500 000 — přesně 25 000', () => {
    const result = calculateCommission(500_000, 'TIPAR')
    expect(result.total).toBe(25_000)
  })

  it('Tipař dostane 30% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'TIPAR')
    expect(result.brokerShare).toBe(15_000)
    expect(result.brokerRate).toBe(0.30)
  })

  it('Junior dostane 40% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'JUNIOR')
    expect(result.brokerShare).toBe(20_000)
    expect(result.brokerRate).toBe(0.40)
  })

  it('Senior dostane 55% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'SENIOR')
    expect(result.brokerShare).toBe(27_500)
    expect(result.brokerRate).toBe(0.55)
  })

  it('Expert dostane 65% celkové provize', () => {
    const result = calculateCommission(1_000_000, 'EXPERT')
    expect(result.brokerShare).toBe(32_500)
    expect(result.brokerRate).toBe(0.65)
  })

  it('TIP bonus +5%', () => {
    const result = calculateCommission(1_000_000, 'TIPAR', true)
    expect(result.brokerRate).toBe(0.35)
    expect(result.brokerShare).toBe(17_500)
  })

  it('manažerský bonus je 2 500 Kč', () => {
    const result = calculateCommission(1_000_000, 'TIPAR')
    expect(result.managerBonus).toBe(2_500)
  })

  it('rozložení sedí — broker + firma + manažer = total', () => {
    const result = calculateCommission(800_000, 'JUNIOR')
    expect(result.brokerShare + result.companyShare + result.managerBonus).toBe(result.total)
  })

  it('default level je TIPAR (bez parametru)', () => {
    const result = calculateCommission(1_000_000)
    expect(result.brokerRate).toBe(0.30)
  })
})
