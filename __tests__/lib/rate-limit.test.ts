import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('první request prochází', () => {
    const result = rateLimit('test-ip-1', 5, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('povolí přesně limit requestů', () => {
    const ip = 'test-ip-2'
    const limit = 3

    for (let i = 0; i < limit; i++) {
      const result = rateLimit(ip, limit, 60000)
      expect(result.success).toBe(true)
    }
  })

  it('odmítne po překročení limitu', () => {
    const ip = 'test-ip-3'
    const limit = 2

    rateLimit(ip, limit, 60000)
    rateLimit(ip, limit, 60000)

    const result = rateLimit(ip, limit, 60000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resetuje po uplynutí okna', () => {
    const ip = 'test-ip-4'
    const limit = 1
    const windowMs = 10000

    rateLimit(ip, limit, windowMs)
    const blocked = rateLimit(ip, limit, windowMs)
    expect(blocked.success).toBe(false)

    // Posuň čas za okno
    vi.advanceTimersByTime(windowMs + 1)

    const afterReset = rateLimit(ip, limit, windowMs)
    expect(afterReset.success).toBe(true)
  })

  it('různé IP mají nezávislé countery', () => {
    const limit = 1

    const r1 = rateLimit('ip-a', limit, 60000)
    expect(r1.success).toBe(true)

    const r2 = rateLimit('ip-b', limit, 60000)
    expect(r2.success).toBe(true)

    // ip-a je vyčerpaná
    const r3 = rateLimit('ip-a', limit, 60000)
    expect(r3.success).toBe(false)

    // ip-b je také vyčerpaná
    const r4 = rateLimit('ip-b', limit, 60000)
    expect(r4.success).toBe(false)
  })
})
