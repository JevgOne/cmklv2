import { describe, it, expect } from 'vitest'
import { calculateLevel, getLevelByKey, LEVELS, ACHIEVEMENTS } from '@/lib/gamification'

describe('calculateLevel', () => {
  it('0 prodejů → JUNIOR', () => {
    const level = calculateLevel(0)
    expect(level.key).toBe('JUNIOR')
  })

  it('4 prodeje → stále JUNIOR', () => {
    const level = calculateLevel(4)
    expect(level.key).toBe('JUNIOR')
  })

  it('5 prodejů → BROKER', () => {
    const level = calculateLevel(5)
    expect(level.key).toBe('BROKER')
  })

  it('19 prodejů → stále BROKER', () => {
    const level = calculateLevel(19)
    expect(level.key).toBe('BROKER')
  })

  it('20 prodejů → SENIOR', () => {
    const level = calculateLevel(20)
    expect(level.key).toBe('SENIOR')
  })

  it('49 prodejů → stále SENIOR', () => {
    const level = calculateLevel(49)
    expect(level.key).toBe('SENIOR')
  })

  it('50 prodejů → TOP', () => {
    const level = calculateLevel(50)
    expect(level.key).toBe('TOP')
  })

  it('100 prodejů → TOP', () => {
    const level = calculateLevel(100)
    expect(level.key).toBe('TOP')
  })
})

describe('getLevelByKey', () => {
  it('vrátí level podle klíče', () => {
    const level = getLevelByKey('SENIOR')
    expect(level.key).toBe('SENIOR')
    expect(level.minSales).toBe(20)
  })

  it('neznámý klíč → fallback JUNIOR', () => {
    const level = getLevelByKey('NONEXISTENT')
    expect(level.key).toBe('JUNIOR')
  })
})

describe('LEVELS a ACHIEVEMENTS', () => {
  it('LEVELS má 4 úrovně', () => {
    expect(LEVELS).toHaveLength(4)
  })

  it('ACHIEVEMENTS má definované klíče', () => {
    expect(ACHIEVEMENTS.FIRST_VEHICLE).toBeDefined()
    expect(ACHIEVEMENTS.FIRST_SALE).toBeDefined()
    expect(ACHIEVEMENTS.MILLIONAIRE).toBeDefined()
  })
})
