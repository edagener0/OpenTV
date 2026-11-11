import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clientHeaders, createTestApp, registerUser, type TestContext } from './helpers.js'

describe('library', () => {
  let ctx: TestContext
  let cookie: string

  beforeEach(async () => {
    ctx = await createTestApp()
    cookie = await registerUser(ctx.app)
  })

  afterEach(async () => {
    await ctx.cleanup()
  })

  const heartbeat = (payload: Record<string, unknown>) =>
    ctx.app.inject({
      method: 'POST',
      url: '/api/library/history/heartbeat',
      headers: { ...clientHeaders, cookie },
      payload,
    })

  it('requires authentication', async () => {
    const response = await ctx.app.inject({ method: 'GET', url: '/api/library/favorites' })
    expect(response.statusCode).toBe(401)
  })

  it('adds, lists and removes favorites', async () => {
    const add = await ctx.app.inject({
      method: 'PUT',
      url: '/api/library/favorites/movie/550',
      headers: { ...clientHeaders, cookie },
      payload: { title: 'Fight Club', posterPath: '/poster.jpg', voteAverage: 8.4 },
    })
    expect(add.statusCode).toBe(200)

    const check = await ctx.app.inject({
      method: 'GET',
      url: '/api/library/favorites/movie/550',
      headers: { cookie },
    })
    expect(check.json().favorite).toBe(true)

    const list = await ctx.app.inject({
      method: 'GET',
      url: '/api/library/favorites',
      headers: { cookie },
    })
    expect(list.json().items).toHaveLength(1)
    expect(list.json().items[0].title).toBe('Fight Club')

    const remove = await ctx.app.inject({
      method: 'DELETE',
      url: '/api/library/favorites/movie/550',
      headers: { ...clientHeaders, cookie },
    })
    expect(remove.statusCode).toBe(204)
  })

  it('rejects invalid image paths', async () => {
    const response = await ctx.app.inject({
      method: 'PUT',
      url: '/api/library/favorites/movie/550',
      headers: { ...clientHeaders, cookie },
      payload: { title: 'Fight Club', posterPath: 'https://evil.example/x.jpg' },
    })
    expect(response.statusCode).toBe(400)
  })

  it('tracks progress, continue watching and stats', async () => {
    await heartbeat({
      mediaType: 'movie',
      tmdbId: 550,
      title: 'Fight Club',
      genres: ['Drama'],
      runtimeMinutes: 2,
      seconds: 60,
    })
    await heartbeat({
      mediaType: 'tv',
      tmdbId: 1399,
      season: 1,
      episode: 2,
      title: 'Game of Thrones',
      genres: ['Drama', 'Fantasy'],
      seconds: 30,
      position: 600,
      duration: 3000,
    })

    const continueWatching = await ctx.app.inject({
      method: 'GET',
      url: '/api/library/continue',
      headers: { cookie },
    })
    const items = continueWatching.json().items
    expect(items).toHaveLength(2)
    expect(items[0].tmdbId).toBe(1399)
    expect(items[0].progress).toBeCloseTo(0.2)
    expect(items[1].progress).toBeCloseTo(0.5)

    await heartbeat({ mediaType: 'movie', tmdbId: 550, title: 'Fight Club', seconds: 60 })

    const after = await ctx.app.inject({
      method: 'GET',
      url: '/api/library/continue',
      headers: { cookie },
    })
    expect(after.json().items.map((item: { tmdbId: number }) => item.tmdbId)).toEqual([1399])

    const stats = await ctx.app.inject({ method: 'GET', url: '/api/library/stats', headers: { cookie } })
    const body = stats.json()
    expect(body.totalSeconds).toBe(150)
    expect(body.moviesWatched).toBe(1)
    expect(body.showsWatched).toBe(1)
    expect(body.episodesWatched).toBe(1)
    expect(body.topGenres[0]).toEqual({ name: 'Drama', seconds: 150 })
    expect(body.activity).toHaveLength(30)
    expect(body.activity.at(-1).seconds).toBe(150)
    expect(body.streak).toBe(1)
  })

  it('caps heartbeat durations', async () => {
    const response = await heartbeat({
      mediaType: 'movie',
      tmdbId: 1,
      title: 'Test',
      seconds: 100000,
    })
    expect(response.statusCode).toBe(400)
  })

  it('clears history', async () => {
    await heartbeat({ mediaType: 'movie', tmdbId: 1, title: 'Test', seconds: 30 })
    const clear = await ctx.app.inject({
      method: 'DELETE',
      url: '/api/library/history',
      headers: { ...clientHeaders, cookie },
    })
    expect(clear.statusCode).toBe(204)
    const history = await ctx.app.inject({
      method: 'GET',
      url: '/api/library/history',
      headers: { cookie },
    })
    expect(history.json().items).toHaveLength(0)
  })

  it('isolates data between users', async () => {
    await heartbeat({ mediaType: 'movie', tmdbId: 1, title: 'Test', seconds: 30 })
    const other = await registerUser(ctx.app, 'bob')
    const history = await ctx.app.inject({
      method: 'GET',
      url: '/api/library/history',
      headers: { cookie: other },
    })
    expect(history.json().items).toHaveLength(0)
  })
})
