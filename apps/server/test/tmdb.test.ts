import { afterEach, describe, expect, it, vi } from 'vitest'
import { TmdbClient } from '../src/lib/tmdb.js'
import { createTestApp, type TestContext } from './helpers.js'

describe('TmdbClient', () => {
  it('allows only known endpoints', () => {
    expect(TmdbClient.isAllowedPath('trending/all/day')).toBe(true)
    expect(TmdbClient.isAllowedPath('movie/550')).toBe(true)
    expect(TmdbClient.isAllowedPath('tv/1399/season/1')).toBe(true)
    expect(TmdbClient.isAllowedPath('account/123')).toBe(false)
    expect(TmdbClient.isAllowedPath('movie/550/../../account')).toBe(false)
  })

  it('filters query parameters and forces safe search', () => {
    const params = TmdbClient.sanitizeQuery({ page: '2', api_key: 'leak', include_adult: 'true' })
    expect(params.get('page')).toBe('2')
    expect(params.get('api_key')).toBeNull()
    expect(params.get('include_adult')).toBe('false')
  })

  it('caches successful responses and deduplicates concurrent requests', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ results: [] }))
    const client = new TmdbClient({ apiKey: 'key', fetchImpl: fetchImpl as unknown as typeof fetch })
    await Promise.all([client.get('movie/popular', {}), client.get('movie/popular', {})])
    await client.get('movie/popular', {})
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('uses bearer authentication for read access tokens', async () => {
    const fetchImpl = vi.fn(async (_url: URL, _init: RequestInit) => Response.json({}))
    const client = new TmdbClient({
      apiKey: 'eyJtoken',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await client.get('movie/550', {})
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url.searchParams.get('api_key')).toBeNull()
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer eyJtoken')
  })
})

describe('tmdb routes', () => {
  let ctx: TestContext | undefined

  afterEach(async () => {
    await ctx?.cleanup()
  })

  it('proxies allowed requests', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ id: 550, title: 'Fight Club' }))
    ctx = await createTestApp({}, fetchImpl as unknown as typeof fetch)
    const response = await ctx.app.inject({ method: 'GET', url: '/api/tmdb/movie/550' })
    expect(response.statusCode).toBe(200)
    expect(response.json().title).toBe('Fight Club')
  })

  it('reports missing configuration', async () => {
    ctx = await createTestApp({ TMDB_API_KEY: '' })
    const response = await ctx.app.inject({ method: 'GET', url: '/api/tmdb/movie/550' })
    expect(response.statusCode).toBe(503)
    const info = await ctx.app.inject({ method: 'GET', url: '/api/server-info' })
    expect(info.json().tmdbConfigured).toBe(false)
  })

  it('serves the provider list', async () => {
    ctx = await createTestApp()
    const response = await ctx.app.inject({ method: 'GET', url: '/api/providers' })
    expect(response.statusCode).toBe(200)
    expect(response.json().providers.length).toBeGreaterThan(10)
  })
})
