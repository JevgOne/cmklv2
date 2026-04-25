import { describe, it, expect } from 'vitest'
import {
  calculateStarLevel,
  calculateStarProgress,
  getStarLevelByKey,
  STAR_LEVELS,
  REGION_THRESHOLDS,
} from '@/lib/broker-points'

describe('calculateStarLevel', () => {
  it('0 Kč → STAR_1 pro všechny regiony', () => {
    for (const tier of Object.keys(REGION_THRESHOLDS) as Array<keyof typeof REGION_THRESHOLDS>) {
      expect(calculateStarLevel(0, tier).key).toBe('STAR_1')
    }
  })

  it('STAR_5 prahy jsou správné', () => {
    expect(calculateStarLevel(6_000_000, 'PRAHA').key).toBe('STAR_5')
    expect(calculateStarLevel(4_500_000, 'BRNO').key).toBe('STAR_5')
    expect(calculateStarLevel(3_500_000, 'OSTRAVA_PLZEN').key).toBe('STAR_5')
    expect(calculateStarLevel(3_000_000, 'SMALL').key).toBe('STAR_5')
  })

  it('těsně pod prahem → nižší úroveň', () => {
    expect(calculateStarLevel(5_999_999, 'PRAHA').key).toBe('STAR_4')
    expect(calculateStarLevel(4_499_999, 'BRNO').key).toBe('STAR_4')
  })
})

describe('calculateStarProgress', () => {
  it('STAR_1 v Praze → progress k STAR_2', () => {
    const progress = calculateStarProgress(500_000, 'PRAHA')
    expect(progress.currentLevel.key).toBe('STAR_1')
    expect(progress.nextLevel?.key).toBe('STAR_2')
    expect(progress.revenueNeeded).toBe(1_000_000)
    expect(progress.percentage).toBe(33)
  })

  it('max level → 100% a null nextLevel', () => {
    const progress = calculateStarProgress(10_000_000, 'PRAHA')
    expect(progress.currentLevel.key).toBe('STAR_5')
    expect(progress.nextLevel).toBeNull()
    expect(progress.percentage).toBe(100)
    expect(progress.revenueNeeded).toBe(0)
  })

  it('přesně na prahu STAR_3 → 0% progress k STAR_4', () => {
    const progress = calculateStarProgress(2_500_000, 'PRAHA')
    expect(progress.currentLevel.key).toBe('STAR_3')
    expect(progress.nextLevel?.key).toBe('STAR_4')
    expect(progress.percentage).toBe(0)
    expect(progress.revenueNeeded).toBe(1_500_000)
  })
})

describe('getStarLevelByKey', () => {
  it('vrátí správný level', () => {
    expect(getStarLevelByKey('STAR_3').commissionRate).toBe(0.50)
    expect(getStarLevelByKey('STAR_5').commissionRate).toBe(0.60)
  })

  it('neznámý klíč → STAR_1', () => {
    expect(getStarLevelByKey('INVALID').key).toBe('STAR_1')
  })
})

describe('STAR_LEVELS konstanty', () => {
  it('5 úrovní s rostoucí provizí', () => {
    expect(STAR_LEVELS).toHaveLength(5)
    for (let i = 1; i < STAR_LEVELS.length; i++) {
      expect(STAR_LEVELS[i].commissionRate).toBeGreaterThan(STAR_LEVELS[i - 1].commissionRate)
    }
  })

  it('STAR_1 začíná od 0 Kč ve všech regionech', () => {
    for (const tier of Object.keys(REGION_THRESHOLDS) as Array<keyof typeof REGION_THRESHOLDS>) {
      expect(REGION_THRESHOLDS[tier].STAR_1).toBe(0)
    }
  })

  it('Praha má nejvyšší prahy', () => {
    for (const key of ['STAR_2', 'STAR_3', 'STAR_4', 'STAR_5'] as const) {
      expect(REGION_THRESHOLDS.PRAHA[key]).toBeGreaterThanOrEqual(REGION_THRESHOLDS.BRNO[key])
      expect(REGION_THRESHOLDS.BRNO[key]).toBeGreaterThanOrEqual(REGION_THRESHOLDS.OSTRAVA_PLZEN[key])
      expect(REGION_THRESHOLDS.OSTRAVA_PLZEN[key]).toBeGreaterThanOrEqual(REGION_THRESHOLDS.SMALL[key])
    }
  })
})
