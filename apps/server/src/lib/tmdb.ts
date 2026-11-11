const TMDB_BASE_URL = 'https://api.themoviedb.org/3/'

const ALLOWED_PATH =
  /^(?:trending\/(?:all|movie|tv)\/(?:day|week)|movie\/(?:popular|top_rated|now_playing|upcoming|\d+(?:\/(?:credits|videos|recommendations|similar|external_ids|release_dates))?)|tv\/(?:popular|top_rated|on_the_air|airing_today|\d+(?:\/(?:credits|aggregate_credits|videos|recommendations|similar|external_ids|content_ratings))?|\d+\/season\/\d+)|search\/(?:multi|movie|tv)|discover\/(?:movie|tv)|genre\/(?:movie|tv)\/list|person\/\d+(?:\/combined_credits)?)$/

const ALLOWED_PARAMS = new Set([
  'page',
  'query',
  'language',
  'region',
  'with_genres',
  'without_genres',
  'sort_by',
  'append_to_response',
  'year',
  'primary_release_year',
  'first_air_date_year',
  'vote_count.gte',
  'vote_average.gte',
  'primary_release_date.lte',
  'first_air_date.lte',
  'with_original_language',
  'with_networks',
  'with_companies',
])

export interface TmdbResponse {
  status: number
  body: unknown
}

interface CacheEntry {
  expiresAt: number
  value: TmdbResponse
}

export interface TmdbClientOptions {
  apiKey: string | undefined
  fetchImpl?: typeof fetch
  ttlMs?: number
  maxEntries?: number
}

export class TmdbClient {
  private readonly apiKey: string | undefined
  private readonly fetchImpl: typeof fetch
  private readonly ttlMs: number
  private readonly maxEntries: number
  private readonly cache = new Map<string, CacheEntry>()
  private readonly inflight = new Map<string, Promise<TmdbResponse>>()

  constructor(options: TmdbClientOptions) {
    this.apiKey = options.apiKey
    this.fetchImpl = options.fetchImpl ?? fetch
    this.ttlMs = options.ttlMs ?? 15 * 60 * 1000
    this.maxEntries = options.maxEntries ?? 2000
  }

  get configured(): boolean {
    return Boolean(this.apiKey)
  }

  static isAllowedPath(path: string): boolean {
    return ALLOWED_PATH.test(path)
  }

  static sanitizeQuery(query: Record<string, unknown>): URLSearchParams {
    const params = new URLSearchParams()
    for (const key of Object.keys(query).sort()) {
      const value = query[key]
      if (!ALLOWED_PARAMS.has(key) || typeof value !== 'string') continue
      if (value.length > 200) continue
      params.set(key, value)
    }
    params.set('include_adult', 'false')
    return params
  }

  async get(path: string, query: Record<string, unknown>): Promise<TmdbResponse> {
    if (!this.apiKey) return { status: 503, body: { message: 'TMDB API key is not configured' } }
    if (!TmdbClient.isAllowedPath(path)) return { status: 404, body: { message: 'Not found' } }

    const params = TmdbClient.sanitizeQuery(query)
    const cacheKey = `${path}?${params.toString()}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      this.cache.delete(cacheKey)
      this.cache.set(cacheKey, cached)
      return cached.value
    }

    const pending = this.inflight.get(cacheKey)
    if (pending) return pending

    const request = this.request(path, params).finally(() => this.inflight.delete(cacheKey))
    this.inflight.set(cacheKey, request)
    const result = await request
    if (result.status === 200) this.store(cacheKey, result)
    return result
  }

  private async request(path: string, params: URLSearchParams): Promise<TmdbResponse> {
    const url = new URL(path, TMDB_BASE_URL)
    const headers: Record<string, string> = { accept: 'application/json' }
    const key = this.apiKey ?? ''
    if (key.startsWith('eyJ')) {
      headers.authorization = `Bearer ${key}`
    } else {
      params.set('api_key', key)
    }
    url.search = params.toString()

    try {
      const response = await this.fetchImpl(url, {
        headers,
        signal: AbortSignal.timeout(10_000),
      })
      const body: unknown = await response.json().catch(() => ({}))
      if (response.status === 401) {
        return { status: 502, body: { message: 'TMDB rejected the configured API key' } }
      }
      return { status: response.status, body }
    } catch {
      return { status: 502, body: { message: 'Unable to reach TMDB' } }
    }
  }

  private store(key: string, value: TmdbResponse): void {
    if (this.cache.size >= this.maxEntries) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}
