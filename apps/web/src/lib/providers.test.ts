import { describe, expect, it } from 'vitest'
import { buildEmbedUrl, parsePlayerMessage, type Provider } from './providers'

const provider: Provider = {
  id: 'example',
  name: 'Example',
  movie: 'https://example.com/movie/{id}',
  tv: 'https://example.com/tv/{id}/{season}/{episode}',
}

describe('buildEmbedUrl', () => {
  it('builds movie urls', () => {
    expect(buildEmbedUrl(provider, { mediaType: 'movie', tmdbId: 550 })).toBe(
      'https://example.com/movie/550',
    )
  })

  it('builds tv urls with season and episode', () => {
    expect(buildEmbedUrl(provider, { mediaType: 'tv', tmdbId: 1399, season: 2, episode: 5 })).toBe(
      'https://example.com/tv/1399/2/5',
    )
  })

  it('defaults to the first episode', () => {
    expect(buildEmbedUrl(provider, { mediaType: 'tv', tmdbId: 1399 })).toBe(
      'https://example.com/tv/1399/1/1',
    )
  })
})

describe('parsePlayerMessage', () => {
  it('reads nested player events', () => {
    expect(
      parsePlayerMessage({
        type: 'PLAYER_EVENT',
        data: { event: 'timeupdate', currentTime: 120, duration: 600 },
      }),
    ).toEqual({ position: 120, duration: 600 })
  })

  it('reads json string payloads', () => {
    expect(parsePlayerMessage(JSON.stringify({ timestamp: 30, duration: 90 }))).toEqual({
      position: 30,
      duration: 90,
    })
  })

  it('ignores unrelated messages', () => {
    expect(parsePlayerMessage('hello')).toBeNull()
    expect(parsePlayerMessage({ type: 'resize', height: 100 })).toBeNull()
  })
})
