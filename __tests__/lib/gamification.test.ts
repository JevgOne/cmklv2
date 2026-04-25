import { describe, it, expect } from 'vitest'
import { calculateStarLevel, getStarLevelByKey, STAR_LEVELS, ACHIEVEMENTS } from '@/lib/gamification'

describe('calculateStarLevel (revenue + region)', () => {
  it('0 Kč obrat → STAR_1 (SMALL region)', () => {
    const level = calculateStarLevel(0, 'SMALL')
    expect(level.key).toBe('STAR_1')
  })

  it('749 999 Kč → stále STAR_1 (SMALL)', () => {
    const level = calculateStarLevel(749_999, 'SMALL')
    expect(level.key).toBe('STAR_1')
  })

  it('750 000 Kč → STAR_2 (SMALL)', () => {
    const level = calculateStarLevel(750_000, 'SMALL')
    expect(level.key).toBe('STAR_2')
  })

  it('1 200 000 Kč → STAR_3 (SMALL)', () => {
    const level = calculateStarLevel(1_200_000, 'SMALL')
    expect(level.key).toBe('STAR_3')
  })

  it('2 000 000 Kč → STAR_4 (SMALL)', () => {
    const level = calculateStarLevel(2_000_000, 'SMALL')
    expect(level.key).toBe('STAR_4')
  })

  it('3 000 000 Kč → STAR_5 (SMALL)', () => {
    const level = calculateStarLevel(3_000_000, 'SMALL')
    expect(level.key).toBe('STAR_5')
  })

  it('1 500 000 Kč Praha → STAR_2', () => {
    const level = calculateStarLevel(1_500_000, 'PRAHA')
    expect(level.key).toBe('STAR_2')
  })

  it('1 499 999 Kč Praha → stále STAR_1', () => {
    const level = calculateStarLevel(1_499_999, 'PRAHA')
    expect(level.key).toBe('STAR_1')
  })

  it('6 000 000 Kč Praha → STAR_5', () => {
    const level = calculateStarLevel(6_000_000, 'PRAHA')
    expect(level.key).toBe('STAR_5')
  })

  it('1 200 000 Kč Brno → STAR_2', () => {
    const level = calculateStarLevel(1_200_000, 'BRNO')
    expect(level.key).toBe('STAR_2')
  })

  it('1 000 000 Kč Ostrava/Plzeň → STAR_2', () => {
    const level = calculateStarLevel(1_000_000, 'OSTRAVA_PLZEN')
    expect(level.key).toBe('STAR_2')
  })

  it('defaultuje na SMALL pro neznámý region', () => {
    const level = calculateStarLevel(750_000, 'UNKNOWN_REGION')
    expect(level.key).toBe('STAR_2')
  })
})

describe('getStarLevelByKey', () => {
  it('vrátí level podle klíče', () => {
    const level = getStarLevelByKey('STAR_3')
    expect(level.key).toBe('STAR_3')
    expect(level.commissionRate).toBe(0.50)
  })

  it('neznámý klíč → fallback STAR_1', () => {
    const level = getStarLevelByKey('NONEXISTENT')
    expect(level.key).toBe('STAR_1')
  })
})

describe('STAR_LEVELS a ACHIEVEMENTS', () => {
  it('STAR_LEVELS má 5 úrovní', () => {
    expect(STAR_LEVELS).toHaveLength(5)
  })

  it('provize jsou 30/40/50/55/60%', () => {
    expect(STAR_LEVELS.map(l => l.commissionRate)).toEqual([0.30, 0.40, 0.50, 0.55, 0.60])
  })

  it('ACHIEVEMENTS má definované klíče', () => {
    expect(ACHIEVEMENTS.FIRST_VEHICLE).toBeDefined()
    expect(ACHIEVEMENTS.FIRST_SALE).toBeDefined()
    expect(ACHIEVEMENTS.MILLIONAIRE).toBeDefined()
  })
})
