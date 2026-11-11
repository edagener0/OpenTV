import { describe, expect, it } from 'vitest'
import { episodeLabel, formatRuntime, formatWatchTime } from './format'

describe('format', () => {
  it('formats runtimes', () => {
    expect(formatRuntime(45)).toBe('45m')
    expect(formatRuntime(120)).toBe('2h')
    expect(formatRuntime(139)).toBe('2h 19m')
    expect(formatRuntime(0)).toBeNull()
  })

  it('formats watch time', () => {
    expect(formatWatchTime(0)).toBe('0m')
    expect(formatWatchTime(30)).toBe('<1m')
    expect(formatWatchTime(3_660)).toBe('1h 1m')
    expect(formatWatchTime(90_000)).toBe('1d 1h')
  })

  it('formats episode labels', () => {
    expect(episodeLabel(1, 3)).toBe('S1 E3')
    expect(episodeLabel(null, null)).toBeNull()
  })
})
