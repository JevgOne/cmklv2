import { describe, it, expect } from 'vitest'
import { calculateLevel, getLevelByKey, LEVELS, ACHIEVEMENTS } from '@/lib/gamification'

describe('calculateLevel (points-based)', () => {
  it('0 bodů → TIPAR', () => {
    const level = calculateLevel(0)
    expect(level.key).toBe('TIPAR')
  })

  it('299 bodů → stále TIPAR', () => {
    const level = calculateLevel(299)
    expect(level.key).toBe('TIPAR')
  })

  it('300 bodů → JUNIOR', () => {
    const level = calculateLevel(300)
    expect(level.key).toBe('JUNIOR')
  })

  it('499 bodů → stále JUNIOR', () => {
    const level = calculateLevel(499)
    expect(level.key).toBe('JUNIOR')
  })

  it('500 bodů → SENIOR', () => {
    const level = calculateLevel(500)
    expect(level.key).toBe('SENIOR')
  })

  it('649 bodů → stále SENIOR', () => {
    const level = calculateLevel(649)
    expect(level.key).toBe('SENIOR')
  })

  it('650 bodů → EXPERT', () => {
    const level = calculateLevel(650)
    expect(level.key).toBe('EXPERT')
  })

  it('1000 bodů → EXPERT', () => {
    const level = calculateLevel(1000)
    expect(level.key).toBe('EXPERT')
  })
})

describe('getLevelByKey', () => {
  it('vrátí level podle klíče', () => {
    const level = getLevelByKey('SENIOR')
    expect(level.key).toBe('SENIOR')
    expect(level.minPoints).toBe(500)
  })

  it('neznámý klíč → fallback TIPAR', () => {
    const level = getLevelByKey('NONEXISTENT')
    expect(level.key).toBe('TIPAR')
  })
})

describe('LEVELS a ACHIEVEMENTS', () => {
  it('LEVELS má 4 úrovně', () => {
    expect(LEVELS).toHaveLength(4)
  })

  it('LEVELS jsou seřazené dle minPoints', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minPoints).toBeGreaterThan(LEVELS[i - 1].minPoints)
    }
  })

  it('ACHIEVEMENTS má definované klíče', () => {
    expect(ACHIEVEMENTS.FIRST_VEHICLE).toBeDefined()
    expect(ACHIEVEMENTS.FIRST_SALE).toBeDefined()
    expect(ACHIEVEMENTS.MILLIONAIRE).toBeDefined()
  })
})
