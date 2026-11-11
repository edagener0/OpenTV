import { describe, expect, it } from 'vitest'
import { pickSeason, playableSeasons, type SeasonSummary } from './tmdb'

function season(number: number, episodes = 10): SeasonSummary {
  return {
    id: number + 100,
    season_number: number,
    name: number === 0 ? 'Specials' : `Season ${number}`,
    episode_count: episodes,
    poster_path: null,
    air_date: null,
  }
}

describe('playableSeasons', () => {
  it('puts specials after the regular seasons and drops empty ones', () => {
    const result = playableSeasons([season(0), season(1), season(2), season(3, 0)])
    expect(result.map((item) => item.season_number)).toEqual([1, 2, 0])
  })

  it('keeps specials when they are the only content', () => {
    expect(playableSeasons([season(0)]).map((item) => item.season_number)).toEqual([0])
  })
})

describe('pickSeason', () => {
  const seasons = playableSeasons([season(0), season(1), season(2)])

  it('defaults to the first regular season instead of specials', () => {
    expect(pickSeason(seasons, null)).toBe(1)
    expect(pickSeason(seasons, '')).toBe(1)
  })

  it('honours an explicit valid season, including specials', () => {
    expect(pickSeason(seasons, '2')).toBe(2)
    expect(pickSeason(seasons, '0')).toBe(0)
  })

  it('falls back to the first entry for unknown seasons', () => {
    expect(pickSeason(seasons, '9')).toBe(1)
    expect(pickSeason(seasons, 'abc')).toBe(1)
  })

  it('uses the first entry when a show has no season 1', () => {
    expect(pickSeason(playableSeasons([season(0), season(2024), season(2025)]), null)).toBe(2024)
  })
})
